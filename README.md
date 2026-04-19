# ParaBank End-to-End Hybrid Test Automation Framework

Hybrid test automation framework for the ParaBank banking application.
Combines BDD, Page Object Model, OOP design, and data-driven testing in one structured project.

**Application under test:** https://parabank.parasoft.com

---

## Stack

| Layer | Technology |
|---|---|
| Browser automation | Playwright |
| Language | TypeScript (strict mode) |
| BDD runner | Cucumber.js |
| Assertions | @playwright/test expect |
| Reporting | multiple-cucumber-html-reporter |
| CI/CD | GitHub Actions |

---

## Framework Structure

```
parabank-e2e-hybrid-framework/
|
+-- features/
|   +-- login.feature
|   +-- transfer-funds.feature
|   +-- transaction-history.feature
|
+-- step-definitions/
|   +-- loginSteps.ts
|   +-- transferFundsSteps.ts
|   +-- transactionHistorySteps.ts
|
+-- src/
|   +-- pages/
|   |   +-- BasePage.ts                  <- abstract base class, all page objects extend this
|   |   +-- LoginPage.ts
|   |   +-- AccountPage.ts
|   |   +-- TransferFundsPage.ts
|   |   +-- TransactionHistoryPage.ts
|   |
|   +-- support/
|   |   +-- world.ts                     <- Cucumber World, one browser context per scenario
|   |   +-- hooks.ts                     <- Before/After with screenshot on failure
|   |
|   +-- data/
|   |   +-- users.json                   <- valid and invalid login credentials
|   |   +-- transferData.json            <- transfer amounts including boundary values
|   |   +-- testData.ts                  <- typed accessors for JSON data
|   |
|   +-- utils/
|       +-- logger.ts
|       +-- screenshotHelper.ts
|
+-- scripts/
|   +-- generateReport.js
|
+-- .github/workflows/
|   +-- ci.yml
|
+-- cucumber.json
+-- tsconfig.json
+-- package.json
```

---

## Design Decisions

**BasePage** is an abstract class. All page objects extend it. Shared browser interactions (click, fill, select, getText) live here with consistent error handling and automatic screenshots on failure.

**No assertions in page objects.** Page objects only perform actions and return state. All assertions are in step definitions.

**Each scenario gets a fresh browser context.** No session is shared between tests. This keeps tests independent.

**AJAX wait for transfer dropdowns.** ParaBank loads account dropdowns via AJAX after page load. The framework waits for the specific option value to appear in the DOM before selecting, not just for the select element to be visible.

**Balance comparisons use `toBeCloseTo(x, 2)`.** Floating-point arithmetic on currency requires tolerance-based comparison, not strict equality.

**Fallback locators** are allowed only for infrastructure-level issues (stale DOM element after re-render). They are never used to hide real application bugs.

---

## Scenarios

| Feature | Scenarios | Coverage |
|---|---|---|
| Login | 6 | Valid login, invalid credentials, empty fields, logout, data-driven outline |
| Fund Transfer | 8 | Happy path, zero amount, negative amount, empty amount, balance consistency, data-driven outline |
| Transaction History | 6 | View history, post-transfer audit, count verification, filter, data-driven outline |

Total: **28 scenarios, 128 steps**

---

## Test Data

Test data lives in `src/data/`. It is independent from the test logic and can be updated without touching step definitions.

- `users.json` - valid users, invalid credentials, empty field cases
- `transferData.json` - valid amounts, invalid amounts, boundary values (zero, negative, minimal positive)

---

## Setup

**Requirements:** Node.js 18 or higher

```bash
npm install
npx playwright install chromium
```

---

## Run Tests

```bash
# All tests
npm test

# Smoke tests only
npm run test:smoke

# Full regression
npm run test:regression

# By feature
npm run test:login
npm run test:transfer
npm run test:history

# With visible browser (useful for debugging)
HEADLESS=false npm run test:smoke

# Generate HTML report after run
npm run report
```

HTML report is written to `reports/cucumber-report.html`.
Screenshots on failure are saved to `screenshots/` and embedded in the HTML report.

---

## CI/CD

GitHub Actions runs on every push and pull request to `main` and `develop`.

- **Smoke job** runs on every push - fast feedback
- **Regression job** runs on merge to main
- Test report and failure screenshots are uploaded as artifacts

Workflow file: `.github/workflows/ci.yml`

---

## Login Credentials

The default credentials used in the test scenarios match the ParaBank demo site:

| Username | Password |
|---|---|
| john | demo |
| jane | demo |

If the demo site credentials change, update `src/data/users.json`.

---

## Extending the Framework

**Add a new page object:**
1. Create a class in `src/pages/` that extends `BasePage`
2. Add locators as private getters
3. Add action methods (no assertions)
4. Add the new page to `world.ts`

**Add a new feature:**
1. Write a `.feature` file in `features/`
2. Add step definitions in `step-definitions/`
3. Use `this.storeScenarioValue` and `this.getScenarioValue` to pass data between steps

**Add test data:**
1. Add entries to the relevant JSON file in `src/data/`
2. Add a typed accessor in `testData.ts` if needed
3. Reference the data in a Scenario Outline examples table
