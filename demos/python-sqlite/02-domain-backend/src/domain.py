"""Domain rules for the classroom cold-chain product (not medical guidance)."""
from dataclasses import dataclass
from datetime import datetime, timezone
import math


def number(value, field):
    if isinstance(value, bool) or not isinstance(value, (float, int)) or not math.isfinite(value):
        raise ValueError(f"{field} must be a finite number")
    return value


def required_text(value, field):
    if not isinstance(value, str) or not value.strip() or len(value) > 500:
        raise ValueError(f"{field} must be non-empty text (max 500 characters)")
    return value.strip()


@dataclass(frozen=True)
class TemperaturePolicy:
    minimum: float = 2
    maximum: float = 8
    margin: float = 2

    def classify(self, temperature):
        if temperature < self.minimum - self.margin or temperature > self.maximum + self.margin:
            return "critical"
        if temperature < self.minimum or temperature > self.maximum:
            return "warning"
        return "normal"


@dataclass(frozen=True)
class Shipment:
    """Entity owning lifecycle invariants; identity remains stable across changes."""
    id: int
    status: str
    severity: str
    connection: str

    def ensure_transition(self, target):
        allowed = {"planned": {"in_transit"}, "in_transit": {"delivered"}, "delivered": set()}
        if target not in allowed[self.status]:
            raise ValueError("Invalid shipment status transition")
        if target == "delivered" and (self.severity != "normal" or self.connection != "ok"):
            raise ValueError("Delivery requires a fresh, normal reading")


@dataclass(frozen=True)
class TemperatureReading:
    id: str
    device_id: str
    shipment_id: int
    temperature: float
    time: str

    @classmethod
    def parse(cls, data):
        if data.get("unit") != "C":
            raise ValueError("unit must be C")
        shipment_id = data.get("shipmentId")
        if type(shipment_id) is not int or shipment_id < 1:
            raise ValueError("shipmentId must be a positive integer")
        stamp = required_text(data.get("time"), "time")
        try:
            date = datetime.fromisoformat(stamp.replace("Z", "+00:00"))
        except ValueError:
            raise ValueError("time must be ISO 8601") from None
        if date.tzinfo is None:
            raise ValueError("time must include timezone")
        if date > datetime.now(timezone.utc):
            raise ValueError("future readings are not accepted")
        return cls(required_text(data.get("readingId"), "readingId"),
                   required_text(data.get("deviceId"), "deviceId"), shipment_id,
                   number(data.get("temperature"), "temperature"),
                   date.astimezone(timezone.utc).isoformat())


class ReadingSubject:
    """Synchronous Observer: subscribers run inside the repository transaction."""
    def __init__(self):
        self.observers = []

    def subscribe(self, observer):
        self.observers.append(observer)

    def notify(self, shipment, reading):
        for observer in self.observers:
            observer(shipment, reading)


class TemperatureMonitor:
    def __init__(self, repository):
        self.repository = repository

    def __call__(self, shipment, reading):
        severity = TemperaturePolicy(shipment["min"], shipment["max"]).classify(reading.temperature)
        self.repository.update_condition(shipment["id"], reading, severity)
