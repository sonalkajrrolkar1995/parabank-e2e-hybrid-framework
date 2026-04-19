import { Page, Locator } from 'playwright';
import { Logger } from '../utils/logger';
import { ScreenshotHelper } from '../utils/screenshotHelper';

export abstract class BasePage {
  protected readonly page: Page;
  protected readonly logger: Logger;
  protected readonly screenshot: ScreenshotHelper;

  protected static readonly DEFAULT_TIMEOUT = 30_000;
  protected static readonly NAVIGATION_TIMEOUT = 60_000;
  protected static readonly SHORT_TIMEOUT = 5_000;

  constructor(page: Page) {
    this.page = page;
    this.logger = Logger.getInstance();
    this.screenshot = new ScreenshotHelper(page);
  }

  async navigate(url: string): Promise<void> {
    try {
      this.logger.info(`Navigating to: ${url}`);
      await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: BasePage.NAVIGATION_TIMEOUT,
      });
    } catch (error) {
      await this.screenshot.capture('navigation-failure');
      this.logger.error(`Navigation failed to: ${url}`, error);
      throw error;
    }
  }

  async click(locator: Locator, description: string): Promise<void> {
    try {
      this.logger.info(`Clicking: ${description}`);
      await locator.waitFor({ state: 'visible', timeout: BasePage.DEFAULT_TIMEOUT });
      await locator.click();
    } catch (error) {
      await this.screenshot.capture(`click-failure-${description.replace(/\s+/g, '-').toLowerCase()}`);
      this.logger.error(`Click failed on: ${description}`, error);
      throw error;
    }
  }

  async fill(locator: Locator, value: string, description: string): Promise<void> {
    try {
      this.logger.info(`Filling "${description}"`);
      await locator.waitFor({ state: 'visible', timeout: BasePage.DEFAULT_TIMEOUT });
      await locator.clear();
      await locator.fill(value);
    } catch (error) {
      await this.screenshot.capture(`fill-failure-${description.replace(/\s+/g, '-').toLowerCase()}`);
      this.logger.error(`Fill failed on: ${description}`, error);
      throw error;
    }
  }

  async selectOption(locator: Locator, value: string, description: string): Promise<void> {
    try {
      this.logger.info(`Selecting option "${value}" in: ${description}`);
      await locator.waitFor({ state: 'visible', timeout: BasePage.DEFAULT_TIMEOUT });
      await locator.selectOption({ value });
    } catch (error) {
      await this.screenshot.capture(`select-failure-${description.replace(/\s+/g, '-').toLowerCase()}`);
      this.logger.error(`Select failed on: ${description}`, error);
      throw error;
    }
  }

  async getText(locator: Locator, description: string): Promise<string> {
    try {
      await locator.waitFor({ state: 'visible', timeout: BasePage.DEFAULT_TIMEOUT });
      const text = (await locator.textContent()) ?? '';
      this.logger.info(`Got text from "${description}": ${text.trim()}`);
      return text.trim();
    } catch (error) {
      await this.screenshot.capture(`getText-failure-${description.replace(/\s+/g, '-').toLowerCase()}`);
      this.logger.error(`getText failed on: ${description}`, error);
      throw error;
    }
  }

  async getInputValue(locator: Locator, description: string): Promise<string> {
    try {
      await locator.waitFor({ state: 'visible', timeout: BasePage.DEFAULT_TIMEOUT });
      return await locator.inputValue();
    } catch (error) {
      await this.screenshot.capture(`getInput-failure`);
      this.logger.error(`getInputValue failed on: ${description}`, error);
      throw error;
    }
  }

  async isVisible(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout: BasePage.SHORT_TIMEOUT });
      return true;
    } catch {
      return false;
    }
  }

  async waitForVisible(locator: Locator, description: string): Promise<void> {
    try {
      await locator.waitFor({ state: 'visible', timeout: BasePage.DEFAULT_TIMEOUT });
    } catch (error) {
      await this.screenshot.capture(`wait-failure-${description.replace(/\s+/g, '-').toLowerCase()}`);
      this.logger.error(`Element never became visible: ${description}`, error);
      throw error;
    }
  }

  async waitForURL(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForURL(urlPattern, { timeout: BasePage.NAVIGATION_TIMEOUT });
  }

  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  async getCurrentURL(): Promise<string> {
    return this.page.url();
  }

  // Fallback is ONLY for infrastructure-level flakiness (stale element, DOM re-render).
  // Never use this to hide a real app bug.
  protected async clickWithFallback(
    primary: Locator,
    fallback: Locator,
    description: string
  ): Promise<void> {
    try {
      await this.click(primary, description);
    } catch (primaryError) {
      this.logger.warn(`Primary locator failed for "${description}" - trying fallback`);
      try {
        await this.click(fallback, description);
      } catch (fallbackError) {
        await this.screenshot.capture(`both-locators-failed-${description.replace(/\s+/g, '-').toLowerCase()}`);
        this.logger.error(`Both locators failed for: ${description}`, fallbackError);
        throw fallbackError;
      }
    }
  }
}
