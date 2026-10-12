"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Check, Info, AlertTriangle, Clock } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import { useSession } from "@/lib/api/session";
import { platformPaths, onboardingCompleteResponseSchema } from "@/lib/api/platform";

type AccountType = "buyer" | "contributor";

const accounts: {
  key: AccountType;
  label: string;
  summary: string;
  setup: string[];
  workspace: string;
}[] = [
  {
    key: "buyer",
    label: "I'm here for my company",
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
    label: "I'm here to contribute",
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
];

/**
 * Onboarding flow: choose account type, fill optional org name (buyer), then persist.
 * Once completed, redirects to the appropriate workspace.
 */
export function OnboardingFlow() {
  const { client } = useSession();

  const [selected, setSelected] = useState<AccountType | null>(null);
  const [orgName, setOrgName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = accounts.find((a) => a.key === selected) ?? null;

  const handleSubmit = async () => {
    if (!selected || (selected === "buyer" && !orgName.trim())) return;
    if (!client) {
      setError("Platform client not available. Please refresh the page.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const data = await client.post(
        onboardingCompleteResponseSchema,
        platformPaths.onboardingComplete(),
        {
          body: {
            account_type: selected,
            organization_name: selected === "buyer" ? orgName.trim() : undefined,
          },
        }
      );

      if (data.onboarding_completed && data.redirect) {
        // Force a full reload to refresh the session/user state
        window.location.href = data.redirect;
      } else {
        setError("Onboarding did not complete successfully");
        setSubmitting(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      <div className="lg:col-span-7">
        <fieldset>
          <legend className="text-eyebrow uppercase text-ink-4">
            Step 1 — choose your account type
          </legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {accounts.map((account) => {
              const isActive = selected === account.key;
              return (
                <button
                  key={account.key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => {
                    setSelected(account.key);
                    setError(null);
                  }}
                  className={cn(
                    "flex flex-col rounded-xl border p-5 text-left transition-colors",
                    isActive
                      ? "border-accent-400 bg-accent-50"
                      : "border-line bg-surface hover:border-line-strong",
                  )}
                >
                  <span className="flex items-center justify-between">
                    <span className="font-display text-title text-ink">
                      {account.label}
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
                    {account.summary}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {selected === "buyer" && (
          <div className="mt-8 rounded-xl border border-line bg-surface p-5">
            <label
              htmlFor="org-name"
              className="block font-medium text-body-sm text-ink"
            >
              Organization name <span className="text-danger-fg">*</span>
            </label>
            <input
              id="org-name"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g., Acme AI"
              className={cn(
                "mt-2 w-full rounded-lg border bg-white px-3 py-2 text-body text-ink placeholder:text-ink-4 transition-colors",
                "border-line focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100",
              )}
              maxLength={100}
              autoFocus
            />
            <p className="mt-2 text-caption text-ink-3">
              This name identifies your organization on Zeno. You can change it later
              in the buyer workspace settings.
            </p>
          </div>
        )}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2.5 rounded-lg border border-line bg-surface-muted p-4">
            <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ink-4" />
            <p className="text-caption text-ink-3">
              A person can hold multiple roles (contributor, reviewer), but never
              review their own submissions.
            </p>
          </div>
          <div className="flex items-start gap-2.5 rounded-lg border border-line bg-surface-muted p-4">
            <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ink-4" />
            <p className="text-caption text-ink-3">
              Your choice is saved to your account. You won&apos;t see this screen again.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-danger-line bg-danger-bg px-3.5 py-2.5 text-body-sm text-danger-fg">
            <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <aside className="lg:col-span-5">
        <div className="sticky top-24 rounded-2xl border border-line bg-surface p-6">
          <p className="text-eyebrow uppercase text-ink-4">
            Step 2 — setup preview
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
                disabled={submitting || (selected === "buyer" && !orgName.trim())}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  `Continue to ${active.label.toLowerCase()} workspace`
                )}
              </Button>
              <p className="mt-3 text-caption text-ink-4">
                Opens your live workspace, connected to the platform API.
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-4 font-display text-display-sm text-ink-3">
                Select an account type to see its setup.
              </h2>
              <ul className="mt-5 space-y-3 opacity-60">
                {["Your account's setup steps", "What access it grants", "The workspace that opens"].map(
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
                Continue to workspace
              </Button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}