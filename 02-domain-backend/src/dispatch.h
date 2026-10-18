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

struct DispatchResponse {
    std::string alertId;
    std::string action;
    std::string note;
    std::string recordedAt;
};

class ResponseRepository {
public:
    virtual ~ResponseRepository() = default;
    virtual std::vector<DispatchResponse> all() const = 0;
    virtual void save(const DispatchResponse& response) = 0;
};

class JsonlResponseRepository : public ResponseRepository {
    std::string path_;
public:
    explicit JsonlResponseRepository(std::string path) : path_(std::move(path)) {}
    std::vector<DispatchResponse> all() const override {
        std::vector<DispatchResponse> result;
        std::set<std::string> ids;
        for (const auto& record : readRecords(path_, true)) {
            DispatchResponse response{text(record.get(), "alert_id"), text(record.get(), "action"),
                text(record.get(), "note"), text(record.get(), "recorded_at")};
            if (blank(response.alertId) || blank(response.action) || blank(response.recordedAt)
                || !ids.insert(response.alertId).second)
                throw std::runtime_error("Invalid or duplicate response record");
            result.push_back(response);
        }
        return result;
    }
    void save(const DispatchResponse& response) override {
        auto record = own(json_object_new_object());
        auto add = [&](const char* key, const std::string& value) {
            json_object_object_add(record.get(), key, json_object_new_string_len(value.data(), value.size()));
        };
        add("alert_id", response.alertId);
        add("action", response.action);
        add("note", response.note);
        add("recorded_at", response.recordedAt);
        std::ofstream file(path_, std::ios::app);
        if (!file) throw std::runtime_error("Cannot open response file: " + path_);
        file << json_object_to_json_string_ext(record.get(), JSON_C_TO_STRING_PLAIN) << '\n';
        file.flush();
        if (!file) throw std::runtime_error("Failed to save response");
    }
};

class DispatchService {
    std::vector<Json> alerts_;
    ResponseRepository& responses_;
public:
    DispatchService(const std::string& alertPath, ResponseRepository& responses)
        : alerts_(readRecords(alertPath)), responses_(responses) {
        std::set<std::string> ids;
        for (const auto& alert : alerts_) {
            auto id = text(alert.get(), "alert_id");
            if (blank(id) || !ids.insert(id).second)
                throw std::runtime_error("Empty or duplicate alert_id");
        }
        for (const auto& response : responses_.all())
            if (!ids.count(response.alertId)) throw std::runtime_error("Response references an unknown alert");
    }
    void respond(const std::string& id, const std::string& action, const std::string& note) {
        if (blank(action)) throw std::runtime_error("Action must not be blank");
        bool found = false;
        for (const auto& alert : alerts_) if (text(alert.get(), "alert_id") == id) found = true;
        if (!found) throw std::runtime_error("Unknown alert_id: " + id);
        for (const auto& response : responses_.all())
            if (response.alertId == id) throw std::runtime_error("Alert already has a response");
        const auto now = std::time(nullptr);
        char timestamp[32];
        const auto* utc = std::gmtime(&now);
        if (!utc || !std::strftime(timestamp, sizeof timestamp, "%Y-%m-%dT%H:%M:%SZ", utc))
            throw std::runtime_error("Cannot obtain response time");
        responses_.save({id, action, note, timestamp});
    }
    Json list() const {
        const auto responses = responses_.all();
        auto result = own(json_object_new_array());
        for (const auto& alert : alerts_) {
            auto item = json_object_new_object();
            // Original alert and reading stay immutable; response status is separate.
            json_object_object_add(item, "alert", json_object_get(alert.get()));
            json_object_object_add(item, "response_status", json_object_new_string("pending"));
            for (const auto& response : responses) {
                if (response.alertId != text(alert.get(), "alert_id")) continue;
                json_object_object_add(item, "response_status", json_object_new_string("responded"));
                auto detail = json_object_new_object();
                for (const auto& pair : std::vector<std::pair<const char*, std::string>>{
                         {"action", response.action}, {"note", response.note}, {"recorded_at", response.recordedAt}})
                    json_object_object_add(detail, pair.first, json_object_new_string_len(pair.second.data(), pair.second.size()));
                json_object_object_add(item, "response", detail);
            }
            json_object_array_add(result.get(), item);
        }
        return result;
    }
};
} // namespace coldchain
