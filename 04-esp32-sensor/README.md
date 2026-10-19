# ESP32 Firmware

The current C++ firmware produces simulated readings on an ESP32 and prints
one JSON object per line over USB serial. It cycles through 2, 8, 8.1, 10, and 10.1 degrees
Celsius every two seconds. It does not yet read hardware or send to a backend.

- Firmware source code: `src/`
- Board configuration: `platformio.ini` (ESP32 Dev Module, Arduino framework).
- Exercises: `exercises/`
- Design notes and deliverables: `notes/` and `deliverables/`

## Build and run

Open this folder in VS Code with PlatformIO. Build, connect the ESP32 by USB,
then Upload and open Monitor at 115200 baud. Press EN/RESET to restart.
Alternatively, from the repository root:

```sh
pio run -d 04-esp32-sensor
pio run -d 04-esp32-sensor -t upload
pio device monitor -b 115200
```

Example output (uptime varies):

```json
{"device_id":"device1","shipment_id":"shipment1","sequence":0,"uptime_ms":100,"temperature":2.00,"unit":"C"}
{"device_id":"device1","shipment_id":"shipment1","sequence":1,"uptime_ms":2100,"temperature":8.00,"unit":"C"}
{"device_id":"device1","shipment_id":"shipment1","sequence":2,"uptime_ms":4100,"temperature":8.10,"unit":"C"}
```

The next readings are 10 and 10.1 degrees, then the cycle returns to 2. Boot messages may appear
before the JSON. `uptime_ms` is elapsed time since boot, not a wall-clock time;
it wraps after approximately 50 days. Sequence numbers reset after reboot and
are not globally unique reading IDs. This is a draft serial format, distinct
from the earlier Python fixture's timestamp/reading ID contract. Agree on the
backend format before integration.

IDs are fixed simple strings; arbitrary IDs would require JSON escaping.
The firmware has no network or delivery retry. To send serial data to the C++
backend through the host bridge, follow the [backend handoff](../02-domain-backend/docs/HANDOFF.md).
Classification and persistence belong in that backend. A successful build verifies
compilation; live serial output must also be checked on the physical board.

## Next exercise

Add 5.0 to `demoTemperatures`, upload, and check that six readings repeat.
Explain why `demoCount` updates without changing the loop. Restore the original
five samples afterward if the team needs the original demonstration.
