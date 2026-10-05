# C++ USB receiver exercise

This host-side integration tool lives with the firmware on esp32-sensor.
It reads newline-delimited JSON from standard input and prints a condition.
The thresholds are the existing classroom proposal, pending team review.
AlertRepository appends each warning/critical reading to alerts.jsonl in the
current directory, retaining the original reading, severity, and open status.
Normal and invalid readings are not saved. Existing records survive restarts.
The application backend, responses, and deduplication remain future work.

Requires g++, pkg-config, and json-c (already available on the current machine).
From the repository root:

```sh
python3 04-esp32-sensor/tools/build_receiver.py
04-esp32-sensor/tools/build/serial_readings
```

The script also writes tools/build/compile_commands.json. For a VS Code window
opened at 04-esp32-sensor, set C_Cpp.default.compileCommands to
`${workspaceFolder}/tools/build/compile_commands.json` in workspace settings.
The matching host file uses g++; firmware continues using PlatformIO's settings.
Reload the window if existing IntelliSense diagnostics persist.

Manual build alternative:

```sh
g++ -std=c++17 -Wall -Wextra -pedantic 04-esp32-sensor/tools/serial_readings.cpp $(pkg-config --cflags --libs json-c) -o /tmp/cold-chain-receiver
/tmp/cold-chain-receiver
```

Paste a JSON reading from Monitor and press Enter. End with Ctrl+D.
Use 5, 9, and 12 degrees: expected NORMAL, WARNING, CRITICAL.

## Receive live USB readings on Linux

Close PlatformIO Monitor first so only this tool reads the serial port.
Connect the board and find its port with `pio device list`. Substitute the
actual port if it differs from /dev/ttyUSB0:

```sh
~/.platformio/penv/bin/python 04-esp32-sensor/tools/read_usb.py /dev/ttyUSB0
```

Press EN/RESET if necessary. Ctrl+C stops reception. Do not run Upload while
this receiver has the port open. Boot text is ignored; invalid JSON or missing,
incorrectly typed fields are reported and skipped. Only Celsius is supported.
Sequence and uptime must be nonnegative integers. Sequence resets on reboot;
duplicate handling and actual date/time remain future work.

The Python adapter uses pyserial (bundled with PlatformIO) to set DTR/RTS low,
read complete lines, and feed the C++ program. Classification remains in C++.
PlatformIO Monitor requires an interactive terminal and should not be piped.
If no classified output appears, stop this tool and run Monitor on its own:
`pio device monitor -p /dev/ttyUSB0 -b 115200 --dtr 0 --rts 0`.

## Your exercise

Rebuild with build_receiver.py after source changes. Run the USB adapter, stop
with Ctrl+C, and inspect alerts.jsonl. Restart and confirm older lines remain.
Use `--alerts /path/to/alerts.jsonl` on read_usb.py to choose the storage path;
the parent directory must exist. File errors stop the receiver rather than
claiming success. One process should write each file. This append/flush storage
does not guarantee recovery from partial writes or power loss.
Every unsafe reading is a separate alert; replayed readings currently duplicate
alerts, and sequence numbers restart on device reboot. No stable alert IDs yet.
Recovery readings do not erase previous alerts. Repository here means the
file-writing details live in a class instead of the temperature policy.

Predict and verify results for 2, 8, 8.1, 10, and 10.1 degrees by pasting readings.
Then change the JSON unit to F and explain why the receiver rejects it.
TemperaturePolicy owns the numeric rule; the main function parses and validates
the incoming data. json-c is a library for reading JSON reliably.

## Observer exercise

After validation, main publishes a reading through ReadingPublisher. Subscribers
implement ReadingObserver::onReading. TemperatureMonitor subscribes once, applies
TemperaturePolicy, saves unsafe readings through AlertRepository, and prints the
condition. Calls are synchronous; subscribers borrow the reading only during
notification. Subscribers must remain alive. Repeated subscription of the same
object is ignored. An observer exception stops processing and is reported; this
demo does not provide transactions across observers, replay, or durable delivery.

Next exercise: implement a second observer that counts accepted readings without
changing TemperatureMonitor. Invalid readings must not increase its count.
