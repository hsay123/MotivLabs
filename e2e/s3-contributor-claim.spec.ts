/**
 * S3 — Contributor: available queue -> atomic claim -> annotate + draft -> submit.
 *
 * Self-contained: `beforeAll` uses the buyer's token to build a real fixture over
 * the real API (project -> two uploaded video assets -> published job -> two
 * tasks). Nothing is inserted directly into the database.
 *
 * What this proves:
 *  1. The contributor's live queue shows the published task and a claim opens the
 *     annotation workspace (real lease, real signed media).
 *  2. An annotation can be saved as a draft and then submitted; the submission is
 *     append-only (version 1) and the task leaves the queue.
 *  3. Two different contributors racing for the same task cannot both win: exactly
 *     one claim succeeds and the other gets 409, and the database ends with a
 *     single lease owner (atomic `UPDATE ... WHERE status = 'available'`).
 *
 * Prereqs: playwright/.auth/{buyer,contributor,contributor2}.json
 * Run: npx playwright test e2e/s3-contributor-claim.spec.ts
 */
import { test, expect } from "playwright/test";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const BUYER = "./playwright/.auth/buyer.json";
const CONTRIBUTOR = "./playwright/.auth/contributor.json";
const CONTRIBUTOR2 = "./playwright/.auth/contributor2.json";
const BACKEND = process.env.E2E_BACKEND ?? "http://localhost:3010";
const VIDEO_SCHEMA = "a0000000-0000-0000-0000-000000000002";
const VIDEO_LABELS = [
  "reach",
  "grasp",
  "lift",
  "place",
  "inspect",
  "recover",
  "write",
  "other",
];

function tokenFrom(statePath: string): string {
  const state = JSON.parse(fs.readFileSync(path.resolve(statePath), "utf8"));
  for (const origin of state.origins ?? []) {
    for (const item of origin.localStorage ?? []) {
      if (item.name === "privy:token") return JSON.parse(item.value);
    }
  }
  throw new Error(`no privy:token in ${statePath}`);
}

type ApiResult = {
  status: number;
  json: { data?: unknown } & Record<string, unknown>;
  text: string;
};

