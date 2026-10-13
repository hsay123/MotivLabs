/**
 * POST /api/onboarding/complete
 * Persist the user's onboarding choice and redirect to the appropriate workspace.
 * Auth: required. Roles: all (but only works if onboarding not yet completed).
 */

import type { NextRequest } from "next/server";
import { ok, withErrorHandler } from "@/lib/api/response";
import { withCors, corsOptions } from "@/lib/api/cors";
import { readJson } from "@/lib/api/request";
import { requireUser } from "@/lib/auth/requireRole";
import { getSupabase } from "@/lib/db/supabase";
import { z } from "zod";

const OnboardingBody = z.object({
  account_type: z.enum(["buyer", "contributor"]),
  organization_name: z.string().min(1).max(100).optional(),
});

export async function OPTIONS() {
  return corsOptions();
}

export async function POST(req: NextRequest) {
  return withCors(
    await withErrorHandler(async () => {
      const user = await requireUser(req);

      if (user.onboarding_completed) {
        // Onboarding already done — return current state, don't allow re-selection.
        return ok({
          onboarding_completed: true,
          redirect: user.onboarding_account_type === "buyer"
            ? "/workspace/buyer"
            : "/workspace/contributor",
        });
      }

      const { account_type, organization_name } = OnboardingBody.parse(await readJson(req));
      const supabase = getSupabase();

      if (account_type === "buyer") {
        // Create organization for the buyer
        const baseSlug = (organization_name ?? "Organization")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 50);

        if (!baseSlug) {
          throw new Error("Organization name must contain at least one alphanumeric character");
        }

        let slug = baseSlug;
        let suffix = 1;
        while (true) {
          const { data: existing } = await supabase
            .from("organizations")
            .select("id")
            .eq("slug", slug)
            .maybeSingle();
          if (!existing) break;
          suffix += 1;
          slug = `${baseSlug}-${suffix}`;
        }

        const { data: org, error: orgError } = await supabase
          .from("organizations")
          .insert({
            name: organization_name ?? "My Organization",
            slug,
            created_by: user.id,
          })
          .select("id")
          .single();
        if (orgError) throw new Error(`Failed to create organization: ${orgError.message}`);

        // Link user to organization and update onboarding + role in a single operation
        const { error: linkError } = await supabase
          .from("organization_members")
          .insert({
            organization_id: org.id,
            user_id: user.id,
            role: "owner",
          });
        if (linkError) throw new Error(`Failed to link organization member: ${linkError.message}`);

        const { error: updateError } = await supabase
          .from("users")
          .update({
            onboarding_completed: true,
            onboarding_account_type: "buyer",
            role: "buyer",
            organization_id: org.id,
          })
          .eq("id", user.id);
        if (updateError) throw new Error(`Failed to update user onboarding: ${updateError.message}`);

        return ok({
          onboarding_completed: true,
          redirect: "/workspace/buyer",
        });
      } else {
        // Contributor path: mark onboarding complete and set role
        const { error: updateError } = await supabase
          .from("users")
          .update({
            onboarding_completed: true,
            onboarding_account_type: "contributor",
            role: "contributor",
          })
          .eq("id", user.id);
        if (updateError) throw new Error(`Failed to update user onboarding: ${updateError.message}`);

        return ok({
          onboarding_completed: true,
          redirect: "/workspace/contributor",
        });
      }
    }),
  );
}