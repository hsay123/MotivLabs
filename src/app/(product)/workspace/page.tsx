import type { Metadata } from "next";
import Link from "next/link";
import { workspaceOrder, workspaceRoles } from "@/lib/content/workspace";
import { previewNotice } from "@/lib/api/client";
import { WorkspaceHeader } from "@/components/product/WorkspaceHeader";
import { ArrowRight, Info } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Workspace",
  description: "Choose a Motive Labs workspace.",
};

export default function WorkspaceHome() {
  return (
    <>
      <WorkspaceHeader
        eyebrow="Workspace"
        title="Choose a workspace"
        description="Each surface is built around one job. In this build every screen runs on clearly-labelled sample records."
      />

      <ul className="grid gap-5 lg:grid-cols-3">
        {workspaceOrder.map((key) => {
          const role = workspaceRoles[key];
          return (
            <li key={key}>
              <Link
                href={role.home}
                className="group flex h-full flex-col rounded-xl border border-line bg-surface p-6 transition-colors hover:border-line-strong"
              >
                <h2 className="font-display text-display-sm text-ink">
                  {role.label}
                </h2>
                <p className="mt-3 flex-1 text-body-sm text-ink-3">{role.job}</p>
                <ul className="mt-5 space-y-1.5 border-t border-line pt-4">
                  {role.nav.map((item) => (
                    <li key={item.href} className="text-caption text-ink-4">
                      {item.label}
                    </li>
                  ))}
                </ul>
                <span className="mt-5 inline-flex items-center gap-1.5 text-body-sm font-medium text-accent-700">
                  Open {role.label.toLowerCase()} workspace
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex items-start gap-2.5 rounded-lg border border-line bg-surface p-4">
        <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ink-4" />
        <p className="measure text-caption text-ink-3">{previewNotice}</p>
      </div>
    </>
  );
}
