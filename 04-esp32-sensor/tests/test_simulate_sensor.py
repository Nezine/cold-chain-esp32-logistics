"""Check the simulator's output; this does not test a backend or real hardware."""

import json
from pathlib import Path
import subprocess
import sys
import unittest
from datetime import datetime

SCRIPT = Path(__file__).resolve().parents[1] / "examples" / "simulate_sensor.py"


def run_demo():
    result = subprocess.run(
        [sys.executable, str(SCRIPT)], capture_output=True, text=True, check=True
    )
    return [json.loads(line) for line in result.stdout.splitlines()]


class SensorExamplesTest(unittest.TestCase):
    def test_demo_contains_three_distinct_readings(self):
        readings = run_demo()
        self.assertEqual([r["temperature"] for r in readings], [5.0, 9.0, 12.0])
        self.assertEqual(len({r["reading_id"] for r in readings}), 3)

    def test_readings_have_the_proposed_fields_and_sample_interval(self):
        readings = run_demo()
        for reading in readings:
            self.assertEqual(set(reading), {
                "reading_id", "device_id", "shipment_id", "recorded_at",
                "temperature", "unit",
            })
            self.assertEqual(reading["device_id"], "sensor-demo-01")
            self.assertEqual(reading["shipment_id"], "shipment-demo-01")
            self.assertEqual(reading["unit"], "C")
            self.assertIsNotNone(datetime.fromisoformat(reading["recorded_at"]).tzinfo)
        times = [datetime.fromisoformat(r["recorded_at"]) for r in readings]
        self.assertEqual((times[1] - times[0]).total_seconds(), 10)
        self.assertEqual((times[2] - times[1]).total_seconds(), 10)

    def test_rerunning_the_demo_produces_the_same_data(self):
        self.assertEqual(run_demo(), run_demo())


if __name__ == "__main__":
    unittest.main()
