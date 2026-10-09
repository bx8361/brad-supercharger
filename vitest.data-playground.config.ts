import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["src/dataPlayground/tests/**/*.test.ts"] },
});
