"""Forward complete serial lines to the C++ receiver; no interactive monitor."""

import argparse
from pathlib import Path
import subprocess
import sys

try:
    import serial
except ImportError:
    raise SystemExit("pyserial is required; use PlatformIO's penv/bin/python.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("port", nargs="?", default="/dev/ttyUSB0")
    parser.add_argument("--alerts", default="alerts.jsonl", help="append-only alert file")
    args = parser.parse_args()
    receiver = Path(__file__).resolve().parent / "build" / "serial_readings"
    if not receiver.is_file():
        raise SystemExit("Build first: python3 tools/build_receiver.py")

    port = serial.Serial(port=None, baudrate=115200, timeout=0.5, exclusive=True)
    port.dtr = False
    port.rts = False
    port.port = args.port
    process = None
    try:
        port.open()
        process = subprocess.Popen([str(receiver), args.alerts], stdin=subprocess.PIPE)
        print(f"Reading {args.port} at 115200; Ctrl+C to stop.", file=sys.stderr)
        pending = bytearray()
        discard = False
        while True:
            if process.poll() is not None:
                print("C++ receiver stopped; check its error above.", file=sys.stderr)
                return 1
            chunk = port.read(512)
            for byte in chunk:
                if byte == 10:
                    if not discard:
                        process.stdin.write(pending + b"\n")
                        process.stdin.flush()
                    pending.clear()
                    discard = False
                elif not discard:
                    pending.append(byte)
                    if len(pending) > 4096:
                        print("Skipped serial line exceeding 4096 bytes", file=sys.stderr)
                        pending.clear()
                        discard = True
    except KeyboardInterrupt:
        print("\nStopped.", file=sys.stderr)
    except (serial.SerialException, OSError) as error:
        print(f"USB receiver error: {error}", file=sys.stderr)
        return 1
    finally:
        port.close()
        if process is not None:
            try:
                process.stdin.close()
            except BrokenPipeError:
                pass
            try:
                process.wait(timeout=2)
            except subprocess.TimeoutExpired:
                process.terminate()
                process.wait()
    return 0


if __name__ == "__main__":
    sys.exit(main())
