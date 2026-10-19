"""Reference HTTP adapter for team integration. Business rules run in the C++ CLI.
Dũng can replace this adapter while preserving the documented HTTP/CLI contract.
"""
import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]

class Handler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def reply(self, status, body):
        data = json.dumps(body, ensure_ascii=False, allow_nan=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        # Development clients use the CRA proxy; avoid wildcard credentialed CORS.
        self.send_header('Connection', 'close')
        self.end_headers()
        self.wfile.write(data)
        self.close_connection = True

    def do_GET(self):
        self.handle_request('GET')

    def do_POST(self):
        self.handle_request('POST')

    def handle_request(self, method):
        path = urlsplit(self.path).path
        command = None
        if method == 'GET':
            command = {'/api/shipments': ['shipments'], '/api/alerts': ['alerts'],
                       '/api/health': ['shipments']}.get(path)
            match = re.fullmatch(r'/api/shipments/([1-9][0-9]*)/readings', path)
            if match:
                command = ['readings', match[1]]
        else:
            command = {'/api/shipments': ['create-shipment'], '/api/readings': ['add-reading']}.get(path)
            match = re.fullmatch(r'/api/shipments/([1-9][0-9]*)/responses', path)
            if match:
                command = ['respond', match[1]]
        if command is None:
            self.reply(404, {'error': 'Route not found'})
            return
        data = ''
        if method == 'POST':
            if self.headers.get('Transfer-Encoding'):
                self.reply(400, {'error': 'Transfer-Encoding is unsupported; send Content-Length'})
                return
            if self.headers.get_content_type() != 'application/json':
                self.reply(415, {'error': 'Content-Type must be application/json'})
                return
            try:
                raw_length = self.headers.get('Content-Length', '')
                if not raw_length.isdecimal():
                    raise ValueError
                length = int(raw_length)
            except ValueError:
                self.reply(400, {'error': 'Invalid Content-Length'})
                return
            if length > 65536:
                self.reply(413, {'error': 'JSON input exceeds 64 KiB'})
                return
            try:
                raw = self.rfile.read(length)
                if len(raw) != length:
                    raise ValueError
                data = raw.decode('utf-8')
            except (UnicodeDecodeError, ValueError):
                self.reply(400, {'error': 'Invalid UTF-8 request body'})
                return
        try:
            result = subprocess.run([str(self.server.binary), str(self.server.state), *command],
                                    input=data, text=True, capture_output=True, timeout=15)
            response = json.loads(result.stdout)
            status, body = response['status'], response['body']
            if not isinstance(status, int) or not 200 <= status <= 599:
                raise ValueError('Invalid backend status')
            if result.returncode not in (0, 1) or (result.returncode == 0) != (status < 400):
                raise ValueError('Backend exit code disagrees with status')
            if path == '/api/health' and status == 200:
                body = {'status': 'ok', 'backend': 'cpp', 'shipments': len(body)}
            self.reply(status, body)
        except (OSError, subprocess.TimeoutExpired, ValueError, KeyError, TypeError):
            self.reply(503, {'error': 'C++ backend unavailable; inspect build and storage'})

    def setup(self):
        super().setup()
        self.connection.settimeout(15)


def make_server(state, host='127.0.0.1', port=8080):
    server = ThreadingHTTPServer((host, port), Handler)
    server.state = Path(state).resolve()
    server.binary = ROOT / 'build/backend'
    return server


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', required=True, help='state snapshot; parent directory must exist')
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=8080)
    args = parser.parse_args()
    if not (ROOT / 'build/backend').is_file():
        parser.error('Build first: python3 02-domain-backend/tools/build_backend.py')
    if not Path(args.state).resolve().parent.is_dir():
        parser.error('State parent directory must exist')
    server = make_server(args.state, args.host, args.port)
    print(f'Development adapter listening on {server.server_address}; Ctrl+C stops it.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == '__main__':
    main()
