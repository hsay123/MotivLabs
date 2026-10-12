/**
 * GET /api/tasks/{id} – get task details plus a short-lived signed media URL.
 *
 * Roles: contributor (own leased tasks), reviewer, admin.
 * `gold_answer` is never returned.
 */

import type { NextRequest } from "next/server";
import { ok, withErrorHandler } from "@/lib/api/response";
import { withCors, corsOptions } from "@/lib/api/cors";
import { HttpError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/requireRole";
import { getSupabase } from "@/lib/db/supabase";
import { getAssetObjectKey, loadTask, toTask } from "@/lib/tasks/repository";
import { createSignedMediaUrl } from "@/lib/storage";

export async function OPTIONS() {
  return corsOptions();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withCors(
    await withErrorHandler(async () => {
      const user = await requireRole(req, "contributor", "reviewer", "admin");
      const { id } = await params;

      const row = await loadTask(id);

      if (user.role === "contributor" && row.lease_owner !== user.id) {
        throw HttpError.forbidden("You do not hold a lease on this task");
      }

      const objectKey = await getAssetObjectKey(row.asset_id as string);
      const signedMediaUrl = await createSignedMediaUrl(objectKey);

      const task = toTask(row, signedMediaUrl);

      // The job title and label list are needed to annotate (a contributor
      // cannot read the job). `gold_answer` is never selected here.
      const supabase = getSupabase();
      const { data: job, error } = await supabase
        .from("jobs")
        .select("title, label_list")
        .eq("id", row.job_id as string)
        .maybeSingle();
      if (error) throw HttpError.internal(`Failed to load task job: ${error.message}`);
      if (job) {
        task.job_title = (job.title as string) ?? undefined;
        task.label_list = (job.label_list as string[]) ?? [];
      }

      return ok(task);
    }),
  );
}
