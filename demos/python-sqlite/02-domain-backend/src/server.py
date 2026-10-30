"""Local HTTP API and optional built React frontend, Python standard library only."""
import argparse
import json
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit
from repository import ShipmentRepository
from service import ColdChainService

ROOT = Path(__file__).resolve().parents[2]


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT / "03-frontend/exercises/esp32/build"), **kwargs)

    def send_json(self, status, payload):
        content = json.dumps(payload, allow_nan=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def do_GET(self):
        if urlsplit(self.path).path.startswith("/api/"):
            self.api("GET")
        else:
            super().do_GET()

    def do_POST(self):
        self.api("POST")

    def api(self, method):
        repository = ShipmentRepository(self.server.database)
        try:
            service = ColdChainService(repository)
            parts = urlsplit(self.path).path.strip("/").split("/")
            data = {}
            if method == "POST":
                size = int(self.headers.get("Content-Length", "0"))
                if not 0 < size <= 16384:
                    raise ValueError("Request body must be 1–16384 bytes")
                data = json.loads(self.rfile.read(size))
                if not isinstance(data, dict):
                    raise ValueError("JSON body must be an object")
            status = 200
            if parts == ["api", "health"] and method == "GET":
                result = {"status": "ok"}
            elif parts == ["api", "shipments"]:
                result = repository.all() if method == "GET" else service.create(data)
                status = 200 if method == "GET" else 201
            elif parts == ["api", "readings"] and method == "POST":
                result, status = service.ingest(data), 201
            elif len(parts) == 4 and parts[:2] == ["api", "shipments"]:
                shipment_id = int(parts[2])
                if parts[3] == "readings" and method == "GET":
                    result = {"shipmentId": shipment_id, "readings": repository.readings(shipment_id)}
                elif parts[3] == "responses" and method == "POST":
                    result = service.respond(shipment_id, data)
                elif parts[3] == "dispatch" and method == "POST":
                    result = service.dispatch(shipment_id, data)
                else:
                    raise LookupError("Endpoint not found")
            else:
                raise LookupError("Endpoint not found")
            self.send_json(status, result)
        except (ValueError, TypeError, UnicodeDecodeError) as exc:
            self.send_json(400, {"error": str(exc)})
        except LookupError as exc:
            self.send_json(404, {"error": str(exc)})
        except Exception:
            self.send_json(500, {"error": "Internal server error"})
        finally:
            repository.close()


def make_server(port=8000, database=None):
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    server.database = str(database or ROOT / "02-domain-backend/coldchain.sqlite3")
    ShipmentRepository(server.database).close()
    return server


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--database")
    args = parser.parse_args()
    server = make_server(args.port, args.database)
    print(f"Cold Chain: http://127.0.0.1:{server.server_port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
