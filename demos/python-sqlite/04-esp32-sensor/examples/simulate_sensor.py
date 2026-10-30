"""Print three pretend sensor readings. Run with Python 3.12 or newer."""

import json


class SimulatedSensor:
    """Each sensor object remembers its device and shipment IDs."""

    def __init__(self, device_id, shipment_id):
        self.device_id = device_id
        self.shipment_id = shipment_id

    def reading(self, reading_id, recorded_at, temperature):
        return {
            "reading_id": reading_id,
            "device_id": self.device_id,
            "shipment_id": self.shipment_id,
            "recorded_at": recorded_at,
            "temperature": temperature,
            "unit": "C",
        }


def demo_readings():
    sensor = SimulatedSensor("sensor-demo-01", "shipment-demo-01")
    return [
        sensor.reading("demo-001", "2026-09-28T00:00:00+00:00", 5.0),
        sensor.reading("demo-002", "2026-09-28T00:00:10+00:00", 9.0),
        sensor.reading("demo-003", "2026-09-28T00:00:20+00:00", 12.0),
    ]


if __name__ == "__main__":
    for reading in demo_readings():
        print(json.dumps(reading))
