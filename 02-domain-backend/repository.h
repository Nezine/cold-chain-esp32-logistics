#ifndef REPOSITORY_H
#define REPOSITORY_H

#include "models.h"
#include <vector>

class Repository {
private:
    std::vector<Shipment> shipments;
    std::vector<TemperatureReading> readings;
    std::vector<Alert> alerts;

public:
    void addShipment(const Shipment& shipment);
    void addReading(const TemperatureReading& reading);
    void addAlert(const Alert& alert);

    std::vector<Shipment> getShipments() const;
    std::vector<TemperatureReading> getReadings() const;
    std::vector<Alert> getAlerts() const;

    bool recordAlertResponse(int alertId, const std::string& response);
};

#endif