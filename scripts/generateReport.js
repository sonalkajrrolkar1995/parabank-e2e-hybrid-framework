const report = require('multiple-cucumber-html-reporter');
const path = require('path');
const fs = require('fs');

const reportPath = path.join(process.cwd(), 'reports');
const jsonFile = path.join(reportPath, 'cucumber-report.json');

if (!fs.existsSync(jsonFile)) {
  console.log('No cucumber-report.json found - skipping HTML report generation.');
  process.exit(0);
}

report.generate({
  jsonDir: reportPath,
  reportPath: reportPath,
  metadata: {
    browser: { name: 'chrome', version: 'latest' },
    device: 'Local machine',
    platform: { name: process.platform, version: process.version },
  },
  customData: {
    title: 'ParaBank E2E Test Results',
    data: [
      { label: 'Project', value: 'ParaBank Hybrid Test Automation' },
      { label: 'Framework', value: 'Playwright + TypeScript + BDD + POM' },
      { label: 'Execution Date', value: new Date().toLocaleString() },
    ],
  },
  pageTitle: 'ParaBank Test Report',
  reportName: 'ParaBank E2E Test Execution Report',
  displayDuration: true,
  durationInMS: true,
});

console.log('HTML report generated at: reports/index.html');
