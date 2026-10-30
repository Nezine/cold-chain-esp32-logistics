"""SQLite persistence adapter; each API request uses its own connection."""
import sqlite3
from datetime import datetime, timezone


class ShipmentRepository:
    def __init__(self, path):
        self.db = sqlite3.connect(path, timeout=10)
        self.db.row_factory = sqlite3.Row
        self.db.execute("PRAGMA foreign_keys=ON")
        self.db.executescript('''
        CREATE TABLE IF NOT EXISTS shipments (
          id INTEGER PRIMARY KEY, name TEXT NOT NULL, minimum REAL NOT NULL,
          maximum REAL NOT NULL, device TEXT NOT NULL, vehicle TEXT,
          status TEXT NOT NULL DEFAULT 'planned', severity TEXT NOT NULL DEFAULT 'normal');
        CREATE TABLE IF NOT EXISTS readings (
          id TEXT PRIMARY KEY, shipment INTEGER NOT NULL REFERENCES shipments(id),
          device TEXT NOT NULL, temperature REAL NOT NULL, time TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS alerts (
          id INTEGER PRIMARY KEY, shipment INTEGER NOT NULL REFERENCES shipments(id),
          severity TEXT NOT NULL, opened TEXT NOT NULL, recovered TEXT, closure TEXT);
        CREATE TABLE IF NOT EXISTS responses (
          id INTEGER PRIMARY KEY, alert INTEGER NOT NULL REFERENCES alerts(id),
          action TEXT NOT NULL, note TEXT NOT NULL, time TEXT NOT NULL);
        ''')

    def close(self):
        self.db.close()

    def get(self, shipment_id):
        row = self.db.execute("SELECT * FROM shipments WHERE id=?", (shipment_id,)).fetchone()
        if row is None:
            raise LookupError("Shipment not found")
        readings = self.db.execute("SELECT * FROM readings WHERE shipment=? ORDER BY time DESC, id DESC LIMIT 60", (shipment_id,)).fetchall()
        latest = readings[0] if readings else None
        stale = latest and (datetime.now(timezone.utc) - datetime.fromisoformat(latest["time"])).total_seconds() > 30
        return {"id": row["id"], "name": row["name"], "min": row["minimum"], "max": row["maximum"],
                "deviceId": row["device"], "vehicle": row["vehicle"], "status": row["status"],
                "severity": row["severity"], "temperature": latest["temperature"] if latest else None,
                "lastReadingAt": latest["time"] if latest else None,
                "connection": "timeout" if stale else "ok" if latest else "loading",
                "history": [r["temperature"] for r in reversed(readings)],
                "alerts": self.alerts(shipment_id)}

    def all(self):
        return [self.get(r[0]) for r in self.db.execute("SELECT id FROM shipments ORDER BY id")]

    def create(self, name, minimum, maximum, device):
        cur = self.db.execute("INSERT INTO shipments(name,minimum,maximum,device) VALUES (?,?,?,?)", (name, minimum, maximum, device))
        return cur.lastrowid

    def alerts(self, shipment_id):
        result = []
        for row in self.db.execute("SELECT * FROM alerts WHERE shipment=? ORDER BY id DESC", (shipment_id,)):
            alert = dict(row)
            alert["responses"] = [dict(r) for r in self.db.execute("SELECT * FROM responses WHERE alert=? ORDER BY id", (row["id"],))]
            alert["status"] = row["closure"] if row["recovered"] else "acknowledged" if alert["responses"] else "open"
            result.append(alert)
        return result

    def readings(self, shipment_id):
        self.get(shipment_id)
        return [dict(r) for r in self.db.execute("SELECT * FROM readings WHERE shipment=? ORDER BY time", (shipment_id,))]

    def duplicate(self, reading):
        row = self.db.execute("SELECT * FROM readings WHERE id=?", (reading.id,)).fetchone()
        if row is None:
            return False
        if (row["shipment"], row["device"], row["temperature"], row["time"]) != (reading.shipment_id, reading.device_id, reading.temperature, reading.time):
            raise ValueError("readingId already exists with different content")
        return True

    def add_reading(self, reading):
        self.db.execute("INSERT INTO readings VALUES (?,?,?,?,?)", (reading.id, reading.shipment_id, reading.device_id, reading.temperature, reading.time))

    def update_condition(self, shipment_id, reading, severity):
        current = self.db.execute("SELECT * FROM alerts WHERE shipment=? AND recovered IS NULL", (shipment_id,)).fetchone()
        if current and current["severity"] != severity:
            self.db.execute("UPDATE alerts SET recovered=?,closure=? WHERE id=?", (reading.time, "recovered" if severity == "normal" else "superseded", current["id"]))
            current = None
        if severity != "normal" and current is None:
            self.db.execute("INSERT INTO alerts(shipment,severity,opened) VALUES (?,?,?)", (shipment_id, severity, reading.time))
        self.db.execute("UPDATE shipments SET severity=? WHERE id=?", (severity, shipment_id))

    def respond(self, shipment_id, alert_id, action, note):
        alert = self.db.execute("SELECT * FROM alerts WHERE id=? AND shipment=?", (alert_id, shipment_id)).fetchone()
        if alert is None:
            raise LookupError("Alert not found for this shipment")
        self.db.execute("INSERT INTO responses(alert,action,note,time) VALUES (?,?,?,?)", (alert_id, action, note, datetime.now(timezone.utc).isoformat()))

    def dispatch(self, shipment_id, vehicle, status):
        self.db.execute("UPDATE shipments SET vehicle=?,status=? WHERE id=?", (vehicle, status, shipment_id))
