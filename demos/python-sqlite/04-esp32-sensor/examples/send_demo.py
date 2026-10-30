"""End-to-end HTTP demo. Creates its own shipment; never resets existing data."""
import argparse
import json
import time
import uuid
from datetime import datetime, timezone
from urllib.request import Request, urlopen


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:8000")
    args = parser.parse_args()

    def post(path, data):
        request = Request(args.url + "/api" + path, json.dumps(data).encode(), {"Content-Type": "application/json"})
        with urlopen(request, timeout=10) as response:
            return json.load(response)

    device = "demo-" + uuid.uuid4().hex[:8]
    shipment = post("/shipments", {"name":"Cold-chain demo", "min":2, "max":8, "deviceId":device})
    sid = shipment["id"]
    post(f"/shipments/{sid}/dispatch", {"vehicle":"TRUCK-DEMO-01", "status":"in_transit"})
    for temperature in [5, 9, 12, 5]:
        shipment = post("/readings", {"shipmentId":sid, "deviceId":device, "readingId":str(uuid.uuid4()),
            "time":datetime.now(timezone.utc).isoformat(), "unit":"C", "temperature":temperature})
        print(f"Shipment {sid}: {temperature} C -> {shipment['severity']}", flush=True)
        if temperature == 12:
            shipment = post(f"/shipments/{sid}/responses", {"alertId":shipment["alerts"][0]["id"],
                "action":"moved_to_backup_cooler", "note":"Demo: moved to backup cooler"})
            assert shipment["temperature"] == 12
            print("Response recorded; temperature still 12 C", flush=True)
        time.sleep(2)
    shipment = post(f"/shipments/{sid}/dispatch", {"vehicle":"TRUCK-DEMO-01", "status":"delivered"})
    print(f"Shipment {sid}: {shipment['status']}; history and responses saved.")


if __name__ == "__main__":
    main()
