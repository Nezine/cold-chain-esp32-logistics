#pragma once

#include <iostream>
#include <string>
#include "alert_repository.h"
#include "reading_observer.h"

class TemperaturePolicy {
public:
    const char* classify(double temperature) const {
        if (temperature < 0.0 || temperature > 10.0) return "CRITICAL";
        if (temperature < 2.0 || temperature > 8.0) return "WARNING";
        return "NORMAL";
    }
};

class TemperatureMonitor : public ReadingObserver {
private:
    AlertRepository& alerts;
    TemperaturePolicy policy;

public:
    explicit TemperatureMonitor(AlertRepository& repository) : alerts(repository) {}

    void onReading(json_object* reading) override {
        const double temperature = json_object_get_double(
            json_object_object_get(reading, "temperature"));
        const char* severity = policy.classify(temperature);
        if (std::string(severity) != "NORMAL") {
            alerts.save(reading, severity);
        }

        std::cout << json_object_get_string(json_object_object_get(reading, "device_id"))
            << " / " << json_object_get_string(json_object_object_get(reading, "shipment_id"))
            << " / reading " << json_object_get_int64(json_object_object_get(reading, "sequence"))
            << " / " << temperature << " C / " << severity
            << std::endl;
    }
};
