# QA and Documentation Exercises

Your job is to check whether the project does what the team promised. You do not need to know every programming detail. Ask, “What should I see?” and record the answer.

## Exercise 1: Turn Promises into Checks

For every important requirement, write one sentence beginning with:

> When I ___, I should see ___ .

Example: “When a critical temperature arrives, I should see a critical alert for the correct shipment.”

Add normal cases, limit cases, and mistake cases. Ask the person responsible for each feature to confirm the sentence.

**Done when:** every requirement can be checked by looking at a result.

## Exercise 2: Make a Simple Check List

Create a table with these columns:

| Check number | What are we checking? | Who owns it? | How will we show it? | Result |
| --- | --- | --- | --- | --- |
| T01 | Critical temperature creates an alert | Backend | Critical-alert demonstration | Not tested |

1. Add one row for each important requirement.
2. Give each row a short number such as T01 or T02.
3. Mark each result as **Pass**, **Fail**, or **Not built**.
4. Tell the lead about every **Fail** or **Not built** item.

**Done when:** the table shows what works and what still needs attention.

## Exercise 3: Check the Temperature Rules

Use the limits agreed by the team. Try:

1. A temperature safely inside the range.
2. A temperature exactly at each limit.
3. A temperature just outside the range.
4. Several unsafe readings in a row.
5. A reading that returns to the safe range.

For each try, write the expected result, the actual result, and Pass or Fail.

**Done when:** the system's result matches the team's written rules.

## Exercise 4: Check the Whole Story

Start with no existing shipment data if possible:

1. Create a shipment.
2. Send a normal reading.
3. Send a warning reading.
4. Send a critical reading.
5. Find the alert on the screen.
6. Record a dispatch response.

Write down anything confusing, missing, or different from the plan.

**Done when:** the full story works from sensor example to user response.

## Exercise 5: Write the Final Explanation

Write a short document that explains:

1. What problem the project solves.
2. What a user can demonstrate.
3. How the shipment, sensor, alert, and response fit together.
4. How to start or demonstrate the project.
5. What is not finished and what could be added later.

Read the document while watching the demonstration. Correct anything that does not match.

**Done when:** a person outside the group can understand the project and its limits.
