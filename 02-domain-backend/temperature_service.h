#ifndef TEMPERATURE_SERVICE_H
#define TEMPERATURE_SERVICE_H

#include "models.h"
#include "repository.h"

class TemperatureService {
private:
    Repository& repository;

public:
    TemperatureService(Repository& repo);

    TemperatureStatus checkTemperature(double temperature);

    bool addTemperatureReading(
        const TemperatureReading& reading
    );
};

#endif