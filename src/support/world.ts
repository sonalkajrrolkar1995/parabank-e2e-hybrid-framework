import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium } from 'playwright';
import { LoginPage } from '../pages/LoginPage';
import { AccountPage } from '../pages/AccountPage';
import { TransferFundsPage } from '../pages/TransferFundsPage';
import { TransactionHistoryPage } from '../pages/TransactionHistoryPage';
import { Logger } from '../utils/logger';

export class ParaBankWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  loginPage!: LoginPage;
  accountPage!: AccountPage;
  transferFundsPage!: TransferFundsPage;
  transactionHistoryPage!: TransactionHistoryPage;

  // Per-scenario storage - cleared automatically between tests because each scenario gets a fresh World instance
  scenarioData: Record<string, unknown> = {};

  private readonly logger = Logger.getInstance();

  constructor(options: IWorldOptions) {
    super(options);
  }

  async initBrowser(): Promise<void> {
    const headless = process.env.HEADLESS !== 'false';
    this.logger.info(`Launching browser (headless=${headless})`);

    this.browser = await chromium.launch({
      headless,
      slowMo: headless ? 0 : 50,
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true,
    });

    this.page = await this.context.newPage();

    this.page.on('pageerror', (err) => {
      this.logger.error(`Browser page error: ${err.message}`);
    });

    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.logger.debug(`Browser console error: ${msg.text()}`);
      }
    });

    this.initPageObjects();
  }

  private initPageObjects(): void {
    this.loginPage = new LoginPage(this.page);
    this.accountPage = new AccountPage(this.page);
    this.transferFundsPage = new TransferFundsPage(this.page);
    this.transactionHistoryPage = new TransactionHistoryPage(this.page);
  }

  async closeBrowser(): Promise<void> {
    try {
      await this.context?.close();
      await this.browser?.close();
    } catch (error) {
      this.logger.error('Error closing browser', error);
    }
  }

  storeScenarioValue(key: string, value: unknown): void {
    this.scenarioData[key] = value;
  }

  getScenarioValue<T>(key: string): T {
    const value = this.scenarioData[key];
    if (value === undefined) {
      throw new Error(`Scenario value "${key}" was never stored. Check your step order.`);
    }
    return value as T;
  }
}

setWorldConstructor(ParaBankWorld);
