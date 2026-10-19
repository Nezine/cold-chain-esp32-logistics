#pragma once

#include "json_support.h"

namespace coldchain {
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
