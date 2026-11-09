import { defineConfig } from "vitest/config";

// Юнит-тесты — только чистая логика в lib/. Сценарии в браузере — Playwright (tests/e2e).
export default defineConfig({ test: { include: ["lib/**/*.test.ts"] } });
