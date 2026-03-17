import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { participant_id } = await request.json();
    if (!participant_id) {
      return NextResponse.json({ error: "participant_id is required" }, { status: 400 });
    }

    // Fetch participant
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select("*")
      .eq("id", participant_id)
      .eq("user_id", user.id)
      .single();

    if (participantError || !participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    // Fetch provider profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_name, abn, state, contact_name, phone")
      .eq("id", user.id)
      .single();

    const providerDetails = `
Provider Details:
- Business Name: ${profile?.business_name || "My NDIS Business"}
- ABN: ${profile?.abn || "Not provided"}
- State/Territory: ${profile?.state || "Australia"}
- Contact Person: ${profile?.contact_name || "The Provider"}
- Phone: ${profile?.phone || "Not provided"}
`;

    const fundingTypeLabel: Record<string, string> = {
      self_managed: "Self-Managed",
      plan_managed: "Plan-Managed",
      agency_managed: "Agency-Managed (NDIA)",
    };

    const participantDetails = `
Participant Details:
- Name: ${participant.first_name}${participant.last_name ? " " + participant.last_name : ""}
- NDIS Number: ${participant.ndis_number || "Not provided"}
- Funding Type: ${participant.funding_type ? fundingTypeLabel[participant.funding_type] : "Not specified"}
- Plan Start Date: ${participant.plan_start_date || "Not specified"}
- Plan End Date: ${participant.plan_end_date || "Not specified"}
- Support Categories: ${participant.support_categories?.join(", ") || "Not specified"}
`;

    const effectiveDate = new Date().toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const userPrompt = `${providerDetails}
${participantDetails}
Effective Date: ${effectiveDate}

Generate a professional NDIS-compliant Service Agreement. Return well-structured markdown only. No preamble. No code blocks or tables. Include sections:
1. Parties
2. Services to be Provided
3. Price & Payment
4. Duration
5. Rights & Responsibilities
6. Feedback & Complaints
7. Privacy
8. Cancellation Policy
9. Signature Block`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: "You are an expert NDIS compliance consultant. Generate a professional, NDIS-compliant Service Agreement between an NDIS registered provider and a participant.",
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    // Upsert service agreement
    const { data, error } = await supabase
      .from("service_agreements")
      .upsert(
        {
          user_id: user.id,
          participant_id,
          content: content.text,
          start_date: participant.plan_start_date || null,
          end_date: participant.plan_end_date || null,
          generated_at: new Date().toISOString(),
          last_updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,participant_id" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ agreement: data });
  } catch (error) {
    console.error("Agreement generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate service agreement" },
      { status: 500 }
    );
  }
}
