import { Page } from 'playwright';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  private static readonly URL = 'https://parabank.parasoft.com/parabank/index.htm';

  private get usernameInput() {
    return this.page.locator('input[name="username"]');
  }

  private get passwordInput() {
    return this.page.locator('input[name="password"]');
  }

  private get loginButton() {
    return this.page.locator('input[value="Log In"]');
  }

  private get loginButtonFallback() {
    return this.page.locator('input[type="submit"]');
  }

  private get errorMessage() {
    return this.page.locator('.error');
  }

  private get welcomePanel() {
    // first reliable element after login - ParaBank redirects to overview.htm
    return this.page.locator('#rightPanel h1.title');
  }

  private get logoutLink() {
    return this.page.locator('a[href*="logout"]');
  }

  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.navigate(LoginPage.URL);
  }

  async enterUsername(username: string): Promise<void> {
    await this.fill(this.usernameInput, username, 'Username input');
  }

  async enterPassword(password: string): Promise<void> {
    await this.fill(this.passwordInput, password, 'Password input');
  }

  async clickLoginButton(): Promise<void> {
    await this.clickWithFallback(this.loginButton, this.loginButtonFallback, 'Login button');
  }

  async login(username: string, password: string): Promise<void> {
    this.logger.info(`Attempting login for user: ${username}`);
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLoginButton();
  }

  async logout(): Promise<void> {
    this.logger.info('Logging out');
    await this.click(this.logoutLink, 'Logout link');
  }

  async getErrorMessage(): Promise<string> {
    return this.getText(this.errorMessage, 'Login error message');
  }

  async isLoginErrorDisplayed(): Promise<boolean> {
    return this.isVisible(this.errorMessage);
  }

  async isLoggedIn(): Promise<boolean> {
    return this.isVisible(this.logoutLink);
  }

  async getWelcomeText(): Promise<string> {
    return this.getText(this.welcomePanel, 'Welcome panel');
  }
}
