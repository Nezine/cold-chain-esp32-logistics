# Domain and Backend Exercises

Your job is to describe the project rules and help the other members use the system. Start with written examples before trying to code.

## Exercise 1: Understand the Delivery

1. Ask the group to describe how one shipment travels from the starting place to the destination.
2. Write down the important things, actions, and conditions. Example: shipment, sensor, temperature, alert, delivered.
3. Draw a simple picture showing how these things are connected.
4. Save the word list and picture in `shared/domain-model/`.

**Done when:** another person can look at the picture and explain the delivery.

## Exercise 2: Write the Temperature Rules

Answer these questions in plain language:

1. What information does a new shipment need?
2. What temperature is safe?
3. What temperature creates a warning?
4. What temperature creates a critical alert?
5. What happens when the temperature returns to normal?
6. Who records the response to an alert?

Use a small table with example temperatures. Ask the QA member to check the rules.

**Done when:** the team can predict the result of any example temperature.

## Exercise 3: Explain the Required Design Ideas

You do not need advanced words. Write one short paragraph and draw one simple diagram:

1. **Observer idea:** when a new temperature arrives, the part watching temperatures is told about it and can create an alert.
2. **Repository idea:** the main rules ask for shipments and readings without needing to know exactly where they are saved.
3. Show three boxes: project rules, actions the system can do, and saved data.
4. Save the explanation in `shared/architecture/`.

**Done when:** each member can explain the two ideas using the examples above.

## Exercise 4: List What the System Must Do

Write a simple list of actions:

- Create a shipment.
- Send a temperature reading.
- View a shipment and its latest reading.
- View an alert.
- Record a response to an alert.

For each action, write:

1. What information goes in.
2. What the user or sensor gets back when it works.
3. What message appears when information is missing or wrong.

Review this list with the frontend, sensor, and QA members. Save it in `shared/architecture/`.

**Done when:** the other members know exactly what information to send and expect back.

## Exercise 5: Decide What Must Be Saved

1. List the information that should still exist after the program closes: shipments, readings, alerts, and responses.
2. Decide whether the demonstration needs older readings or only the latest reading.
3. Choose the simplest way to save the information that the team can explain and run.
4. Write the choice and its limits in `shared/architecture/`.

**Done when:** the team knows what can be recovered after a restart.
