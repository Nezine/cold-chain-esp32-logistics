# Seven-Day Execution Plan

Use this plan as the team's shared exercise sheet. Work through one day at a time. The goal is a small demonstration, not a complete logistics platform. You do not need advanced programming knowledge to complete the planning and testing exercises.

## Team Roles

1. **Lead:** keeps everyone focused and records decisions.
2. **Domain and Backend:** writes the temperature rules and builds the system's basic actions.
3. **Frontend:** makes the screens that show shipments and alerts.
4. **IoT Simulation:** prepares example temperature readings; physical ESP32 hardware is optional.
5. **QA and Documentation:** checks the results and writes down what works.

Everyone works together on Days 1 and 2. After that, each person works on their own part and shows progress to the group each day.

## Day 1: Agree on the Boundary

**Group exercise**

1. Write one sentence describing the problem and the first-version solution.
2. Choose one product type and one temperature unit.
3. Define the first demonstration: create shipment -> receive reading -> detect excursion -> show alert -> record dispatch response.
4. List at least five things explicitly outside the first version, such as user accounts, route optimization, billing, real hardware deployment, or multi-warehouse support.
5. Give every requirement an owner and priority.

**Evidence to create**

- Agreed requirements in `shared/requirements/`.
- A glossary in `shared/domain-model/`.
- A decision log in `shared/meeting-notes/`.
- A schedule with one review time per day.

**Done when:** everyone can explain the demonstration in the same order and using the same words.

## Day 2: Agree on the Rules

**Group exercise**

1. Decide the few shipment statuses needed for the demonstration.
2. Decide which temperatures are safe, warnings, and critical problems.
3. Decide what happens when the temperature returns to normal and when someone responds to an alert.
4. Decide what every sensor example must include: device, shipment, time, temperature, and unit.
5. List the actions the system must support: create shipment, send reading, see alert, and record response.
6. For each action, write what should happen when it works and when information is missing or wrong.

**Evidence to create**

- Domain model and state/rule notes in `shared/domain-model/`.
- Frontend/backend interaction contract in `shared/architecture/`.
- Sensor scenario list in `shared/requirements/`.
- QA acceptance criteria and requirement IDs in `shared/testing/`.

**Done when:** the people making the screens, system, sensor examples, and checks all agree on the same information.

## Day 3: Make the First Pieces

**Domain and Backend**

1. Build the shipment and temperature rule for one product type.
2. Choose one simple way to save the information.
3. Make an alert appear when the temperature is unsafe.
4. Make the agreed actions work in the chosen technology.

**Frontend**

1. Make a shipment list and shipment details screen.
2. Show the latest temperature, alert seriousness, and response action.
3. Show clear messages when information is loading, missing, late, wrong, or unavailable.

**IoT Simulation**

1. Prepare repeatable normal, warning, and critical temperature examples.
2. Use the agreed information in every example.
3. Include one repeated reading and one incorrect reading.

**QA and Documentation**

1. Turn the promised features into a simple check list.
2. Make a table showing the feature, its owner, how to demonstrate it, and the result.

**Lead**

1. Check that everyone is using the agreed information and rules.
2. Record problems immediately and remove anything not needed for the demonstration.

**Done when:** each person has something small to show another member, even if the pieces are not connected yet.

## Day 4: Integrate the Normal Path

**Group exercise**

1. Start with a clean system.
2. Create one shipment.
3. Send normal simulated readings.
4. Confirm the frontend displays the shipment and latest reading.
5. Confirm the reading and shipment remain available after a restart, if persistence is in scope.

**Evidence to create**

- A repeatable run procedure.
- Screenshots or recorded output for the normal path.
- A list of integration failures with an owner and next action.

**Done when:** a new team member can follow the instructions and repeat the normal demonstration.

## Day 5: Integrate Alerts and Dispatch

**Group exercise**

1. Send readings that cross the warning threshold.
2. Send readings that cross the critical threshold.
3. Confirm the alert contains shipment, severity, time, and recommended action.
4. Record a dispatch response and confirm its status is visible.
5. Send recovery readings and agree what changes in the alert view.

**Done when:** the full path from temperature example to user response works without changing saved data by hand.

## Day 6: Test, Simplify, and Document

**QA-led exercise**

1. Test inside-range, exact-boundary, just-outside-range, sustained violation, and recovery readings.
2. Test duplicate, delayed, missing, invalid, and out-of-order readings where supported.
3. Test frontend loading, empty, delayed, and error states.
4. Re-run the end-to-end normal and critical scenarios from a clean start.
5. Mark each requirement as pass, fail, or not implemented.

**Whole team**

1. Fix only failures that affect the agreed demo.
2. Remove features that are unfinished and outside the vertical slice.
3. Document setup steps, architecture, patterns, limitations, and known failures.

**Done when:** the check list says what really works, not what the team hoped to build.

## Day 7: Rehearse and Submit

1. Run the demo from a clean checkout or clearly documented starting state.
2. Rehearse a five-minute explanation: problem, domain rules, architecture, normal path, critical alert path, and limitations.
3. Prepare a backup recording, screenshots, or console transcript in case live integration fails.
4. Check that every team member can explain their own contribution and one connection to another role.
5. Freeze new features. Fix only release-blocking defects and documentation errors.

**Final evidence**

- Runnable project or clearly repeatable simulation.
- Requirements, glossary, domain model, architecture/contract, tests, and traceability table.
- Demonstration script and limitations.
- A short record of who reviewed each artifact.

## Scope Rule

If the team falls behind, keep this order: simulated sensor input, one product type, one shipment, one warning/critical rule, one alert view, one dispatch response, and documented tests. Defer hardware deployment, authentication, route optimization, analytics, and multiple product types.