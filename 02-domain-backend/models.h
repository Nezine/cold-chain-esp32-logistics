#ifndef MODELS_H
#define MODELS_H

#include <string>

enum class TemperatureStatus {
    NORMAL,
    WARNING,
    CRITICAL
};

struct TemperatureReading {
    std::string deviceName;
    std::string shipmentId;
    std::string timestamp;
    double temperature;
    std::string unit;
    TemperatureStatus status;
};

struct Alert {
    int id;
    std::string shipmentId;
    std::string timestamp;
    double temperature;
    std::string message;
    bool resolved;
    std::string response;
};
struct Shipment {
    std::string id;
    std::string origin;
    std::string destination;
};

#endif