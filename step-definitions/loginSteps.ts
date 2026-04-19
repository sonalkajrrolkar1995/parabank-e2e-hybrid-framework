import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { ParaBankWorld } from '../src/support/world';

// ─── Given ────────────────────────────────────────────────────────────────────

Given('I am on the ParaBank login page', async function (this: ParaBankWorld) {
  await this.loginPage.open();
});

Given(
  'I am logged in as {string} with password {string}',
  async function (this: ParaBankWorld, username: string, password: string) {
    await this.loginPage.open();
    await this.loginPage.login(username, password);
    const loggedIn = await this.loginPage.isLoggedIn();
    expect(loggedIn, `Login failed for user "${username}" - check credentials in test data`).toBe(
      true
    );
  }
);

// ─── When ─────────────────────────────────────────────────────────────────────

When(
  'I log in with username {string} and password {string}',
  async function (this: ParaBankWorld, username: string, password: string) {
    await this.loginPage.login(username, password);
  }
);

When('I submit the login form with empty credentials', async function (this: ParaBankWorld) {
  await this.loginPage.login('', '');
});

When('I log out', async function (this: ParaBankWorld) {
  await this.loginPage.logout();
});

// ─── Then ─────────────────────────────────────────────────────────────────────

Then('I should be logged in successfully', async function (this: ParaBankWorld) {
  const loggedIn = await this.loginPage.isLoggedIn();
  expect(loggedIn, 'Expected to be logged in but logout link is not visible').toBe(true);
});

Then('the welcome message should be displayed', async function (this: ParaBankWorld) {
  const welcomeText = await this.loginPage.getWelcomeText();
  expect(welcomeText.length, 'Welcome text should not be empty').toBeGreaterThan(0);
});

Then('the login should fail', async function (this: ParaBankWorld) {
  const loggedIn = await this.loginPage.isLoggedIn();
  expect(loggedIn, 'Expected login to fail but user appears logged in').toBe(false);
});

Then(
  'I should see the error message {string}',
  async function (this: ParaBankWorld, expectedError: string) {
    const isDisplayed = await this.loginPage.isLoginErrorDisplayed();
    expect(isDisplayed, 'Error message element is not visible on the page').toBe(true);

    const actualError = await this.loginPage.getErrorMessage();
    expect(actualError).toContain(expectedError);
  }
);

Then('I should see an error message', async function (this: ParaBankWorld) {
  const isDisplayed = await this.loginPage.isLoginErrorDisplayed();
  expect(isDisplayed, 'Expected an error message to be visible but none was found').toBe(true);
});

Then(
  'the login result should be {string}',
  async function (this: ParaBankWorld, expectedResult: string) {
    if (expectedResult === 'success') {
      const loggedIn = await this.loginPage.isLoggedIn();
      expect(loggedIn, 'Expected successful login').toBe(true);
    } else if (expectedResult === 'failure') {
      const loggedIn = await this.loginPage.isLoggedIn();
      expect(loggedIn, 'Expected login failure but user is logged in').toBe(false);
    } else {
      throw new Error(`Unknown expected login result: "${expectedResult}"`);
    }
  }
);

Then('I should be returned to the login page', async function (this: ParaBankWorld) {
  const currentUrl = await this.loginPage.getCurrentURL();
  expect(currentUrl, 'Expected to be redirected to login/index page after logout').toContain(
    'index.htm'
  );
});
