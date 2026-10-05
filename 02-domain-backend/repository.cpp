#include "repository.h"

void Repository::addShipment(const Shipment& shipment) {
    shipments.push_back(shipment);
}

void Repository::addReading(const TemperatureReading& reading) {
    readings.push_back(reading);
}

void Repository::addAlert(const Alert& alert) {
    alerts.push_back(alert);
}

std::vector<Shipment> Repository::getShipments() const {
    return shipments;
}

std::vector<TemperatureReading> Repository::getReadings() const {
    return readings;
}

std::vector<Alert> Repository::getAlerts() const {
    return alerts;
}
bool Repository::recordAlertResponse(
    int alertId,
    const std::string& response
) {
    for (auto& alert : alerts) {
        if (alert.id == alertId) {
            alert.resolved = true;
            alert.response = response;
            return true;
        }
    }

    return false;
}