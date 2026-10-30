# Small Week 1 proposal — September 28, 2026

Status: **Draft for team review**, prepared with Codex assistance. The learner
still needs to rebuild and explain this contribution. No shared decision has
been changed. This is partial progress, not completion of the Week 1 plan.

## One demonstration

Monitor one shipment of a fictional chilled demo product:
create shipment → receive reading → show temperature alert → record response.
Use Celsius. Defer accounts, route optimization, billing, multiple warehouses,
and production hardware deployment.

## Proposed rules for review

These are invented classroom rules, not a specification for real goods.

| Temperature t (°C) | Condition | Demo example |
| --- | --- | --- |
| 2 ≤ t ≤ 8 | Normal | 5 |
| 0 ≤ t < 2 or 8 < t ≤ 10 | Warning | 9 |
| t < 0 or t > 10 | Critical | 12 |

The simulator only produces measurements. Classification belongs in the future
backend. The team must approve thresholds, recovery behavior, and duplicate
handling before that implementation.

## Objects and required patterns, in plain language

- **Shipment:** a delivery, identified by an ID.
- **TemperatureReading:** one measurement linked to a shipment and device.
- **Alert:** a warning about an unsafe reading.
- **DispatchResponse:** the action a person records after reviewing an alert.
- **Observer pattern:** a temperature monitor is notified when a reading arrives.
- **Repository pattern:** code saves and retrieves objects through a repository,
  keeping database details out of the temperature rule.

One shipment can have many readings and alerts. These backend objects and
patterns are design notes only; the current code implements a SimulatedSensor.

## Proposed handoff to the API owner

Each reading contains `reading_id`, `device_id`, `shipment_id`, `recorded_at`
(ISO 8601 with timezone), numeric `temperature`, and `unit` equal to `C`.
The Python demo prints these fields as JSON, a text format programs can exchange.
Endpoints, transport, validation, and response formats still need discussion.

Next review: confirm the backend language, fields, thresholds, and owners with
teammates. The sensor owner can then add duplicate and invalid examples; the
backend owner can implement a small temperature policy with boundary tests.
