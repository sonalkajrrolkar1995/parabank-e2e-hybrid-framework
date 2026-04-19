import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { ParaBankWorld } from '../src/support/world';

Given('I navigate to account overview', async function (this: ParaBankWorld) {
  await this.accountPage.open();
  const isVisible = await this.accountPage.isAccountTableVisible();
  expect(isVisible, 'Account overview table did not load').toBe(true);
});

Given('I have at least one account', async function (this: ParaBankWorld) {
  const accountIds = await this.accountPage.getAllAccountIds();
  expect(accountIds.length, 'No accounts found - user needs at least one account').toBeGreaterThan(0);
  this.storeScenarioValue('accountIds', accountIds);
});

Given(
  'I note the current transaction count for my first account',
  async function (this: ParaBankWorld) {
    await this.accountPage.open();
    const accountIds = await this.accountPage.getAllAccountIds();
    expect(accountIds.length, 'Need at least 1 account').toBeGreaterThan(0);
    this.storeScenarioValue('accountIds', accountIds);

    await this.transactionHistoryPage.openForAccount(accountIds[0]);
    const count = await this.transactionHistoryPage.getTransactionCount();
    this.storeScenarioValue('initialTransactionCount', count);
  }
);

Given(
  'I navigate to the transaction history for my first account',
  async function (this: ParaBankWorld) {
    await this.accountPage.open();
    const accountIds = await this.accountPage.getAllAccountIds();
    expect(accountIds.length, 'No accounts found').toBeGreaterThan(0);
    this.storeScenarioValue('accountIds', accountIds);
    await this.transactionHistoryPage.openForAccount(accountIds[0]);
  }
);

When(
  'I view the transaction history for my first account',
  async function (this: ParaBankWorld) {
    const accountIds = this.getScenarioValue<string[]>('accountIds');
    await this.transactionHistoryPage.openForAccount(accountIds[0]);
  }
);

When(
  'I view the transaction history for the source account',
  async function (this: ParaBankWorld) {
    const accountIds = this.getScenarioValue<string[]>('accountIds');
    await this.transactionHistoryPage.openForAccount(accountIds[0]);
  }
);

When(
  'I view the transaction history for the destination account',
  async function (this: ParaBankWorld) {
    const accountIds = this.getScenarioValue<string[]>('accountIds');
    await this.transactionHistoryPage.openForAccount(accountIds[1]);
  }
);

When(
  'I view the transaction history for account number {string}',
  async function (this: ParaBankWorld, accountIndex: string) {
    await this.accountPage.open();
    const accountIds = await this.accountPage.getAllAccountIds();
    const index = parseInt(accountIndex, 10);
    expect(
      index,
      `Account index ${index} is out of range - only ${accountIds.length} account(s) found`
    ).toBeLessThan(accountIds.length);
    await this.transactionHistoryPage.openForAccount(accountIds[index]);
    this.storeScenarioValue('accountIds', accountIds);
  }
);

When(
  'I filter transactions by period {string} and type {string}',
  async function (this: ParaBankWorld, period: string, type: string) {
    await this.transactionHistoryPage.searchTransactions(period, type);
  }
);

Then('the transaction table should be displayed', async function (this: ParaBankWorld) {
  const isVisible = await this.transactionHistoryPage.isTransactionTableVisible();
  expect(isVisible, 'Transaction table is not visible on the page').toBe(true);
});

Then(
  'transactions should have date, description, and amount columns',
  async function (this: ParaBankWorld) {
    const transactions = await this.transactionHistoryPage.getAllTransactions();
    expect(transactions.length, 'Expected at least one transaction row').toBeGreaterThan(0);

    const first = transactions[0];
    expect(first.date.length, 'Transaction date is empty').toBeGreaterThan(0);
    expect(first.description.length, 'Transaction description is empty').toBeGreaterThan(0);
    const hasAmount = first.debit !== null || first.credit !== null;
    expect(hasAmount, 'Transaction has neither debit nor credit amount').toBe(true);
  }
);

Then(
  'a debit transaction of {string} should be visible',
  async function (this: ParaBankWorld, amountStr: string) {
    const amount = parseFloat(amountStr);
    const transaction = await this.transactionHistoryPage.findTransactionByAmount(amount);
    expect(
      transaction,
      `Could not find a transaction for $${amountStr} in the history`
    ).not.toBeNull();
    expect(transaction!.debit).toBeCloseTo(amount, 2);
  }
);

Then(
  'a credit transaction of {string} should be visible',
  async function (this: ParaBankWorld, amountStr: string) {
    const amount = parseFloat(amountStr);
    const transaction = await this.transactionHistoryPage.findTransactionByAmount(amount);
    expect(
      transaction,
      `Could not find a transaction for $${amountStr} in the history`
    ).not.toBeNull();
    expect(transaction!.credit).toBeCloseTo(amount, 2);
  }
);

Then(
  'the transaction count should have increased by at least {int}',
  async function (this: ParaBankWorld, minIncrease: number) {
    const countBefore = this.getScenarioValue<number>('initialTransactionCount');
    const accountIds = this.getScenarioValue<string[]>('accountIds');
    await this.transactionHistoryPage.openForAccount(accountIds[0]);
    const countAfter = await this.transactionHistoryPage.getTransactionCount();
    expect(countAfter - countBefore).toBeGreaterThanOrEqual(minIncrease);
  }
);

Then('the transaction page should load without errors', async function (this: ParaBankWorld) {
  const currentUrl = await this.transactionHistoryPage.getCurrentURL();
  expect(currentUrl).toContain('activity.htm');
});
