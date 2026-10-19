"""Translate ESP32 serial JSON to backend readings, from stdin or an optional USB port.
Host assigns UTC receive time; ESP32 uptime is not a wall-clock timestamp.
"""
import argparse
from datetime import datetime, timezone
import json
import sys
import urllib.error
import urllib.request
import uuid


def make_reading(raw, shipment_id, device_id, session_id):
    for key in ('sequence', 'uptime_ms'):
        if type(raw.get(key)) is not int or raw[key] < 0:
            raise ValueError(f'{key} must be a nonnegative integer')
    if raw.get('device_id') != device_id or not isinstance(raw.get('shipment_id'), str) or not raw['shipment_id'].strip():
        raise ValueError('device_id must match configured device and shipment_id must be present')
    # Numeric shipment mapping is explicit: firmware uses labels such as shipment1.
    return {'shipmentId': shipment_id, 'deviceId': device_id,
            'readingId': f'{device_id}:{session_id}:{raw["sequence"]}',
            'temperature': raw.get('temperature'), 'unit': raw.get('unit'),
            'time': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--shipment-id', type=int, required=True)
    parser.add_argument('--device-id', default='device1')
    parser.add_argument('--session-id', default=None, help='new boot session ID; stable value permits duplicate detection on replay')
    parser.add_argument('--url', default='http://127.0.0.1:8080/api/readings')
    parser.add_argument('--port', help='optional physical serial port, otherwise read stdin')
    args = parser.parse_args()
    session = args.session_id or uuid.uuid4().hex
    if args.shipment_id <= 0:
        parser.error('shipment-id must be positive')
    source = sys.stdin.buffer
    serial_port = None
    if args.port:
        try:
            import serial
            serial_port = serial.Serial(port=None, baudrate=115200, timeout=1, exclusive=True)
            serial_port.dtr = serial_port.rts = False
            serial_port.port = args.port
            serial_port.open()
            source = serial_port
        except (ImportError, OSError) as error:
            print(f'USB unavailable: {error}', file=sys.stderr)
            return 1
    print(f'Bridge session: {session}; restart with a new session after board reboot.', file=sys.stderr)
    failed = False
    try:
        while True:
            line = source.readline(4098)
            if not line:
                if serial_port:
                    continue
                break
            if len(line) > 4096:
                # Discard the remainder so one oversized input cannot become multiple readings.
                while line and not line.endswith(b'\n'):
                    line = source.readline(4098)
                print('Rejected serial line exceeding 4096 bytes', file=sys.stderr)
                failed = True
                continue
            if not line.lstrip().startswith(b'{'):
                continue  # ESP32 boot messages.
            try:
                raw = json.loads(line)
                body = make_reading(raw, args.shipment_id, args.device_id, session)
                request = urllib.request.Request(args.url, data=json.dumps(body, allow_nan=False).encode(),
                                                 headers={'Content-Type': 'application/json'}, method='POST')
                with urllib.request.urlopen(request, timeout=10) as response:
                    print(response.read().decode())
            except (ValueError, AttributeError, UnicodeError) as error:
                print(f'Rejected serial reading: {error}', file=sys.stderr)
                failed = True
            except urllib.error.HTTPError as error:
                print(f'Backend rejected reading ({error.code}): {error.read().decode()}', file=sys.stderr)
                failed = True
            except (urllib.error.URLError, OSError) as error:
                print(f'Backend unavailable: {error}', file=sys.stderr)
                return 1
    except KeyboardInterrupt:
        pass
    finally:
        if serial_port:
            serial_port.close()
    return 1 if failed else 0

if __name__ == '__main__':
    sys.exit(main())
