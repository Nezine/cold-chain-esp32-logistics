# ESP32 Sensor Requirements

## Requirement

- Identifier: SENSOR-001
- Description: The ESP32 temperature sensor shall provide temperature readings for each shipment.
- User or stakeholder: Backend / QA / Frontend team
- Priority: High
- Owner: ESP32 Sensor
- Acceptance evidence: Repeatable temperature readings covering normal, warning, and critical situations.

## Sensor Reading Format

Each reading should contain:

- Device name: ESP32-Sensor-01
- Shipment name: SHIPMENT-001
- Date and time: 2026-09-26 10:00:00
- Temperature: 5.0
- Temperature unit: Celsius

## Sending Frequency

- The sensor sends one temperature reading every 10 seconds.

## Example Situations

1. Normal delivery:
   - Temperature: 5°C

2. Temperature slowly becoming unsafe:
   - Temperature: 8°C

3. Sudden serious temperature problem:
   - Temperature: 12°C

4. No reading arrives.

5. The same reading arrives twice.

6. A reading is missing information or has the wrong unit.

## Data Flow

Sensor example
→ System receives it
→ Backend checks it
→ Screen shows the result

## Demonstration Cases

- Normal temperature: 5°C
- Warning temperature: 8°C
- Critical temperature: 12°C

## Review Status

- Draft