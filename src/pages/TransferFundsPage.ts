import { Page } from 'playwright';
import { BasePage } from './BasePage';

export interface TransferDetails {
  amount: string;
  fromAccountId: string;
  toAccountId: string;
}

export interface TransferResult {
  success: boolean;
  confirmationText: string;
  transferredAmount: string;
  fromAccount: string;
  toAccount: string;
}

export class TransferFundsPage extends BasePage {
  private static readonly URL = 'https://parabank.parasoft.com/parabank/transfer.htm';

  private get transferLink() {
    return this.page.locator('a[href*="transfer.htm"]');
  }

  private get amountInput() {
    return this.page.locator('#amount');
  }

  private get fromAccountSelect() {
    return this.page.locator('#fromAccountId');
  }

  private get toAccountSelect() {
    return this.page.locator('#toAccountId');
  }

  private get transferButton() {
    return this.page.locator('input[value="Transfer"]');
  }

  private get transferButtonFallback() {
    return this.page.locator('input[type="submit"]');
  }

  private get successMessage() {
    return this.page.locator('#showResult h1.title');
  }

  private get transferResultPanel() {
    return this.page.locator('#showResult');
  }

  private get errorMessage() {
    return this.page.locator('.error');
  }

  private get transferFormPanel() {
    return this.page.locator('#transferForm');
  }

  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.navigate(TransferFundsPage.URL);
  }

  async clickTransferFundsLink(): Promise<void> {
    await this.click(this.transferLink, 'Transfer Funds nav link');
  }

  async enterAmount(amount: string): Promise<void> {
    await this.fill(this.amountInput, amount, 'Transfer amount input');
  }

  async selectFromAccount(accountId: string): Promise<void> {
    await this.waitForVisible(this.fromAccountSelect, 'From account dropdown');
    // ParaBank populates dropdowns via AJAX - wait for the specific option to land in the DOM
    await this.page
      .locator(`#fromAccountId option[value="${accountId}"]`)
      .waitFor({ state: 'attached', timeout: BasePage.DEFAULT_TIMEOUT });
    await this.selectOption(this.fromAccountSelect, accountId, 'From account select');
  }

  async selectToAccount(accountId: string): Promise<void> {
    await this.waitForVisible(this.toAccountSelect, 'To account dropdown');
    await this.page
      .locator(`#toAccountId option[value="${accountId}"]`)
      .waitFor({ state: 'attached', timeout: BasePage.DEFAULT_TIMEOUT });
    await this.selectOption(this.toAccountSelect, accountId, 'To account select');
  }

  async clickTransfer(): Promise<void> {
    await this.clickWithFallback(this.transferButton, this.transferButtonFallback, 'Transfer button');
  }

  async transferFunds(details: TransferDetails): Promise<void> {
    this.logger.info(
      `Initiating transfer: $${details.amount} from ${details.fromAccountId} to ${details.toAccountId}`
    );
    await this.enterAmount(details.amount);
    await this.selectFromAccount(details.fromAccountId);
    await this.selectToAccount(details.toAccountId);
    await this.clickTransfer();
    await Promise.race([
      this.successMessage.waitFor({ state: 'visible', timeout: BasePage.DEFAULT_TIMEOUT }),
      this.errorMessage.waitFor({ state: 'visible', timeout: BasePage.DEFAULT_TIMEOUT }),
    ]);
  }

  async isTransferSuccessful(): Promise<boolean> {
    const visible = await this.isVisible(this.successMessage);
    if (visible) {
      const text = await this.getText(this.successMessage, 'Success heading');
      return text.toLowerCase().includes('complete');
    }
    return false;
  }

  async getSuccessMessage(): Promise<string> {
    return this.getText(this.successMessage, 'Transfer success message');
  }

  async getErrorMessage(): Promise<string> {
    return this.getText(this.errorMessage, 'Transfer error message');
  }

  async isErrorDisplayed(): Promise<boolean> {
    return this.isVisible(this.errorMessage);
  }

  async getTransferResultDetails(): Promise<TransferResult> {
    await this.waitForVisible(this.transferResultPanel, 'Transfer result panel');
    const successText = await this.getText(this.successMessage, 'Result heading');
    const resultText = await this.getText(this.transferResultPanel, 'Full result text');

    const amountMatch = resultText.match(/\$([\d,.]+)/);
    const accountMatches = resultText.match(/account #(\d+)/g) ?? [];

    return {
      success: successText.toLowerCase().includes('complete'),
      confirmationText: resultText,
      transferredAmount: amountMatch ? amountMatch[1] : '',
      fromAccount: accountMatches[0]?.replace('account #', '') ?? '',
      toAccount: accountMatches[1]?.replace('account #', '') ?? '',
    };
  }

  async getAvailableFromAccounts(): Promise<string[]> {
    await this.waitForVisible(this.fromAccountSelect, 'From account dropdown');
    const options = this.fromAccountSelect.locator('option');
    const count = await options.count();
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      const value = await options.nth(i).getAttribute('value');
      if (value) ids.push(value);
    }
    return ids;
  }

  async isTransferFormVisible(): Promise<boolean> {
    return this.isVisible(this.transferFormPanel);
  }
}
