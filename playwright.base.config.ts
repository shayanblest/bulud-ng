import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
const executablePath = [
  '/usr/bin/google-chrome',
  '/snap/bin/chromium',
  '/usr/bin/chromium',
].find(existsSync);
export default defineConfig({
  testDir: './e2e-base',
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4313',
    trace: 'retain-on-failure',
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  webServer: {
    command: 'npm run ng -- serve base --host 127.0.0.1 --port 4313',
    url: 'http://127.0.0.1:4313',
    reuseExistingServer: false,
    timeout: 120000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
