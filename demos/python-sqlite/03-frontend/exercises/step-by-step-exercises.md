# Frontend Exercises

Your job is to make the system easy to understand for the person watching deliveries. Draw the screens first. You can use paper, a whiteboard, or a simple drawing tool.

## Exercise 1: Describe the User's Job

1. Choose one user for the demonstration: a dispatcher who watches shipments.
2. Write what this person needs to do: see a shipment, notice a temperature problem, and record a response.
3. Write what they should see before and after each action.
4. Ask the lead and QA member if the steps are clear.

**Done when:** someone who did not design the project can follow the user's story.

## Exercise 2: Draw the Screens

Draw these screens with boxes and labels. They do not need to look polished yet:

1. **Shipment list:** shows shipments and their current condition.
2. **Shipment details:** shows the latest temperature and recent readings.
3. **Alert screen:** shows the shipment, time, seriousness, and suggested action.
4. **Response area:** lets the user say what action was taken.

**Done when:** a user can find the shipment, understand the alert, and record a response.

## Exercise 3: Decide What Users See

For each screen, write what appears when:

1. Everything is normal.
2. There is a warning.
3. There is a critical problem.
4. No information has arrived yet.
5. Information is taking too long to arrive.
6. Something went wrong.

Use words as well as colors. For example, write **CRITICAL** instead of using only red.

**Done when:** a user can understand the condition without needing someone to explain it.

## Exercise 4: Connect the Screens to the System

Make a two-column list:

| User action | Information the system needs |
| --- | --- |
| Create a shipment | Shipment name and safe temperature range |
| Send a reading | Shipment, time, temperature, and unit |
| Record a response | Alert and action taken |

1. Add any missing actions.
2. Write the message shown after success.
3. Write the message shown after missing or incorrect information.
4. Check the list with the backend and sensor members.

**Done when:** every button or form has a clear purpose and expected result.

## Exercise 5: Ask Someone to Try It

1. Give your screen drawing or working screen to a teammate.
2. Ask them to find a critical shipment and record a response.
3. Do not guide them while they try.
4. Write down where they hesitated or became confused.
5. Fix the three biggest problems and ask QA to review them.

**Done when:** a teammate can complete the main task without coaching.
