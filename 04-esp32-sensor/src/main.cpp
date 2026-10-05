#include <Arduino.h>

class SimulatedSensor {
private:
    // Fixed demo IDs contain no characters that need JSON escaping.
    const char* device_id = "device1";
    const char* shipment_id = "shipment1";
    float latest_temperature = 0.0;

public:
    void recordTemperature(float temperature) {
        latest_temperature = temperature;
    }

    float getTemperature() const {
        return latest_temperature;
    }

    void printReadingJson(unsigned long sequence) const {
        Serial.print("{\"device_id\":\"");
        Serial.print(device_id);
        Serial.print("\",\"shipment_id\":\"");
        Serial.print(shipment_id);
        Serial.print("\",\"sequence\":");
        Serial.print(sequence);
        Serial.print(",\"uptime_ms\":");
        Serial.print(millis());
        Serial.print(",\"temperature\":");
        Serial.print(latest_temperature, 2);
        Serial.println(",\"unit\":\"C\"}");
    }
};

SimulatedSensor sensor;
const float demoTemperatures[] = {2.0, 8.0, 8.1, 10.0, 10.1};
const size_t demoCount = sizeof(demoTemperatures) / sizeof(demoTemperatures[0]);
size_t readingIndex = 0;
unsigned long readingSequence = 0;

void setup() {
    Serial.begin(115200);
}

void loop() {
    sensor.recordTemperature(demoTemperatures[readingIndex]);
    sensor.printReadingJson(readingSequence);

    readingSequence++;
    readingIndex = (readingIndex + 1) % demoCount;
    delay(2000);
}
