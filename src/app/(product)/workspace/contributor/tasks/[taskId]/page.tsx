import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readActiveTask, readDraftSegments, readTask } from "@/lib/api/read";
import { AnnotationWorkspace } from "@/components/product/AnnotationWorkspace";
import { WorkspaceHeader } from "@/components/product/WorkspaceHeader";

export const metadata: Metadata = { title: "Annotation workspace" };

export default async function TaskWorkspacePage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const [{ data: task }, { data: activeTask }, { data: draft }] = await Promise.all([
    readTask(taskId),
    readActiveTask(),
    readDraftSegments(),
  ]);

  if (!task) notFound();

  // In preview mode the sample task is used for the live workspace so the
  // screen is always demonstrable; the banner states it is sample data.
  const workspaceTask = task ?? activeTask;
  const initialSegments = task.id === activeTask.id ? draft : [];

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-5 text-caption text-ink-4">
        <Link href="/workspace/contributor" className="hover:text-ink">
          Tasks
        </Link>
        <span aria-hidden className="mx-2">/</span>
        <span className="font-mono">{workspaceTask.id}</span>
      </nav>

      <WorkspaceHeader
        eyebrow={`${workspaceTask.jobId} · ${workspaceTask.difficulty}`}
        title="Annotation workspace"
        description="Label actions and failures against action-segments-v1. Segment boundaries are placed against the clip timecode."
      />

      <AnnotationWorkspace task={workspaceTask} initialSegments={initialSegments} />
    </>
  );
}
