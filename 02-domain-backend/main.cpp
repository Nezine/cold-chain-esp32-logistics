#include <iostream>
#include "temperature_service.h"

using namespace std;

string statusToString(TemperatureStatus status) {
    switch (status) {
        case TemperatureStatus::NORMAL:
            return "NORMAL";
        case TemperatureStatus::WARNING:
            return "WARNING";
        case TemperatureStatus::CRITICAL:
            return "CRITICAL";
    }

    return "UNKNOWN";
}

int main() {
    Repository repository;
    TemperatureService service(repository);

    cout << "=== COLD CHAIN BACKEND ===" << endl;

    Shipment shipment;
    shipment.id = "SHIPMENT-001";
    shipment.origin = "Hanoi";
    shipment.destination = "Ho Chi Minh City";

    repository.addShipment(shipment);

    cout << "\nShipment created: "
         << shipment.id << endl;

    TemperatureReading reading1{
        "ESP32-Sensor-01",
        "SHIPMENT-001",
        "2026-10-05 10:00:00",
        5.0,
        "C",
        TemperatureStatus::NORMAL
    };

    TemperatureReading reading2{
        "ESP32-Sensor-01",
        "SHIPMENT-001",
        "2026-10-05 10:00:10",
        8.0,
        "C",
        TemperatureStatus::NORMAL
    };

    TemperatureReading reading3{
        "ESP32-Sensor-01",
        "SHIPMENT-001",
        "2026-10-05 10:00:20",
        12.0,
        "C",
        TemperatureStatus::NORMAL
    };

    service.addTemperatureReading(reading1);
    service.addTemperatureReading(reading2);
    service.addTemperatureReading(reading3);

    cout << "\n=== TEMPERATURE READINGS ===" << endl;

    for (const auto& reading : repository.getReadings()) {
        cout << "Temperature: "
             << reading.temperature << " C" << endl;

        cout << "Status: "
             << statusToString(reading.status) << endl;

        cout << "------------------------" << endl;
    }

    cout << "\n=== ALERTS ===" << endl;

    for (const auto& alert : repository.getAlerts()) {
        cout << "Alert ID: " << alert.id << endl;
        cout << "Temperature: "
             << alert.temperature << " C" << endl;
        cout << "Message: "
             << alert.message << endl;
        cout << "Resolved: "
             << (alert.resolved ? "YES" : "NO") << endl;
        cout << "------------------------" << endl;
    }

    bool responseRecorded =
        repository.recordAlertResponse(
            1,
            "Checked shipment and adjusted cooling."
        );

    cout << "\n=== ALERT RESPONSE ===" << endl;

    if (responseRecorded) {
        cout << "Response recorded successfully." << endl;
    } else {
        cout << "Alert not found." << endl;
    }

    cout << "\n=== UPDATED ALERTS ===" << endl;

    for (const auto& alert : repository.getAlerts()) {
        cout << "Alert ID: " << alert.id << endl;
        cout << "Message: "
             << alert.message << endl;
        cout << "Resolved: "
             << (alert.resolved ? "YES" : "NO") << endl;
        cout << "Response: "
             << alert.response << endl;
        cout << "------------------------" << endl;
    }

    return 0;
}