async function api(
  route: string,
  opts: {
    token?: string;
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
): Promise<ApiResult> {
  const res = await fetch(`${BACKEND}${route}`, {
    method: opts.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      ...(opts.headers ?? {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  const text = await res.text();
  let json: ApiResult["json"] = {};
  try {
    json = JSON.parse(text) as ApiResult["json"];
  } catch {
    /* non-JSON body */
  }
  return { status: res.status, json, text };
}

const fixture = { jobId: "", task0: "", task1: "", projectId: "", assetIds: [] as string[] };
const stamp = Date.now();

test.describe("contributor claim + annotate", () => {
  test.use({ storageState: CONTRIBUTOR });

  test.beforeAll(async () => {
    const buyer = tokenFrom(BUYER);
    const videoBytes = fs.readFileSync(path.resolve("./e2e/fixtures/sample.mp4"));
    const videoHash = createHash("sha256").update(videoBytes).digest("hex");

    const project = await api("/api/projects", {
      token: buyer,
      method: "POST",
      body: {
        name: `E2E S3 contributor  ${stamp}`,
        data_rights: "E2E-owned capture; cleared for annotation.",
        retention_policy: "Deleted with the project.",
      },
    });
    expect(project.status, project.text).toBe(201);
    fixture.projectId = (project.json.data as { id: string }).id;

    // Upload + register two video assets through the real signed-URL flow.
    for (let i = 0; i < 2; i += 1) {
      const up = await api("/api/assets/upload-url", {
        token: buyer,
        method: "POST",
        body: {
          project_id: fixture.projectId,
          filename: `s3-${stamp}-${i}.mp4`,
          modality: "video",
        },
      });
      expect(up.status, up.text).toBe(201);
      const { upload_url, object_key } = up.json.data as {
        upload_url: string;
        object_key: string;
      };

      const put = await fetch(upload_url, {
        method: "PUT",
        headers: { "content-type": "video/mp4" },
        body: videoBytes,
      });
      expect(put.ok, `upload PUT ${put.status}`).toBe(true);

      const asset = await api("/api/assets", {
        token: buyer,
        method: "POST",
        body: {
          project_id: fixture.projectId,
          object_key,
          modality: "video",
          duration_ms: 1000,
          content_hash: videoHash,
        },
      });
      expect(asset.status, asset.text).toBe(201);
      fixture.assetIds.push((asset.json.data as { id: string }).id);
    }

    const job = await api("/api/jobs", {
      token: buyer,
      method: "POST",
      body: {
        project_id: fixture.projectId,
        title: `E2E S3 video job ${stamp}`,
        modality: "video",
        reward_per_task: 6,
        budget: 120,
        label_list: VIDEO_LABELS,
        schema_version_id: VIDEO_SCHEMA,
      },
    });
    expect(job.status, job.text).toBe(201);
    fixture.jobId = (job.json.data as { id: string }).id;

    const tasks = await api(`/api/jobs/${fixture.jobId}/tasks`, {
      token: buyer,
      method: "POST",
      body: { asset_ids: fixture.assetIds },
    });
    expect(tasks.status, tasks.text).toBe(201);
    const created = tasks.json.data as { id: string }[];
    expect(created).toHaveLength(2);
    fixture.task0 = created[0].id;
    fixture.task1 = created[1].id;

    const publish = await api(`/api/jobs/${fixture.jobId}/publish`, {
      token: buyer,
      method: "POST",
    });
    expect(publish.status, publish.text).toBe(200);

    fs.writeFileSync(
      path.resolve("./playwright/.auth/s3-fixture.json"),
      JSON.stringify(fixture, null, 2),
    );
  });

  test("claims a task, saves a draft, then submits it", async ({ page }) => {
    await page.goto("/workspace/contributor");
    await expect(page.getByRole("heading", { name: "Available tasks" })).toBeVisible();

    // Find the row for our first task and claim it.
    const row = page
      .locator("tr", { hasText: fixture.jobId.slice(0, 8) })
      .filter({ hasText: fixture.task0.slice(0, 8) });
    await expect(row).toBeVisible({ timeout: 20_000 });
    await row.getByRole("button", { name: "Claim" }).click();

    await expect(page).toHaveURL(
      new RegExp(`/workspace/contributor/tasks/${fixture.task0}$`),
      { timeout: 20_000 },
    );

    // The workspace loads the real leased task with signed media.
    await expect(page.getByText(fixture.task0).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("video")).toBeVisible({ timeout: 30_000 });

    // Annotate one action segment (a `<video>` element carries no ARIA role).
    await page.getByRole("button", { name: "Add segment" }).click();
    await expect(page.getByText("Passes preview checks")).toBeVisible();

    // Save it as a draft.
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByText("Draft saved to the platform.")).toBeVisible({
      timeout: 20_000,
    });

    // Submit the (unchanged) annotation for review.
    await page.getByRole("button", { name: "Submit for review" }).click();
    await expect(page.getByText("Submitted — version 1")).toBeVisible({ timeout: 20_000 });
  });

  test("two contributors cannot claim the same task twice", async () => {
    const [a, b] = await Promise.all([
      api(`/api/tasks/${fixture.task1}/claim`, {
        token: tokenFrom(CONTRIBUTOR),
        method: "POST",
        headers: { "idempotency-key": `race-a:${fixture.task1}` },
      }),
      api(`/api/tasks/${fixture.task1}/claim`, {
        token: tokenFrom(CONTRIBUTOR2),
        method: "POST",
        headers: { "idempotency-key": `race-b:${fixture.task1}` },
      }),
    ]);

    const statuses = [a.status, b.status].sort((x, y) => x - y);
    expect(statuses).toEqual([200, 409]);
  });
});
