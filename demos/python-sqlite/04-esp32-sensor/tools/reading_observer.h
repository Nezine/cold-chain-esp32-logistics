#pragma once

#include <algorithm>
#include <vector>
#include <json-c/json.h>

class ReadingObserver {
public:
    virtual ~ReadingObserver() = default;
    // Reading is validated and borrowed for this synchronous call only.
    virtual void onReading(json_object* reading) = 0;
};

class ReadingPublisher {
private:
    // Subscribers must outlive the publisher's notifications.
    std::vector<ReadingObserver*> observers;

public:
    void subscribe(ReadingObserver& observer) {
        if (std::find(observers.begin(), observers.end(), &observer) == observers.end()) {
            observers.push_back(&observer);
        }
    }

    void publish(json_object* reading) const {
        for (auto* observer : observers) {
            observer->onReading(reading);
        }
    }
};
