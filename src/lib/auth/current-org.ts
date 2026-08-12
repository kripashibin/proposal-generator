import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Organization, Profile } from "@/lib/proposal/types";

export interface CurrentOrgContext {
  userId: string;
  userEmail: string | null;
  profile: Profile;
  organization: Organization;
}

// Fetches the signed-in user's profile + organization. Middleware already
// guarantees an authenticated user for every route under (dashboard), so a
// missing profile here means the signup trigger hasn't run yet (or failed)
// rather than an auth gap — treat it as fatal and bounce to login.
export async function requireCurrentOrg(): Promise<CurrentOrgContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/login");
  }

  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", profile.org_id)
    .single();

  if (orgError || !organization) {
    redirect("/login");
  }

  return {
    userId: user.id,
    userEmail: user.email ?? null,
    profile,
    organization,
  };
}
