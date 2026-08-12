"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentOrg } from "@/lib/auth/current-org";

export async function updateOrganization(formData: FormData) {
  const { organization } = await requireCurrentOrg();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const contact_email = String(formData.get("contact_email") ?? "").trim() || null;
  const contact_phone = String(formData.get("contact_phone") ?? "").trim() || null;
  const contact_address = String(formData.get("contact_address") ?? "").trim() || null;
  const scheduling_link = String(formData.get("scheduling_link") ?? "").trim() || null;

  if (!name) throw new Error("Company name is required");

  const { error } = await supabase
    .from("organizations")
    .update({ name, contact_email, contact_phone, contact_address, scheduling_link })
    .eq("id", organization.id);

  if (error) throw error;
  revalidatePath("/settings");
}

export async function uploadLogo(formData: FormData) {
  const { organization } = await requireCurrentOrg();
  const supabase = await createClient();

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file provided");
  }

  const ext = file.name.split(".").pop() ?? "png";
  const path = `${organization.id}/logo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("org-assets")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from("org-assets").getPublicUrl(path);
  // Cache-bust so the new logo shows immediately even though the path is stable.
  const logo_url = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("organizations")
    .update({ logo_url })
    .eq("id", organization.id);

  if (updateError) throw updateError;
  revalidatePath("/settings");
}

export async function addTeamMember(formData: FormData) {
  const { organization } = await requireCurrentOrg();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!name) throw new Error("Name is required");

  const { count } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("org_id", organization.id);

  const { error } = await supabase.from("team_members").insert({
    org_id: organization.id,
    name,
    role,
    description,
    sort_order: count ?? 0,
  });

  if (error) throw error;
  revalidatePath("/settings");
}

export async function deleteTeamMember(formData: FormData) {
  await requireCurrentOrg();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/settings");
}
