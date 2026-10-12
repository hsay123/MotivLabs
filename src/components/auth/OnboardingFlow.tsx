"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Check, Info } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

type RoleKey = "buyer" | "contributor" | "reviewer";

const roles: {
  key: RoleKey;
  label: string;
  summary: string;
  setup: string[];
  workspace: string;
}[] = [
  {
    key: "buyer",
    label: "Buyer",
    summary:
      "Commission and fund annotation jobs, monitor quality and spend, and download versioned datasets.",
    setup: [
      "Create or join an organization",
      "Confirm lawful authority to process each dataset",
      "Define the schema, rubric, reward and deadline",
      "Fund the job before tasks become payable",
    ],
    workspace: "/workspace/buyer",
  },
  {
    key: "contributor",
    label: "Contributor",
    summary:
      "Claim scoped paid tasks, annotate in the browser, and track submissions, corrections and payouts distinctly.",
    setup: [
      "Complete your profile fields",
      "Review the payout policy and fees",
      "Pass a gold-standard qualification task",
      "See reward, effort and rubric before claiming",
    ],
    workspace: "/workspace/contributor",
  },
  {
    key: "reviewer",
    label: "Reviewer",
    summary:
      "Evaluate submissions against the rubric and record reason-coded decisions with a full audit trail.",
    setup: [
      "Qualify against reviewer gold tasks",
      "Calibrate on the active rubric version",
      "Confirm you cannot review your own work",
      "Learn the reason codes and escalation path",
    ],
    workspace: "/workspace/reviewer",
  },
];

/**
 * Role onboarding.
 *
 * Step one selects a role. Step two shows what that role's real setup
 * involves, then enters the role workspace in preview mode. Nothing here
 * creates an account or a wallet.
 */
export function OnboardingFlow() {
  const router = useRouter();
  const [selected, setSelected] = useState<RoleKey | null>(null);
  const active = roles.find((role) => role.key === selected) ?? null;

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      <div className="lg:col-span-7">
        <fieldset>
          <legend className="text-eyebrow uppercase text-ink-4">
            Step 1 — choose a role
          </legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {roles.map((role) => {
              const isActive = selected === role.key;
              return (
                <button
                  key={role.key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setSelected(role.key)}
                  className={cn(
                    "flex flex-col rounded-xl border p-5 text-left transition-colors",
                    isActive
                      ? "border-accent-400 bg-accent-50"
                      : "border-line bg-surface hover:border-line-strong",
                  )}
                >
                  <span className="flex items-center justify-between">
                    <span className="font-display text-title text-ink">
                      {role.label}
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border",
                        isActive
                          ? "border-accent-500 bg-accent-600 text-white"
                          : "border-line-strong",
                      )}
                    >
                      {isActive ? <Check className="h-3 w-3" /> : null}
                    </span>
                  </span>
                  <span className="mt-3 text-body-sm text-ink-3">
                    {role.summary}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2.5 rounded-lg border border-line bg-surface-muted p-4">
            <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ink-4" />
            <p className="text-caption text-ink-3">
              Roles are not exclusive: the same person can hold contributor and
              reviewer access, but never review their own submissions.
            </p>
          </div>
          <div className="flex items-start gap-2.5 rounded-lg border border-line bg-surface-muted p-4">
            <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ink-4" />
            <p className="text-caption text-ink-3">
              Choosing a role here is a preview of the setup flow. It does not
              grant access, create a wallet or record any agreement.
            </p>
          </div>
        </div>
      </div>

      <aside className="lg:col-span-5">
        <div className="sticky top-24 rounded-2xl border border-line bg-surface p-6">
          <p className="text-eyebrow uppercase text-ink-4">
            Step 2 — setup
          </p>

          {active ? (
            <>
              <div className="mt-4 flex items-center gap-2">
                <h2 className="font-display text-display-sm text-ink">
                  {active.label}
                </h2>
                <Badge tone="accent">Selected</Badge>
              </div>
              <ul className="mt-5 space-y-3">
                {active.setup.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check
                      aria-hidden
                      className="mt-0.5 h-4 w-4 shrink-0 text-accent-600"
                    />
                    <span className="text-body-sm text-ink-2">{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6 w-full"
                size="lg"
                onClick={() => router.push(active.workspace)}
              >
                Enter {active.label.toLowerCase()} workspace
              </Button>
              <p className="mt-3 text-caption text-ink-4">
                Opens the workspace with clearly-labelled sample data.
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-4 font-display text-display-sm text-ink-3">
                Select a role to see its setup.
              </h2>
              <ul className="mt-5 space-y-3 opacity-60">
                {["Your role's setup steps", "What access it grants", "The workspace that opens"].map(
                  (item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span
                        aria-hidden
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-4"
                      />
                      <span className="text-body-sm text-ink-4">{item}</span>
                    </li>
                  ),
                )}
              </ul>
              <Button className="mt-6 w-full" size="lg" disabled>
                Enter workspace
              </Button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
