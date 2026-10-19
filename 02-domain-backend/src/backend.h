#pragma once

#include "json_support.h"
#include <algorithm>
#include <cmath>
#include <functional>
#include <limits>
#include <sstream>
#include <sys/file.h>
#include <fcntl.h>
#include <unistd.h>

namespace coldchain::backend {
struct Error : std::runtime_error {
    int status;
    Error(int code, const std::string& message) : std::runtime_error(message), status(code) {}
};
inline json_object* field(json_object* object, const char* key) {
    json_object* value = nullptr;
    json_object_object_get_ex(object, key, &value);
    return value;
}
inline void put(json_object* object, const char* key, const std::string& value) {
    json_object_object_add(object, key, json_object_new_string_len(value.data(), value.size()));
}
inline void put(json_object* object, const char* key, double value) {
    json_object_object_add(object, key, json_object_new_double(value));
}
inline void put(json_object* object, const char* key, int64_t value) {
    json_object_object_add(object, key, json_object_new_int64(value));
}
inline std::string requiredText(json_object* object, const char* key, size_t maximum = 256) {
    auto* value = field(object, key);
    if (!json_object_is_type(value, json_type_string)) throw Error(400, std::string("Expected string: ") + key);
    const auto length = static_cast<size_t>(json_object_get_string_len(value));
    std::string result(json_object_get_string(value), length);
    if (blank(result) || length > maximum || result.find('\0') != std::string::npos)
        throw Error(400, std::string("Empty, oversized or invalid string: ") + key);
    return result;
}
inline double requiredNumber(json_object* object, const char* key) {
    auto* value = field(object, key);
    if (!(json_object_is_type(value, json_type_double) || json_object_is_type(value, json_type_int)))
        throw Error(400, std::string("Expected number: ") + key);
    auto result = json_object_get_double(value);
    if (!std::isfinite(result)) throw Error(400, std::string("Expected finite number: ") + key);
    return result;
}
inline int64_t requiredId(json_object* object, const char* key) {
    auto* value = field(object, key);
    if (!json_object_is_type(value, json_type_int) || json_object_get_int64(value) <= 0
        || json_object_get_int64(value) > 9007199254740991LL)
        throw Error(400, std::string("Expected positive safe integer: ") + key);
    return json_object_get_int64(value);
}
inline std::string utcNow() {
    const auto now = std::time(nullptr);
    char buffer[32];
    auto* utc = std::gmtime(&now);
    if (!utc || !std::strftime(buffer, sizeof buffer, "%Y-%m-%dT%H:%M:%SZ", utc))
        throw Error(500, "Cannot obtain UTC time");
    return buffer;
}
inline void validateTime(const std::string& value) {
    // Canonical UTC seconds: sortable without locale or timezone conversion.
    if (value.size() != 20 || value[4] != '-' || value[7] != '-' || value[10] != 'T'
        || value[13] != ':' || value[16] != ':' || value[19] != 'Z')
        throw Error(400, "time must be YYYY-MM-DDTHH:MM:SSZ");
    for (size_t i = 0; i < value.size(); ++i)
        if (i != 4 && i != 7 && i != 10 && i != 13 && i != 16 && i != 19
            && (value[i] < '0' || value[i] > '9')) throw Error(400, "Invalid time");
    const auto year = std::stoi(value.substr(0, 4)), month = std::stoi(value.substr(5, 2));
    const auto day = std::stoi(value.substr(8, 2));
    const int days[] = {31,28,31,30,31,30,31,31,30,31,30,31};
    const bool leap = year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
    if (year < 1970 || month < 1 || month > 12 || day < 1
        || day > days[month - 1] + (month == 2 && leap ? 1 : 0)
        || std::stoi(value.substr(11, 2)) > 23 || std::stoi(value.substr(14, 2)) > 59
        || std::stoi(value.substr(17, 2)) > 59) throw Error(400, "Invalid calendar time");
}
inline Json parse(const std::string& input, int errorStatus = 400) {
    std::unique_ptr<json_tokener, decltype(&json_tokener_free)> parser(json_tokener_new(), json_tokener_free);
    json_tokener_set_flags(parser.get(), JSON_TOKENER_STRICT | JSON_TOKENER_VALIDATE_UTF8);
    auto result = own(json_tokener_parse_ex(parser.get(), input.data(), input.size()));
    if (json_tokener_get_error(parser.get()) != json_tokener_success || !result
        || !json_object_is_type(result.get(), json_type_object)
        || input.find_first_not_of(" \r\n\t", json_tokener_get_parse_end(parser.get())) != std::string::npos)
        throw Error(errorStatus, "Expected one valid JSON object (UTF-8)");
    return result;
}
inline Json copy(json_object* value) {
    json_object* result = nullptr;
    if (json_object_deep_copy(value, &result, nullptr) != 0) throw Error(500, "Cannot copy JSON");
    return own(result);
}

// Repository boundary keeps storage independent of the application service.
class StateRepository {
public:
    virtual ~StateRepository() = default;
    virtual Json load() = 0;
    virtual void save(json_object* state) = 0;
};

// Linux/macOS local process lock + atomic snapshot replacement. One lock covers
// load, validation, changes and save, including across concurrent API requests.
class FileStateRepository : public StateRepository {
    std::string path_;
    int lock_ = -1;
public:
    explicit FileStateRepository(const std::string& path) : path_(path) {
        lock_ = ::open((path + ".lock").c_str(), O_CREAT | O_RDWR, 0600);
        if (lock_ < 0) throw Error(500, "Cannot open state lock; parent directory must exist");
        if (::flock(lock_, LOCK_EX) != 0) {
            ::close(lock_);
            throw Error(500, "Cannot lock state");
        }
    }
    FileStateRepository(const FileStateRepository&) = delete;
    FileStateRepository& operator=(const FileStateRepository&) = delete;
    ~FileStateRepository() override {
        if (lock_ >= 0) { ::flock(lock_, LOCK_UN); ::close(lock_); }
    }
    Json load() override {
        if (!std::filesystem::exists(path_))
            return parse("{\"version\":1,\"shipments\":[],\"readings\":[],\"alerts\":[],\"responses\":[]}", 500);
        std::ifstream input(path_, std::ios::binary);
        if (!input) throw Error(500, "Cannot open state");
        std::ostringstream buffer;
        buffer << input.rdbuf();
        if (input.bad()) throw Error(500, "Cannot read state");
        auto state = parse(buffer.str(), 500);
        if (!json_object_is_type(field(state.get(), "version"), json_type_int)
            || json_object_get_int(field(state.get(), "version")) != 1)
            throw Error(500, "Unsupported state schema");
        for (auto key : {"shipments", "readings", "alerts", "responses"}) {
            if (!json_object_is_type(field(state.get(), key), json_type_array)) throw Error(500, "Invalid state schema");
            auto* records = field(state.get(), key);
            for (size_t i = 0; i < json_object_array_length(records); ++i)
                if (!json_object_is_type(json_object_array_get_idx(records, i), json_type_object))
                    throw Error(500, "Invalid state record");
        }
        return state;
    }
    void save(json_object* state) override {
        const auto temporary = path_ + ".tmp.XXXXXX";
        std::vector<char> name(temporary.begin(), temporary.end());
        name.push_back('\0');
        int output = ::mkstemp(name.data());
        if (output < 0) throw Error(500, "Cannot create state snapshot");
        try {
            std::string bytes = std::string(json_object_to_json_string_ext(state, JSON_C_TO_STRING_PLAIN)) + "\n";
            size_t offset = 0;
            while (offset < bytes.size()) {
                const auto count = ::write(output, bytes.data() + offset, bytes.size() - offset);
                if (count <= 0) throw Error(500, "Cannot write state snapshot");
                offset += count;
            }
            if (::fsync(output) != 0) throw Error(500, "Cannot flush state snapshot");
            const auto closed = ::close(output);
            output = -1;
            if (closed != 0) throw Error(500, "Cannot close state snapshot");
            if (::rename(name.data(), path_.c_str()) != 0) throw Error(500, "Cannot replace state snapshot");
        } catch (...) {
            if (output >= 0) ::close(output);
            ::unlink(name.data());
            throw;
        }
    }
};

struct Shipment {
    double minimum, maximum, criticalMargin;
    std::string classify(double temperature) const {
        if (temperature < minimum - criticalMargin || temperature > maximum + criticalMargin) return "critical";
        if (temperature < minimum || temperature > maximum) return "warning";
        return "normal";
    }
};
struct ReadingEvent {
    json_object* shipment;
    json_object* reading;
};
class ReadingObserver {
public:
    virtual ~ReadingObserver() = default;
    virtual void onReading(const ReadingEvent& event) = 0;
};
class ReadingPublisher {
    std::vector<std::reference_wrapper<ReadingObserver>> observers_;
public:
    void subscribe(ReadingObserver& observer) { observers_.push_back(observer); }
    void publish(const ReadingEvent& event) {
        for (auto& observer : observers_) observer.get().onReading(event);
    }
};
class AlertMonitor : public ReadingObserver {
    json_object* alerts_;
public:
    explicit AlertMonitor(json_object* alerts) : alerts_(alerts) {}
    void onReading(const ReadingEvent& event) override {
        Shipment policy{requiredNumber(event.shipment, "min"), requiredNumber(event.shipment, "max"),
                        requiredNumber(event.shipment, "criticalMargin")};
        const auto severity = policy.classify(requiredNumber(event.reading, "temperature"));
        if (severity == "normal") return;
        auto alert = own(json_object_new_object());
        put(alert.get(), "id", static_cast<int64_t>(json_object_array_length(alerts_) + 1));
        put(alert.get(), "shipmentId", requiredId(event.shipment, "id"));
        put(alert.get(), "readingId", requiredText(event.reading, "readingId"));
        put(alert.get(), "severity", severity);
        put(alert.get(), "temperature", requiredNumber(event.reading, "temperature"));
        put(alert.get(), "time", requiredText(event.reading, "time"));
        put(alert.get(), "responseStatus", "pending");
        json_object_array_add(alerts_, json_object_get(alert.get()));
    }
};

class LogisticsService {
    StateRepository& repository_;
    Json state_;
    json_object* records(const char* key) const { return field(state_.get(), key); }
    json_object* shipment(int64_t id) const {
        auto* ships = records("shipments");
        for (size_t i = 0; i < json_object_array_length(ships); ++i) {
            auto* item = json_object_array_get_idx(ships, i);
            if (requiredId(item, "id") == id) return item;
        }
        throw Error(404, "Shipment not found");
    }
public:
    explicit LogisticsService(StateRepository& repository) : repository_(repository), state_(repository.load()) {}
    Json createShipment(json_object* input) {
        const auto name = requiredText(input, "name");
        const auto low = requiredNumber(input, "min"), high = requiredNumber(input, "max");
        json_object* marginField = nullptr;
        const bool hasMargin = json_object_object_get_ex(input, "criticalMargin", &marginField);
        const auto margin = hasMargin ? requiredNumber(input, "criticalMargin") : 2.0;
        if (low >= high || margin <= 0 || low < -100 || high > 150 || margin > 100)
            throw Error(400, "Require -100 <= min < max <= 150 and 0 < criticalMargin <= 100");
        auto item = own(json_object_new_object());
        put(item.get(), "id", static_cast<int64_t>(json_object_array_length(records("shipments")) + 1));
        put(item.get(), "name", name);
        put(item.get(), "min", low); put(item.get(), "max", high); put(item.get(), "criticalMargin", margin);
        json_object_object_add(item.get(), "temperature", nullptr);
        json_object_object_add(item.get(), "history", json_object_new_array());
        put(item.get(), "connection", "loading"); put(item.get(), "severity", "normal");
        json_object_array_add(records("shipments"), json_object_get(item.get()));
        repository_.save(state_.get());
        return item;
    }
    Json shipments() const { return copy(records("shipments")); }
    Json readings(int64_t id) const {
        shipment(id);
        auto result = own(json_object_new_object());
        put(result.get(), "shipmentId", id);
        auto* list = json_object_new_array();
        auto* all = records("readings");
        for (size_t i = 0; i < json_object_array_length(all); ++i) {
            auto* reading = json_object_array_get_idx(all, i);
            if (requiredId(reading, "shipmentId") == id) json_object_array_add(list, json_object_get(reading));
        }
        json_object_object_add(result.get(), "readings", list);
        return result;
    }
    Json addReading(json_object* input) {
        const auto id = requiredId(input, "shipmentId");
        auto* ship = shipment(id);
        const auto temperature = requiredNumber(input, "temperature");
        if (temperature < -100 || temperature > 150) throw Error(400, "Temperature outside demo sensor range");
        if (requiredText(input, "unit") != "C") throw Error(400, "Only Celsius is supported");
        const auto time = requiredText(input, "time"); validateTime(time);
        const auto device = requiredText(input, "deviceId");
        const auto readingId = requiredText(input, "readingId");
        auto* list = records("readings");
        for (size_t i = 0; i < json_object_array_length(list); ++i) {
            auto* old = json_object_array_get_idx(list, i);
            if (requiredText(old, "readingId") == readingId) throw Error(409, "Duplicate readingId");
            if (requiredId(old, "shipmentId") == id && requiredText(old, "time") > time)
                throw Error(409, "Out-of-order reading; latest state was not changed");
        }
        auto reading = own(json_object_new_object());
        put(reading.get(), "shipmentId", id); put(reading.get(), "temperature", temperature);
        put(reading.get(), "unit", "C"); put(reading.get(), "time", time);
        put(reading.get(), "deviceId", device); put(reading.get(), "readingId", readingId);
        json_object_array_add(list, json_object_get(reading.get()));
        auto* oldHistory = field(ship, "history");
        auto* history = json_object_new_array();
        const size_t count = json_object_array_length(oldHistory);
        for (size_t i = count > 5 ? count - 5 : 0; i < count; ++i)
            json_object_array_add(history, json_object_get(json_object_array_get_idx(oldHistory, i)));
        json_object_array_add(history, json_object_new_double(temperature));
        json_object_object_add(ship, "history", history);
        put(ship, "temperature", temperature); put(ship, "connection", "ok");
        Shipment policy{requiredNumber(ship, "min"), requiredNumber(ship, "max"), requiredNumber(ship, "criticalMargin")};
        put(ship, "severity", policy.classify(temperature));
        put(ship, "lastReadingAt", time);
        AlertMonitor monitor(records("alerts"));
        ReadingPublisher publisher;
        publisher.subscribe(monitor);
        publisher.publish({ship, reading.get()});
        repository_.save(state_.get());
        return copy(ship);
    }
    Json alerts() const { return copy(records("alerts")); }
    Json respond(int64_t shipmentId, json_object* input) {
        shipment(shipmentId);
        const auto id = requiredId(input, "alertId");
        const auto action = requiredText(input, "action");
        std::string note;
        json_object* noteField = nullptr;
        if (json_object_object_get_ex(input, "note", &noteField)) {
            if (!json_object_is_type(noteField, json_type_string)) throw Error(400, "note must be a string");
            note = text(input, "note");
            if (note.size() > 4096 || note.find('\0') != std::string::npos) throw Error(400, "Invalid note");
        }
        auto* all = records("alerts");
        for (size_t i = 0; i < json_object_array_length(all); ++i) {
            auto* alert = json_object_array_get_idx(all, i);
            if (requiredId(alert, "id") != id || requiredId(alert, "shipmentId") != shipmentId) continue;
            if (requiredText(alert, "responseStatus") != "pending") throw Error(409, "Alert already has a response");
            auto response = own(json_object_new_object());
            put(response.get(), "alertId", id); put(response.get(), "shipmentId", shipmentId);
            put(response.get(), "action", action); put(response.get(), "note", note);
            put(response.get(), "recordedAt", utcNow());
            put(alert, "responseStatus", "responded");
            json_object_object_add(alert, "response", json_object_get(response.get()));
            json_object_array_add(records("responses"), json_object_get(response.get()));
            repository_.save(state_.get());
            auto result = own(json_object_new_object());
            put(result.get(), "shipmentId", shipmentId); put(result.get(), "status", "responded");
            json_object_object_add(result.get(), "response", json_object_get(response.get()));
            return result;
        }
        throw Error(404, "Alert not found for this shipment");
    }
};
} // namespace coldchain::backend
