#pragma once

#include <fstream>
#include <stdexcept>
#include <string>
#include <json-c/json.h>

// One writer per file. Append-only classroom storage, not a production database.
class AlertRepository {
private:
    std::ofstream file;

public:
    explicit AlertRepository(const std::string& path)
        : file(path, std::ios::app) {
        if (!file) throw std::runtime_error("Cannot open alert file: " + path);
    }

    void save(json_object* reading, const char* severity) {
        // Wrap the validated reading so original fields remain intact.
        json_object* alert = json_object_new_object();
        json_object_object_add(alert, "severity", json_object_new_string(severity));
        json_object_object_add(alert, "status", json_object_new_string("open"));
        json_object_object_add(alert, "reading", json_object_get(reading));
        file << json_object_to_json_string_ext(alert, JSON_C_TO_STRING_PLAIN) << '\n';
        file.flush();
        json_object_put(alert);
        if (!file) throw std::runtime_error("Failed to write alert file");
    }
};
