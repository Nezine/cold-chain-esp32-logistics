"""Application use cases; validation and orchestration independent of HTTP."""
from domain import Shipment, TemperatureReading, ReadingSubject, TemperatureMonitor, required_text, number


class ColdChainService:
    def __init__(self, repository):
        self.repository = repository
        self.subject = ReadingSubject()
        self.subject.subscribe(TemperatureMonitor(repository))

    def create(self, data):
        name = required_text(data.get("name"), "name")
        device = required_text(data.get("deviceId"), "deviceId")
        minimum = number(data.get("min"), "min")
        maximum = number(data.get("max"), "max")
        if minimum >= maximum:
            raise ValueError("min must be less than max")
        with self.repository.db:
            shipment_id = self.repository.create(name, minimum, maximum, device)
        return self.repository.get(shipment_id)

    def ingest(self, data):
        reading = TemperatureReading.parse(data)
        # Serialize duplicate checking + write + observer effects atomically.
        with self.repository.db:
            self.repository.db.execute("BEGIN IMMEDIATE")
            shipment = self.repository.get(reading.shipment_id)
            if reading.device_id != shipment["deviceId"]:
                raise ValueError("deviceId does not match shipment")
            if not self.repository.duplicate(reading):
                if shipment["status"] == "delivered":
                    raise ValueError("Delivered shipment does not accept new readings")
                if shipment["lastReadingAt"] and reading.time <= shipment["lastReadingAt"]:
                    raise ValueError("Reading must be newer than the latest reading")
                self.repository.add_reading(reading)
                self.subject.notify(shipment, reading)
        return self.repository.get(reading.shipment_id)

    def respond(self, shipment_id, data):
        action = required_text(data.get("action"), "action")
        note = required_text(data.get("note"), "note")
        alert_id = data.get("alertId")
        if type(alert_id) is not int:
            raise ValueError("alertId must be an integer")
        with self.repository.db:
            self.repository.respond(shipment_id, alert_id, action, note)
        return self.repository.get(shipment_id)

    def dispatch(self, shipment_id, data):
        with self.repository.db:
            self.repository.db.execute("BEGIN IMMEDIATE")
            shipment = self.repository.get(shipment_id)
            status = data.get("status")
            Shipment(shipment_id, shipment["status"], shipment["severity"], shipment["connection"]).ensure_transition(status)
            vehicle = required_text(data.get("vehicle"), "vehicle")
            self.repository.dispatch(shipment_id, vehicle, status)
        return self.repository.get(shipment_id)
