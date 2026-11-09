import { defineConfig, devices } from "@playwright/test";

// Сценарии из ТЗ, п. 32. Каждый тест — новое устройство (новая cookie), поэтому тесты не мешают друг другу.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  workers: 1,
  use: {
    baseURL: process.env.E2E_URL ?? "http://127.0.0.1:3003",
    // ponytail: без GPU — в этом окружении headless Chromium иначе падает на страницах с несколькими видео.
    launchOptions: { args: ["--disable-gpu"] },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: { command: "pnpm dev", url: "http://127.0.0.1:3003", reuseExistingServer: true, timeout: 120_000 },
});
