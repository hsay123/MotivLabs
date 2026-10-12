/**
 * S1 — Auth & roles on the real backend.
 *
 * What this proves (nothing mocked):
 *  1. An unauthenticated visitor to a product route is sent to /login.
 *  2. With a real Privy session, /workspace resolves the live profile from
 *     GET /api/me (the shell renders `user.email · user.role`), redirects to
 *     the contributor workspace, and the session survives a reload.
 *  3. Role gating is real: a contributor who visits /workspace/buyer is
 *     redirected back to their own workspace.
 *  4. Sign out ends the session and returns to /login.
 *
 * Prereq: playwright/.auth/contributor.json (see scripts/capture-sessions.mjs).
 * Run: npx playwright test e2e/s1-auth-roles.spec.ts
 */
import { test, expect } from "playwright/test";

const CONTRIBUTOR = "./playwright/.auth/contributor.json";

test.describe("unauthenticated gate", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("sends /workspace visitors to /login", async ({ page }) => {
    await page.goto("/workspace");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("button", { name: /sign in/i }).first()).toBeVisible();
  });
});

test.describe("contributor session (real Privy session)", () => {
  test.use({ storageState: CONTRIBUTOR });

  test("resolves the real profile and lands on the contributor workspace", async ({
    page,
  }) => {
    await page.goto("/workspace");
    await expect(page).toHaveURL(/\/workspace\/contributor$/, { timeout: 20_000 });

    // Live session strip proves /api/me answered with the real session.
    await expect(
      page.getByText("Signed in and verified by the platform API"),
    ).toBeVisible();
    // The account line renders the real profile from /api/me: email/address + role.
    await expect(page.getByText(/· contributor$/)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
  });

  test("session persists across a reload", async ({ page }) => {
    await page.goto("/workspace/contributor");
    await expect(page.getByText(/· contributor$/)).toBeVisible();
    await page.reload();
    await expect(page).toHaveURL(/\/workspace\/contributor$/, { timeout: 20_000 });
    await expect(page.getByText(/· contributor$/)).toBeVisible();
  });

  test("role gate: contributor cannot open the buyer workspace", async ({ page }) => {
    await page.goto("/workspace/buyer");
    // ProductShell sends a non-admin back to their own workspace.
    await expect(page).toHaveURL(/\/workspace\/contributor$/, { timeout: 20_000 });
  });

  test("sign out ends the session and returns to /login", async ({ page }) => {
    await page.goto("/workspace/contributor");
    await expect(page.getByText(/· contributor$/)).toBeVisible();
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login$/, { timeout: 20_000 });
  });
});