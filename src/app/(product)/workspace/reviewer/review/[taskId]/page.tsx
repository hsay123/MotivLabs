import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readTask } from "@/lib/api/read";
import { ReviewConsole } from "@/components/product/ReviewConsole";
import { WorkspaceHeader } from "@/components/product/WorkspaceHeader";

export const metadata: Metadata = { title: "Review" };

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const { data: task } = await readTask(taskId);
  if (!task) notFound();

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-5 text-caption text-ink-4">
        <Link href="/workspace/reviewer" className="hover:text-ink">
          Queue
        </Link>
        <span aria-hidden className="mx-2">/</span>
        <span className="font-mono">{task.id}</span>
      </nav>

      <WorkspaceHeader
        eyebrow={`${task.jobId} · review`}
        title="Evaluate submission"
        description="Compare the submitted segments against the source clip and the rubric, then record a reason-coded decision."
      />

      <ReviewConsole task={task} />
    </>
  );
}
