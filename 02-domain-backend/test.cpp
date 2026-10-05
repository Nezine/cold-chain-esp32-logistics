#include <iostream>
#include "temperature_service.h"

using namespace std;

int main() {
    Repository repository;
    TemperatureService service(repository);

    cout << "=== TEMPERATURE RULE TEST ===" << endl;

    cout << "5 C -> ";
    cout << (service.checkTemperature(5.0) == TemperatureStatus::NORMAL
             ? "PASS" : "FAIL") << endl;

    cout << "8 C -> ";
    cout << (service.checkTemperature(8.0) == TemperatureStatus::WARNING
             ? "PASS" : "FAIL") << endl;

    cout << "12 C -> ";
    cout << (service.checkTemperature(12.0) == TemperatureStatus::CRITICAL
             ? "PASS" : "FAIL") << endl;

    TemperatureReading invalidReading{
        "",
        "SHIPMENT-001",
        "2026-10-05 10:00:00",
        5.0,
        "C",
        TemperatureStatus::NORMAL
    };

    cout << "Missing device name -> ";
    cout << (!service.addTemperatureReading(invalidReading)
             ? "PASS" : "FAIL") << endl;

    TemperatureReading wrongUnit{
        "ESP32-Sensor-01",
        "SHIPMENT-001",
        "2026-10-05 10:00:00",
        5.0,
        "F",
        TemperatureStatus::NORMAL
    };

    cout << "Wrong temperature unit -> ";
    cout << (!service.addTemperatureReading(wrongUnit)
             ? "PASS" : "FAIL") << endl;

    return 0;
}