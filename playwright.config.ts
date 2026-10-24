import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

const chromiumExecutable = process.env.CI
  ? undefined
  : [
      '/snap/bin/chromium',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium',
    ].find((path) => existsSync(path));

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4200',
    trace: 'on-first-retry',
    ...(chromiumExecutable
      ? { launchOptions: { executablePath: chromiumExecutable } }
      : {}),
  },
  webServer: {
    command: 'npm run ng -- serve demo --host 127.0.0.1 --port 4200',
    url: 'http://127.0.0.1:4200',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
