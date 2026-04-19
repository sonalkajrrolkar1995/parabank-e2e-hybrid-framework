import { Page } from 'playwright';
import { BasePage } from './BasePage';

export class AccountPage extends BasePage {
  private static readonly URL = 'https://parabank.parasoft.com/parabank/overview.htm';

  private get accountOverviewLink() {
    return this.page.locator('a[href*="overview"]');
  }

  private get accountTable() {
    return this.page.locator('#accountTable');
  }

  private get pageHeading() {
    return this.page.locator('#rightPanel h1.title');
  }

  private accountLink(accountId: string) {
    return this.page.locator(`a[href*="activity.htm?id=${accountId}"]`);
  }

  private accountRow(accountId: string) {
    return this.page.locator(`#accountTable tbody tr:has(a[href*="${accountId}"])`);
  }

  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.navigate(AccountPage.URL);
  }

  async clickAccountOverview(): Promise<void> {
    await this.click(this.accountOverviewLink, 'Account Overview link');
  }

  async openAccount(accountId: string): Promise<void> {
    this.logger.info(`Opening account detail for: ${accountId}`);
    await this.click(this.accountLink(accountId), `Account ${accountId} link`);
  }

  async getAccountBalance(accountId: string): Promise<number> {
    const row = this.accountRow(accountId);
    await this.waitForVisible(row, `Account ${accountId} row`);
    const balanceCell = row.locator('td:nth-child(2)');
    const rawText = await this.getText(balanceCell, `Balance for account ${accountId}`);
    return this.parseAmount(rawText);
  }

  async getAllAccountIds(): Promise<string[]> {
    await this.waitForVisible(this.accountTable, 'Account table');
    const links = this.page.locator('#accountTable tbody tr td:first-child a');
    const count = await links.count();
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      const href = (await links.nth(i).getAttribute('href')) ?? '';
      const match = href.match(/id=(\d+)/);
      if (match) ids.push(match[1]);
    }
    return ids;
  }

  async getTotalBalance(): Promise<number> {
    const totalBalanceLocator = this.page.locator('#accountTable tfoot .balance');
    const rawText = await this.getText(totalBalanceLocator, 'Total balance');
    return this.parseAmount(rawText);
  }

  async isAccountTableVisible(): Promise<boolean> {
    return this.isVisible(this.accountTable);
  }

  async getPageHeading(): Promise<string> {
    return this.getText(this.pageHeading, 'Page heading');
  }

  parseAmount(raw: string): number {
    const cleaned = raw.replace(/[$,\s]/g, '');
    const value = parseFloat(cleaned);
    if (isNaN(value)) {
      this.logger.error(`Failed to parse amount from: "${raw}"`);
      throw new Error(`Invalid amount string: "${raw}"`);
    }
    return value;
  }
}
