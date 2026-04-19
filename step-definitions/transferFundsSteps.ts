import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { ParaBankWorld } from '../src/support/world';

// Fetches account IDs from overview if not already stored in scenario context
async function ensureAccountIds(world: ParaBankWorld): Promise<string[]> {
  try {
    return world.getScenarioValue<string[]>('accountIds');
  } catch {
    await world.accountPage.open();
    const accountIds = await world.accountPage.getAllAccountIds();
    expect(accountIds.length, 'Need at least 2 accounts to run transfer tests').toBeGreaterThanOrEqual(2);
    world.storeScenarioValue('accountIds', accountIds);
    return accountIds;
  }
}

Given('I navigate to the Transfer Funds page', async function (this: ParaBankWorld) {
  await this.transferFundsPage.open();
  const isVisible = await this.transferFundsPage.isTransferFormVisible();
  expect(isVisible, 'Transfer form did not load').toBe(true);
});

Given('I note the current balance of all accounts', async function (this: ParaBankWorld) {
  await this.accountPage.open();
  const accountIds = await this.accountPage.getAllAccountIds();
  expect(accountIds.length, 'Need at least 2 accounts to test transfers').toBeGreaterThanOrEqual(2);

  const balances: Record<string, number> = {};
  for (const id of accountIds) {
    balances[id] = await this.accountPage.getAccountBalance(id);
  }
  this.storeScenarioValue('accountIds', accountIds);
  this.storeScenarioValue('initialBalances', balances);
});

Given('I have noted the account IDs', async function (this: ParaBankWorld) {
  await this.accountPage.open();
  const accountIds = await this.accountPage.getAllAccountIds();
  expect(accountIds.length, 'Need at least 2 accounts').toBeGreaterThanOrEqual(2);
  this.storeScenarioValue('accountIds', accountIds);
});

Given('I note the balance of the source account', async function (this: ParaBankWorld) {
  await this.accountPage.open();
  const accountIds = await this.accountPage.getAllAccountIds();
  expect(accountIds.length, 'Need at least 2 accounts').toBeGreaterThanOrEqual(2);
  this.storeScenarioValue('accountIds', accountIds);

  const sourceBalance = await this.accountPage.getAccountBalance(accountIds[0]);
  this.storeScenarioValue('sourceBalanceBefore', sourceBalance);
});

Given('I note the balance of the destination account', async function (this: ParaBankWorld) {
  // Navigate to overview so this step is self-contained and not order-dependent
  await this.accountPage.open();
  const accountIds = this.getScenarioValue<string[]>('accountIds');
  const destBalance = await this.accountPage.getAccountBalance(accountIds[1]);
  this.storeScenarioValue('destBalanceBefore', destBalance);
});

When(
  'I transfer {string} from the first account to the second account',
  async function (this: ParaBankWorld, amount: string) {
    const accountIds = await ensureAccountIds(this);
    await this.transferFundsPage.open();
    await this.transferFundsPage.transferFunds({
      amount,
      fromAccountId: accountIds[0],
      toAccountId: accountIds[1],
    });
    this.storeScenarioValue('transferAmount', amount);
  }
);

When('I submit a transfer with an empty amount', async function (this: ParaBankWorld) {
  const accountIds = await ensureAccountIds(this);
  await this.transferFundsPage.open();
  await this.transferFundsPage.transferFunds({
    amount: '',
    fromAccountId: accountIds[0],
    toAccountId: accountIds[1],
  });
});

Then('the transfer should complete successfully', async function (this: ParaBankWorld) {
  const success = await this.transferFundsPage.isTransferSuccessful();
  expect(success, 'Transfer was expected to succeed but the success message is not showing').toBe(true);
});

Then('the transfer should fail', async function (this: ParaBankWorld) {
  const success = await this.transferFundsPage.isTransferSuccessful();
  expect(success, 'Transfer was expected to fail but it shows as successful').toBe(false);
});

Then(
  'the confirmation should show the amount {string}',
  async function (this: ParaBankWorld, expectedAmount: string) {
    const result = await this.transferFundsPage.getTransferResultDetails();
    expect(
      result.confirmationText,
      `Expected confirmation text to include "$${expectedAmount}" but got: "${result.confirmationText}"`
    ).toContain(expectedAmount);
  }
);

Then('I should see a transfer error message', async function (this: ParaBankWorld) {
  const errorVisible = await this.transferFundsPage.isErrorDisplayed();
  expect(errorVisible, 'Expected a transfer error message but none is visible').toBe(true);
});

Then(
  'the account balances should reflect the transfer accurately',
  async function (this: ParaBankWorld) {
    const initialBalances = this.getScenarioValue<Record<string, number>>('initialBalances');
    const accountIds = this.getScenarioValue<string[]>('accountIds');
    const transferAmount = parseFloat(this.getScenarioValue<string>('transferAmount'));

    await this.accountPage.open();
    const sourceAfter = await this.accountPage.getAccountBalance(accountIds[0]);
    const destAfter = await this.accountPage.getAccountBalance(accountIds[1]);

    const sourceExpected = initialBalances[accountIds[0]] - transferAmount;
    const destExpected = initialBalances[accountIds[1]] + transferAmount;

    expect(sourceAfter).toBeCloseTo(sourceExpected, 2);
    expect(destAfter).toBeCloseTo(destExpected, 2);
  }
);

Then(
  'the transfer outcome should be {string}',
  async function (this: ParaBankWorld, expectedOutcome: string) {
    if (expectedOutcome === 'success') {
      const success = await this.transferFundsPage.isTransferSuccessful();
      expect(success, 'Transfer should have succeeded').toBe(true);
    } else if (expectedOutcome === 'failure') {
      const success = await this.transferFundsPage.isTransferSuccessful();
      expect(success, 'Transfer should have failed').toBe(false);
    } else {
      throw new Error(`Unknown outcome value: "${expectedOutcome}". Use "success" or "failure".`);
    }
  }
);

Then(
  'the source account balance should decrease by {string}',
  async function (this: ParaBankWorld, amountStr: string) {
    const accountIds = this.getScenarioValue<string[]>('accountIds');
    const sourceBefore = this.getScenarioValue<number>('sourceBalanceBefore');
    const amount = parseFloat(amountStr);

    await this.accountPage.open();
    const sourceAfter = await this.accountPage.getAccountBalance(accountIds[0]);
    expect(sourceAfter).toBeCloseTo(sourceBefore - amount, 2);
  }
);

Then(
  'the destination account balance should increase by {string}',
  async function (this: ParaBankWorld, amountStr: string) {
    const accountIds = this.getScenarioValue<string[]>('accountIds');
    const destBefore = this.getScenarioValue<number>('destBalanceBefore');
    const amount = parseFloat(amountStr);

    await this.accountPage.open();
    const destAfter = await this.accountPage.getAccountBalance(accountIds[1]);
    expect(destAfter).toBeCloseTo(destBefore + amount, 2);
  }
);
