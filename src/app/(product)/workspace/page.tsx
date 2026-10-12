"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/lib/api/session";
import { workspaceRoles } from "@/lib/content/workspace";

/**
 * Workspace entry point.
 *
 * The session decides where this lands: each role is taken straight to its own
 * workspace — an admin to the user-administration surface.
 */
export default function WorkspaceHome() {
  const router = useRouter();
  const { user } = useSession();

  useEffect(() => {
    router.replace(workspaceRoles[user.role].home);
  }, [router, user.role]);

  return (
    <p className="text-body text-ink-2">Opening your workspace…</p>
  );
}
