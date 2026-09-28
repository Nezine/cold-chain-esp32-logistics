# Rebuild today's small contribution

Work one checkpoint at a time. Budget roughly 60–90 minutes, taking longer if
needed. The reference was prepared with Codex assistance. Send your attempts
back for feedback; completing the reference does not demonstrate your understanding.
Use `/tmp/cold-chain-practice/` for practice so the reference stays available.

## 1. Predict before running (5 minutes)

Read `04-esp32-sensor/examples/simulate_sensor.py`. Predict how many lines it
prints and which fields stay the same. Run it and compare with your prediction.
Explain the difference between a device ID and a shipment ID.

## 2. Rebuild the class (15–25 minutes)

A class is a description of a kind of object. An instance is one actual object.
`self` refers to that object. `__init__` sets its initial data. A method is a
function attached to a class. A dictionary stores named fields and their values.

Close the reference. Write a SimulatedSensor class that remembers device and
shipment IDs. Add a reading method returning a dictionary with all seven fields.
Create two sensor objects with different IDs and print a reading from each.

Checkpoint: show your code and explain why the objects produce different IDs.

## 3. Rebuild the demo (10–15 minutes)

Create three readings at 5, 9, and 12°C with distinct reading IDs and timestamps
ten seconds apart. Put them in a list. Use a loop and `json.dumps` to print them.
Look up unfamiliar syntax after trying; you do not need to memorize libraries.
Explain why printing a reading is different from sending it to a server.

## 4. Rebuild the tests and GitHub check (20–30 minutes)

A test compares actual behavior with an expected result. Read one reference test
at a time and explain what mistake it could catch. Write your own three checks:
measurement sequence and unique IDs, fields and time intervals, repeatability.
Change one reading ID to duplicate another and confirm a test fails; restore it.

Rewrite the short workflow in your practice folder. Explain `on`, `jobs`,
`runs-on`, `uses`, and `run`: when it starts, what it runs, which computer runs it,
which reusable steps it calls, and which shell command it executes.

## 5. Explain and report (10 minutes)

Rewrite the small proposal and demo notes in your own words. Explain why 8°C
is normal but 9°C is a warning under our draft rule. Explain Observer and
Repository using the shipment example; their implementations are future work.
Write a short report separating completed, tested, and unfinished work.

Done when you can rebuild these files without copying, explain each part, and
change a measurement while predicting the output and affected test. Bring each
checkpoint back for review before moving on if you are unsure.
