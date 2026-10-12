"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Check } from "@/components/ui/icons";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Authentication form (login or signup).
 *
 * There is no auth service in this build, so the form validates input
 * locally and then moves to role selection in preview mode. It never
 * claims a session was created.
 */
export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === "signup";

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const email = String(data.email ?? "").trim();
    const password = String(data.password ?? "");

    if (!EMAIL.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Passwords must be at least 8 characters.");
      return;
    }
    if (isSignup && String(data.name ?? "").trim().length < 2) {
      setError("Enter your name.");
      return;
    }

    setSubmitting(true);
    router.push("/onboarding");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-danger-line bg-danger-bg px-3.5 py-2.5 text-body-sm text-danger-fg"
        >
          {error}
        </p>
      ) : null}

      {isSignup ? (
        <TextField
          id="name"
          name="name"
          label="Full name"
          required
          autoComplete="name"
          placeholder="Ada Lovelace"
        />
      ) : null}

      <TextField
        id="email"
        name="email"
        type="email"
        label="Email"
        required
        autoComplete="email"
        placeholder="you@company.com"
      />

      <TextField
        id="password"
        name="password"
        type="password"
        label="Password"
        required
        autoComplete={isSignup ? "new-password" : "current-password"}
        hint={isSignup ? "At least 8 characters." : undefined}
        placeholder="••••••••"
      />

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" size="lg" disabled={submitting}>
          {isSignup ? "Create account" : "Sign in"}
        </Button>
        <span className="flex items-center gap-1.5 text-caption text-ink-4">
          <Check aria-hidden className="h-3.5 w-3.5 text-accent-600" />
          Validated locally, then preview
        </span>
      </div>
    </form>
  );
}
