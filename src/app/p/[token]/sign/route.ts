import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface SignBody {
  signerName: string;
  signerEmail: string | null;
  signatureType: "typed" | "drawn";
  signatureData: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const body = (await request.json().catch(() => null)) as SignBody | null;

  if (!body || !body.signerName?.trim() || !body.signatureData) {
    return NextResponse.json({ error: "Missing signature details" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: proposal, error: fetchError } = await supabase
    .from("proposals")
    .select("id, status")
    .eq("public_token", token)
    .maybeSingle();

  if (fetchError || !proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  if (!["sent", "viewed"].includes(proposal.status)) {
    return NextResponse.json(
      { error: "This proposal can no longer be signed" },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : null;
  const userAgent = request.headers.get("user-agent");

  const { error: signatureError } = await supabase.from("signatures").insert({
    proposal_id: proposal.id,
    signer_name: body.signerName.trim(),
    signer_email: body.signerEmail,
    signature_type: body.signatureType,
    signature_data: body.signatureData,
    signed_at: now,
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  if (signatureError) {
    console.error("Failed to record signature", signatureError);
    return NextResponse.json({ error: "Failed to record signature" }, { status: 500 });
  }

  await supabase
    .from("proposals")
    .update({ status: "signed", signed_at: now })
    .eq("id", proposal.id);

  await supabase
    .from("proposal_events")
    .insert({ proposal_id: proposal.id, event_type: "signed" });

  return NextResponse.json({ ok: true, signedAt: now });
}
