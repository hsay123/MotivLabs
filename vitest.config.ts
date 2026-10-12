import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Only the frontend sources; `backend/` has its own vitest project.
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
