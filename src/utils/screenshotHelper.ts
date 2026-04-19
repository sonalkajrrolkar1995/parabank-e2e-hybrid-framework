import { Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

export class ScreenshotHelper {
  private readonly page: Page;
  private static readonly DIR = path.join(process.cwd(), 'screenshots');

  constructor(page: Page) {
    this.page = page;
    this.ensureDir();
  }

  async capture(name: string): Promise<string> {
    this.ensureDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const filePath = path.join(ScreenshotHelper.DIR, filename);

    try {
      await this.page.screenshot({ path: filePath, fullPage: true });
      console.log(`[SCREENSHOT] Saved: ${filePath}`);
      return filePath;
    } catch (err) {
      console.error(`[SCREENSHOT] Could not capture screenshot: ${err}`);
      return '';
    }
  }

  async captureAsBuffer(): Promise<Buffer> {
    return this.page.screenshot({ fullPage: true });
  }

  private ensureDir(): void {
    if (!fs.existsSync(ScreenshotHelper.DIR)) {
      fs.mkdirSync(ScreenshotHelper.DIR, { recursive: true });
    }
  }
}
