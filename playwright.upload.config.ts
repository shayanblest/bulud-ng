import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
const executablePath = [
  '/usr/bin/google-chrome',
  '/snap/bin/chromium',
  '/usr/bin/chromium',
].find(existsSync);
export default defineConfig({
  testDir: './e2e-upload',
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4319',
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  webServer: {
    command: 'node tools/serve-base.mjs --build --port 4319 --demo-uploads',
    url: 'http://127.0.0.1:4319',
    reuseExistingServer: false,
    timeout: 120000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
