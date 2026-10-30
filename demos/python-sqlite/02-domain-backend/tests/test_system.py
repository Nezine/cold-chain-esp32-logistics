import json
import sys
import tempfile
import threading
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from domain import TemperaturePolicy
from repository import ShipmentRepository
from service import ColdChainService
from server import make_server


class SystemTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parent)
        self.path = str(Path(self.temp.name) / "test.sqlite3")
        self.repo = ShipmentRepository(self.path)
        self.service = ColdChainService(self.repo)
        self.shipment = self.service.create({"name": "Demo", "min": 2, "max": 8, "deviceId": "sensor-1"})
        self.tick = 0

    def tearDown(self):
        self.repo.close()
        self.temp.cleanup()

    def reading(self, temperature):
        self.tick += 1
        return {"shipmentId": self.shipment["id"], "deviceId": "sensor-1", "readingId": f"r-{self.tick}",
                "temperature": temperature, "unit": "C",
                "time": (datetime.now(timezone.utc) - timedelta(seconds=20-self.tick)).isoformat()}

    def test_boundaries(self):
        for t, expected in [(-.01,"critical"),(0,"warning"),(1.99,"warning"),(2,"normal"),
                            (8,"normal"),(8.01,"warning"),(10,"warning"),(10.01,"critical")]:
            with self.subTest(t=t):
                self.assertEqual(TemperaturePolicy().classify(t), expected)

    def test_complete_flow_and_persistence(self):
        sid = self.shipment["id"]
        self.service.dispatch(sid, {"vehicle": "Truck A", "status": "in_transit"})
        for t in [5,9,12]:
            shipment = self.service.ingest(self.reading(t))
        alert = shipment["alerts"][0]
        shipment = self.service.respond(sid, {"alertId": alert["id"], "action": "inspect", "note": "Checked cooling"})
        self.assertEqual(shipment["temperature"], 12)
        self.assertEqual(shipment["alerts"][0]["status"], "acknowledged")
        with self.assertRaises(ValueError):
            self.service.dispatch(sid, {"vehicle": "Truck A", "status": "delivered"})
        shipment = self.service.ingest(self.reading(5))
        self.assertEqual(shipment["alerts"][0]["status"], "recovered")
        self.service.dispatch(sid, {"vehicle": "Truck A", "status": "delivered"})
        self.repo.close()
        self.repo = ShipmentRepository(self.path)
        saved = self.repo.get(sid)
        self.assertEqual(saved["status"], "delivered")
        self.assertEqual(len(saved["history"]), 4)
        self.assertEqual(saved["alerts"][0]["responses"][0]["note"], "Checked cooling")

    def test_duplicate_and_conflicting_id(self):
        reading = self.reading(12)
        self.service.ingest(reading)
        self.service.ingest(reading)
        self.assertEqual(len(self.repo.readings(1)), 1)
        self.assertEqual(len(self.repo.alerts(1)), 1)
        with self.assertRaises(ValueError):
            self.service.ingest({**reading, "temperature": 5})

    def test_sustained_alert_and_escalation(self):
        for t in [9, 9.5, 12]:
            result = self.service.ingest(self.reading(t))
        self.assertEqual(len(result["alerts"]), 2)
        self.assertEqual(result["alerts"][1]["status"], "superseded")

    def test_invalid_readings(self):
        for override in [{"temperature": True}, {"temperature": float("nan")}, {"temperature": "5"},
                         {"unit": "F"}, {"deviceId": "wrong"}, {"time": "2026-01-01"},
                         {"time": "2999-01-01T00:00:00Z"}, {"readingId": ""}, {"shipmentId": True}]:
            with self.subTest(override=override), self.assertRaises(ValueError):
                self.service.ingest({**self.reading(5), **override})
        self.assertEqual(self.repo.readings(1), [])

    def test_out_of_order_and_missing_shipment(self):
        old = self.reading(5)
        self.service.ingest(self.reading(9))
        with self.assertRaises(ValueError):
            self.service.ingest(old)
        with self.assertRaises(LookupError):
            self.service.ingest({**self.reading(5), "shipmentId": 999})

    def test_stale_and_empty(self):
        self.assertEqual(self.repo.get(1)["connection"], "loading")
        reading = self.reading(5)
        reading["time"] = (datetime.now(timezone.utc) - timedelta(seconds=40)).isoformat()
        self.assertEqual(self.service.ingest(reading)["connection"], "timeout")

    def test_state_machine_and_validation(self):
        with self.assertRaises(ValueError):
            self.service.dispatch(1, {"status": "delivered", "vehicle": "A"})
        with self.assertRaises(ValueError):
            self.service.create({"name":"bad", "min":8, "max":2, "deviceId":"s"})
        self.service.dispatch(1, {"status":"in_transit", "vehicle":"A"})
        with self.assertRaises(ValueError):
            self.service.dispatch(1, {"status":"delivered", "vehicle":"A"})
        self.service.ingest(self.reading(5))
        self.service.dispatch(1, {"status":"delivered", "vehicle":"A"})
        with self.assertRaises(ValueError):
            self.service.ingest(self.reading(5))

    def test_observer_failure_rolls_back(self):
        def fail(*args):
            raise RuntimeError("observer failed")
        self.service.subject.subscribe(fail)
        with self.assertRaises(RuntimeError):
            self.service.ingest(self.reading(12))
        self.assertEqual(self.repo.readings(1), [])
        self.assertEqual(self.repo.alerts(1), [])

    def test_http_contract(self):
        server = make_server(0, self.path)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        base = f"http://127.0.0.1:{server.server_port}/api"
        try:
            with urlopen(base + "/shipments") as response:
                self.assertEqual(json.load(response)[0]["name"], "Demo")
            # Repeated creation (even with identical names) must allocate new IDs.
            created_ids = []
            for index in range(3):
                payload = {"name":"Same display name", "min":2, "max":8, "deviceId":f"sensor-extra-{index}"}
                with urlopen(Request(base + "/shipments", json.dumps(payload).encode(), {"Content-Type":"application/json"})) as response:
                    self.assertEqual(response.status, 201)
                    created_ids.append(json.load(response)["id"])
            self.assertEqual(len(set(created_ids)), 3)
            with urlopen(base + "/shipments") as response:
                self.assertEqual(len(json.load(response)), 4)
            req = Request(base + "/readings", json.dumps(self.reading(12)).encode(), {"Content-Type":"application/json"})
            with urlopen(req) as response:
                self.assertEqual(response.status, 201)
                self.assertEqual(json.load(response)["severity"], "critical")
            with self.assertRaises(HTTPError) as error:
                urlopen(Request(base + "/readings", b"{}"))
            self.assertEqual(error.exception.code, 400)
            error.exception.close()
        finally:
            server.shutdown()
            server.server_close()
            thread.join()


if __name__ == "__main__":
    unittest.main()
