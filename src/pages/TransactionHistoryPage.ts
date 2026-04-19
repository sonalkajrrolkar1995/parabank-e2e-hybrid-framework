import { Page } from 'playwright';
import { BasePage } from './BasePage';

export interface Transaction {
  date: string;
  description: string;
  debit: number | null;
  credit: number | null;
}

export class TransactionHistoryPage extends BasePage {
  private static readonly BASE_URL = 'https://parabank.parasoft.com/parabank/activity.htm';

  private get transactionTable() {
    return this.page.locator('#transactionTable');
  }

  private get transactionRows() {
    return this.page.locator('#transactionTable tbody tr');
  }

  private get activityPeriodSelect() {
    return this.page.locator('#month');
  }

  private get transactionTypeSelect() {
    return this.page.locator('#transactionType');
  }

  private get findTransactionsButton() {
    return this.page.locator('input[value="Find Transactions"]');
  }

  constructor(page: Page) {
    super(page);
  }

  async openForAccount(accountId: string): Promise<void> {
    await this.navigate(`${TransactionHistoryPage.BASE_URL}?id=${accountId}`);
  }

  async selectActivityPeriod(period: string): Promise<void> {
    await this.selectOption(this.activityPeriodSelect, period, 'Activity period select');
  }

  async selectTransactionType(type: string): Promise<void> {
    await this.selectOption(this.transactionTypeSelect, type, 'Transaction type select');
  }

  async clickFindTransactions(): Promise<void> {
    await this.click(this.findTransactionsButton, 'Find Transactions button');
  }

  async searchTransactions(period: string, type: string): Promise<void> {
    this.logger.info(`Searching transactions: period=${period}, type=${type}`);
    // ParaBank uses "" as the option value for "All" in both dropdowns
    const periodValue = period === 'All' ? '' : period;
    const typeValue = type === 'All' ? '' : type;
    await this.selectActivityPeriod(periodValue);
    await this.selectTransactionType(typeValue);
    await this.clickFindTransactions();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getTransactionCount(): Promise<number> {
    try {
      await this.waitForVisible(this.transactionTable, 'Transaction table');
      return await this.transactionRows.count();
    } catch {
      return 0;
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    await this.waitForVisible(this.transactionTable, 'Transaction table');
    const rows = this.transactionRows;
    const count = await rows.count();
    const transactions: Transaction[] = [];

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const cells = row.locator('td');
      const cellCount = await cells.count();
      if (cellCount < 4) continue;

      const date = await this.getText(cells.nth(0), `Row ${i} date`);
      const description = await this.getText(cells.nth(1), `Row ${i} description`);
      const debitText = await this.getText(cells.nth(2), `Row ${i} debit`);
      const creditText = await this.getText(cells.nth(3), `Row ${i} credit`);

      transactions.push({
        date,
        description,
        debit: this.parseOptionalAmount(debitText),
        credit: this.parseOptionalAmount(creditText),
      });
    }
    return transactions;
  }

  async findTransactionByAmount(amount: number): Promise<Transaction | null> {
    const transactions = await this.getAllTransactions();
    return (
      transactions.find(
        (t) =>
          (t.debit !== null && Math.abs(t.debit - amount) < 0.001) ||
          (t.credit !== null && Math.abs(t.credit - amount) < 0.001)
      ) ?? null
    );
  }

  async getMostRecentTransaction(): Promise<Transaction | null> {
    const transactions = await this.getAllTransactions();
    return transactions.length > 0 ? transactions[0] : null;
  }

  async isTransactionTableVisible(): Promise<boolean> {
    return this.isVisible(this.transactionTable);
  }

  async hasNoTransactions(): Promise<boolean> {
    const tableVisible = await this.isVisible(this.transactionTable);
    if (!tableVisible) return true;
    return (await this.transactionRows.count()) === 0;
  }

  private parseOptionalAmount(raw: string): number | null {
    const cleaned = raw.replace(/[$,\s]/g, '');
    if (!cleaned || cleaned === '-') return null;
    const value = parseFloat(cleaned);
    return isNaN(value) ? null : value;
  }
}
