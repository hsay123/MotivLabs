"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { Check, Info } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

const steps = [
  { id: "project", label: "Project" },
  { id: "rights", label: "Data rights" },
  { id: "schema", label: "Schema" },
  { id: "budget", label: "Budget" },
  { id: "review", label: "Review" },
] as const;

/**
 * Job creation wizard.
 *
 * The specification requires an explicit rights declaration and funding
 * step before tasks become payable. Because no platform API is connected
 * in this build, the final step validates the form and then states
 * plainly that the job was not created.
 */
export function NewJobWizard() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({
    title: "",
    modality: "egocentric_video",
    schemaVersion: "action-segments-v1",
    rights: "",
    budget: "",
    reward: "",
    deadline: "",
    policy: "",
  });

  const set = (key: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((prev) => ({ ...prev, [key]: event.target.value }));

  const canAdvance = () => {
    if (step === 0) return values.title.trim().length > 3;
    if (step === 1) return values.rights.trim().length > 0;
    if (step === 2) return values.schemaVersion.length > 0;
    if (step === 3) return Number(values.budget) > 0 && Number(values.reward) > 0;
    return true;
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-pending-line bg-pending-bg p-6">
        <div className="flex items-start gap-3">
          <Info aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-pending-fg" />
          <div>
            <h2 className="font-display text-title text-pending-fg">
              Job not created
            </h2>
            <p className="mt-2 max-w-xl text-body-sm text-pending-fg">
              The form was validated, but this build has no platform API
              connected, so no job was created, funded or published. Set{" "}
              <code className="font-mono">NEXT_PUBLIC_API_BASE_URL</code> to
              connect the platform and make this step real.
            </p>
            <Button
              className="mt-5"
              variant="secondary"
              onClick={() => {
                setSubmitted(false);
                setStep(0);
              }}
            >
              Edit the draft
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
      {/* Stepper */}
      <nav aria-label="Steps" className="min-w-0 lg:col-span-3">
        <ol className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
          {steps.map((item, index) => {
            const active = index === step;
            const done = index < step;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => index <= step && setStep(index)}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 whitespace-nowrap rounded-md px-3 py-2.5 text-left text-body-sm transition-colors",
                    active
                      ? "bg-accent-50 text-accent-800"
                      : done
                        ? "text-ink-2 hover:bg-surface-muted"
                        : "text-ink-4",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px]",
                      active
                        ? "border-accent-500 bg-accent-600 text-white"
                        : done
                          ? "border-success-line bg-success-bg text-success-fg"
                          : "border-line-strong",
                    )}
                  >
                    {done ? <Check className="h-3 w-3" /> : index + 1}
                  </span>
                  {item.label}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step body */}
      <div className="min-w-0 lg:col-span-9">
        <div className="rounded-xl border border-line bg-surface p-6 sm:p-8">
          {step === 0 ? (
            <div className="flex flex-col gap-5">
              <h2 className="font-display text-title text-ink">Project basics</h2>
              <TextField
                id="title"
                label="Project title"
                required
                value={values.title}
                onChange={set("title")}
                placeholder="Pick-and-place failure events"
              />
              <SelectField
                id="modality"
                label="Modality"
                value={values.modality}
                onChange={set("modality")}
                hint="Only video modalities are supported in the current schema."
              >
                <option value="egocentric_video">Egocentric video</option>
                <option value="third_person_video">Third-person video</option>
              </SelectField>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="flex flex-col gap-5">
              <h2 className="font-display text-title text-ink">Data rights</h2>
              <div className="flex items-start gap-2.5 rounded-lg border border-info-line bg-info-bg p-4">
                <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-info-fg" />
                <p className="text-caption text-info-fg">
                  You must confirm lawful authority to process this dataset and
                  to share it with authorized contributors and reviewers. This
                  declaration is required before a job can be published.
                </p>
              </div>
              <TextAreaField
                id="rights"
                label="Rights declaration"
                required
                value={values.rights}
                onChange={set("rights")}
                placeholder="Describe the source of the footage, who holds the rights, and any restrictions on its use."
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="flex flex-col gap-5">
              <h2 className="font-display text-title text-ink">
                Schema and rubric
              </h2>
              <SelectField
                id="schemaVersion"
                label="Schema"
                value={values.schemaVersion}
                onChange={set("schemaVersion")}
              >
                <option value="action-segments-v1">action-segments-v1</option>
              </SelectField>
              <div className="rounded-lg border border-line bg-canvas p-4">
                <p className="text-caption text-ink-3">
                  <span className="font-medium text-ink">Action labels:</span>{" "}
                  reach, grasp, lift, place, inspect, recover, other
                </p>
                <p className="mt-2 text-caption text-ink-3">
                  <span className="font-medium text-ink">Outcomes:</span> success,
                  partial, failure, unknown
                </p>
                <p className="mt-2 text-caption text-ink-3">
                  <span className="font-medium text-ink">Failure reasons:</span>{" "}
                  slip, collision, occlusion, wrong_target, dropped_object, other
                </p>
              </div>
              <TextAreaField
                id="policy"
                label="Acceptance policy"
                value={values.policy}
                onChange={set("policy")}
                placeholder="State the acceptance criteria, the sampling policy and the remediation window."
              />
            </div>
          ) : null}

          {step === 3 ? (
            <div className="flex flex-col gap-5">
              <h2 className="font-display text-title text-ink">
                Budget and deadline
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  id="budget"
                  type="number"
                  inputMode="numeric"
                  label="Budget (USD)"
                  required
                  value={values.budget}
                  onChange={set("budget")}
                  placeholder="4800"
                />
                <TextField
                  id="reward"
                  type="number"
                  inputMode="numeric"
                  label="Reward per task (USD)"
                  required
                  value={values.reward}
                  onChange={set("reward")}
                  placeholder="12"
                />
              </div>
              <TextField
                id="deadline"
                type="date"
                label="Deadline"
                value={values.deadline}
                onChange={set("deadline")}
              />
              <p className="text-caption text-ink-3">
                Funding is verified before tasks become payable. A funded job is
                the precondition for any settlement.
              </p>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="flex flex-col gap-5">
              <h2 className="font-display text-title text-ink">Review</h2>
              <dl className="overflow-hidden rounded-lg border border-line">
                {[
                  ["Title", values.title || "—"],
                  ["Modality", values.modality === "egocentric_video" ? "Egocentric video" : "Third-person video"],
                  ["Schema", values.schemaVersion],
                  ["Budget", values.budget ? `$${values.budget}` : "—"],
                  ["Reward / task", values.reward ? `$${values.reward}` : "—"],
                  ["Rights declared", values.rights.trim() ? "Yes" : "No"],
                ].map(([label, value], index) => (
                  <div
                    key={label}
                    className={cn(
                      "flex items-center justify-between gap-4 px-4 py-3",
                      index > 0 && "border-t border-line",
                    )}
                  >
                    <dt className="text-body-sm text-ink-3">{label}</dt>
                    <dd className="text-body-sm font-medium text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex items-center gap-2">
                <Badge tone="neutral">Draft</Badge>
                <span className="text-caption text-ink-4">
                  Publishing and funding require a connected platform API.
                </span>
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canAdvance()}
              >
                Continue
              </Button>
            ) : (
              <Button type="button" onClick={() => setSubmitted(true)}>
                Create job
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
