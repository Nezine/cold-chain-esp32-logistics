# IoT Simulation Exercises

Your job is to act like a temperature sensor. You can use an ESP32, a small script, or a prepared list of example readings. The team needs repeatable examples more than complicated hardware.

## Exercise 1: Decide What the Sensor Sends

Write down one example reading containing:

- Device name.
- Shipment name.
- Date and time.
- Temperature.
- Temperature unit, such as Celsius.

Then decide:

1. How often the sensor sends a reading.
2. Which temperatures are normal.
3. Where the sensor gets the shipment name.

Save the examples in `shared/requirements/`.

**Done when:** another member can understand every part of one reading.

## Exercise 2: Prepare Example Situations

Write a short list of readings for each situation:

1. Normal delivery.
2. Temperature slowly becoming unsafe.
3. Sudden serious temperature problem.
4. No reading arrives.
5. The same reading arrives twice.
6. A reading is missing information or has the wrong unit.

Ask QA to check that each situation has an expected result.

**Done when:** you can repeat each situation and get the same result.

## Exercise 3: Explain How a Reading Travels

Draw arrows showing this path:

`Sensor example -> system receives it -> system checks it -> screen shows the result`

Write down:

1. Where the reading is checked.
2. What happens if it cannot be delivered.
3. What happens when it crosses the warning or critical temperature.

Review the drawing with the backend member.

**Done when:** the team can follow a reading from the sensor to the screen.

## Exercise 4: Prepare the Demonstration

Choose one example for each part of the demonstration:

1. Normal temperature.
2. Warning temperature.
3. Critical temperature that needs a dispatch response.

For each one, write what the user should see. Keep the examples ready so you can run them again during testing.

**Done when:** the team can show all three situations without inventing data during the presentation.

## Exercise 5: Check for Mistakes

1. Run each example twice.
2. Check whether the same readings produce the same result.
3. Check that a repeated reading does not create repeated alerts unless the team agreed that it should.
4. Write down anything the simulator cannot handle yet.

**Done when:** QA has the examples and knows what result to expect.
