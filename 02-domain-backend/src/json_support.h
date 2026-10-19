#pragma once

#include <ctime>
#include <filesystem>
#include <fstream>
#include <memory>
#include <set>
#include <stdexcept>
#include <string>
#include <vector>
#include <json-c/json.h>

namespace coldchain {
using Json = std::shared_ptr<json_object>;
inline Json own(json_object* value) { return Json(value, json_object_put); }
inline std::string text(json_object* object, const char* key) {
    json_object* value = nullptr;
    if (!json_object_object_get_ex(object, key, &value)
        || !json_object_is_type(value, json_type_string))
        throw std::runtime_error(std::string("Missing string field: ") + key);
    return std::string(json_object_get_string(value), json_object_get_string_len(value));
}
inline bool blank(const std::string& value) {
    return value.find_first_not_of(" \t\r\n") == std::string::npos;
}
inline std::vector<Json> readRecords(const std::string& path, bool allowMissing = false) {
    if (allowMissing && !std::filesystem::exists(path)) return {};
    std::ifstream file(path);
    if (!file) throw std::runtime_error("Cannot read: " + path);
    std::vector<Json> records;
    std::string line;
    while (std::getline(file, line)) {
        std::unique_ptr<json_tokener, decltype(&json_tokener_free)> parser(
            json_tokener_new(), json_tokener_free);
        json_tokener_set_flags(parser.get(), JSON_TOKENER_STRICT);
        auto record = own(json_tokener_parse_ex(parser.get(), line.c_str(), line.size()));
        if (json_tokener_get_error(parser.get()) != json_tokener_success || !record
            || !json_object_is_type(record.get(), json_type_object)
            || line.find_first_not_of(" \t\r", json_tokener_get_parse_end(parser.get())) != std::string::npos)
            throw std::runtime_error("Invalid JSON record in: " + path + " (" + json_tokener_error_desc(json_tokener_get_error(parser.get())) + ", offset " + std::to_string(json_tokener_get_parse_end(parser.get())) + ")");
        records.push_back(record);
    }
    if (file.bad()) throw std::runtime_error("Read failed: " + path);
    return records;
}

} // namespace coldchain
