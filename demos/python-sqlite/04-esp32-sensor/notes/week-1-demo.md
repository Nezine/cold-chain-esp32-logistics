# Three-reading sensor demo

A small host-side Python exercise; no hardware or third-party packages required.
This does not choose the team's backend language. Existing ESP32 files are unchanged.

## Run from the repository root

Use Python 3.12 or newer:

```sh
python3 04-esp32-sensor/examples/simulate_sensor.py
python3 -m unittest discover -s 04-esp32-sensor/tests -v
```

The script prints three JSON lines: 5°C, 9°C, then 12°C. Under the draft rules
in `02-domain-backend/notes/week-1-proposal.md`, these would represent normal,
warning, and critical conditions. The script itself does not classify them.

The SimulatedSensor class stores device and shipment IDs. Its reading method
combines those IDs with a measurement, timestamp, and reading ID. Three fixed
measurements make it easy to repeat the demo and compare results.

Timestamps represent ten-second intervals; the script prints immediately.
IDs and times repeat on every run. Use these as isolated test fixtures, not a
live stream. Sending repeated runs to a backend would require an agreed retry
and duplicate policy.

## What the checks prove

Three tests check the measurement sequence and distinct IDs, required fields
and timestamp intervals, and repeatability. GitHub Actions runs the same command.
These checks do not prove firmware, backend alerts, networking, or persistence.
All of those are still unimplemented. Duplicate/invalid/missing-reading scenarios
are future work, as are the rest of the Week 1 team decisions.
