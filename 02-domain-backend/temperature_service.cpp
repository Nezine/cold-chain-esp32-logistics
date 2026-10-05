#include "temperature_service.h"

TemperatureService::TemperatureService(Repository& repo)
    : repository(repo) {}

TemperatureStatus TemperatureService::checkTemperature(double temperature) {
    if (temperature <= 7.0) {
        return TemperatureStatus::NORMAL;
    }
    else if (temperature <= 10.0) {
        return TemperatureStatus::WARNING;
    }
    else {
        return TemperatureStatus::CRITICAL;
    }
}

bool TemperatureService::addTemperatureReading(
    const TemperatureReading& reading
) {
    if (reading.deviceName.empty() ||
        reading.shipmentId.empty() ||
        reading.timestamp.empty() ||
        reading.unit != "C") {
        return false;
    }

    TemperatureReading newReading = reading;
    newReading.status = checkTemperature(reading.temperature);

    repository.addReading(newReading);

    if (newReading.status != TemperatureStatus::NORMAL) {
        Alert alert;
        alert.id = repository.getAlerts().size() + 1;
        alert.shipmentId = newReading.shipmentId;
        alert.timestamp = newReading.timestamp;
        alert.temperature = newReading.temperature;
        alert.resolved = false;

        if (newReading.status == TemperatureStatus::WARNING) {
            alert.message = "Temperature warning";
        }
        else {
            alert.message = "Critical temperature alert";
        }

        repository.addAlert(alert);
    }

    return true;
}