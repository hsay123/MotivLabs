"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/lib/api/session";
import { workspaceRoles } from "@/lib/content/workspace";

/**
 * Workspace entry point.
 *
 * The session decides where this lands: a buyer, contributor or reviewer is
 * taken straight to their own workspace; an admin starts on the buyer surface,
 * which lists every job.
 */
export default function WorkspaceHome() {
  const router = useRouter();
  const { user } = useSession();

  useEffect(() => {
    const home =
      user.role === "admin" ? "/workspace/buyer" : workspaceRoles[user.role].home;
    router.replace(home);
  }, [router, user.role]);

  return (
    <p className="text-body text-ink-2">Opening your workspace…</p>
  );
}
