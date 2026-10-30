#include <cmath>
#include <iostream>
#include <memory>
#include <string>
#include <json-c/json.h>
#include "temperature_monitor.h"

bool hasField(json_object* object, const char* name, json_type type) {
    json_object* value = nullptr;
    return json_object_object_get_ex(object, name, &value)
        && json_object_is_type(value, type);
}

bool nonemptyString(json_object* object, const char* name) {
    return hasField(object, name, json_type_string)
        && json_object_get_string_len(json_object_object_get(object, name)) > 0;
}

bool unsignedCounter(json_object* object, const char* name) {
    return hasField(object, name, json_type_int)
        && json_object_get_int64(json_object_object_get(object, name)) >= 0;
}

int main(int argc, char* argv[]) {
    if (argc > 2) {
        std::cerr << "Usage: serial_readings [alert-file]\n";
        return 1;
    }
    try {
        AlertRepository alerts(argc == 2 ? argv[1] : "alerts.jsonl");
        TemperatureMonitor monitor(alerts);
        ReadingPublisher publisher;
        publisher.subscribe(monitor);
        std::string line;
        while (std::getline(std::cin, line)) {
            // ESP32 boot messages are not JSON readings.
            const auto start = line.find_first_not_of(" \t\r");
            if (start == std::string::npos || line[start] != '{') continue;
            if (line.size() > 4096) {
                std::cerr << "Rejected: reading exceeds 4096 bytes\n";
                continue;
            }

            std::unique_ptr<json_tokener, decltype(&json_tokener_free)> parser(
                json_tokener_new(), json_tokener_free);
            json_tokener_set_flags(parser.get(), JSON_TOKENER_STRICT);
            std::unique_ptr<json_object, decltype(&json_object_put)> reading(
                json_tokener_parse_ex(parser.get(), line.c_str(), static_cast<int>(line.size())),
                json_object_put);
            const auto end = json_tokener_get_parse_end(parser.get());
            if (json_tokener_get_error(parser.get()) != json_tokener_success
                || !reading || !json_object_is_type(reading.get(), json_type_object)
                || line.find_first_not_of(" \t\r", end) != std::string::npos) {
                std::cerr << "Rejected: invalid JSON\n";
                continue;
            }

            auto* object = reading.get();
            auto* temperatureField = json_object_object_get(object, "temperature");
            if (!nonemptyString(object, "device_id") || !nonemptyString(object, "shipment_id")
                || !unsignedCounter(object, "sequence") || !unsignedCounter(object, "uptime_ms")
                || !nonemptyString(object, "unit")
                || std::string(json_object_get_string(json_object_object_get(object, "unit"))) != "C"
                || !(json_object_is_type(temperatureField, json_type_double)
                     || json_object_is_type(temperatureField, json_type_int))) {
                std::cerr << "Rejected: missing or invalid reading fields\n";
                continue;
            }
            const double temperature = json_object_get_double(temperatureField);
            if (!std::isfinite(temperature)) {
                std::cerr << "Rejected: temperature must be finite\n";
                continue;
            }

            publisher.publish(object);
        }
    } catch (const std::exception& error) {
        std::cerr << "Receiver error: " << error.what() << '\n';
        return 1;
    }
}
