import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
const executablePath = [
  '/usr/bin/google-chrome',
  '/snap/bin/chromium',
  '/usr/bin/chromium',
].find(existsSync);
export default defineConfig({
  testDir: './e2e-performance',
  workers: 1,
  outputDir: '.angular/performance-results',
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4316',
    trace: 'retain-on-failure',
    launchOptions: {
      ...(executablePath ? { executablePath } : {}),
      ignoreDefaultArgs: ['--disable-back-forward-cache'],
    },
  },
  webServer: {
    command: 'node tools/serve-base.mjs --port 4316',
    url: 'http://127.0.0.1:4316',
    reuseExistingServer: false,
    timeout: 120000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
