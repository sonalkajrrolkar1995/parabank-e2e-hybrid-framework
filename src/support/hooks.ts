import { Before, After, BeforeAll, AfterAll, Status, setDefaultTimeout } from '@cucumber/cucumber';
import { ParaBankWorld } from './world';
import { Logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = Logger.getInstance();

setDefaultTimeout(60_000);

BeforeAll(async function () {
  logger.info('=== Test Suite Starting ===');
  for (const dir of ['reports', 'screenshots']) {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }
});

AfterAll(async function () {
  logger.info('=== Test Suite Complete ===');
});

Before(async function (this: ParaBankWorld, scenario) {
  logger.step(`START: ${scenario.pickle.name}`);
  await this.initBrowser();
});

After(async function (this: ParaBankWorld, scenario) {
  const status = scenario.result?.status;
  const scenarioName = scenario.pickle.name
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9\-_]/g, '')
    .toLowerCase();

  if (status === Status.FAILED) {
    logger.error(`FAILED: ${scenario.pickle.name}`);

    // Guard: page might not exist if initBrowser() itself failed (CI binary missing, network down)
    if (this.page) {
      try {
        const screenshotBuffer = await this.page.screenshot({ fullPage: true });
        this.attach(screenshotBuffer, 'image/png');

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotPath = path.join(
          process.cwd(),
          'screenshots',
          `FAILED-${scenarioName}-${timestamp}.png`
        );
        fs.writeFileSync(screenshotPath, screenshotBuffer);
        logger.info(`Screenshot saved: ${screenshotPath}`);
      } catch (err) {
        logger.error('Could not capture failure screenshot', err);
      }
    }
  } else {
    logger.info(`PASSED: ${scenario.pickle.name}`);
  }

  await this.closeBrowser();
});
