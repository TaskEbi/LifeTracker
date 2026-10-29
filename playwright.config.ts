import { defineConfig, devices } from '@playwright/test';

/** End-to-end checks in WebKit (Safari's engine) at iPhone size, against the local-only dev build. */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5174',
    ...devices['iPhone 15'],
    // Celebrations off (Settings → Celebrations, per device) so flows go straight to the reward
    // box; tests/e2e/celebrations.spec.ts switches them back on.
    storageState: { cookies: [], origins: [{ origin: 'http://localhost:5174', localStorage: [{ name: 'lifetracker-fx', value: 'off' }] }] },
  },
  projects: [{ name: 'iphone-webkit', use: { browserName: 'webkit' } }],
  // Port 5174 with no .env: always local-only, so tests can never touch a real database.
  webServer: { command: 'npx vite --port 5174 --strictPort --mode e2e', url: 'http://localhost:5174', reuseExistingServer: false, timeout: 60_000 },
});
