import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const client = new Anthropic();

const POLICY_PROMPTS: Record<string, string> = {
  incident_management: `Generate a professional, audit-ready Incident Management Policy for an NDIS registered provider.

The policy MUST comply with the NDIS Practice Standards (Support Provision Environment, Support Management) and Quality Indicators.

Include these sections:
1. Purpose
2. Scope
3. Policy Statement
4. Definitions
5. Procedures (incident identification, reporting timeframes per NDIS Commission requirements, internal escalation, documentation)
6. Reportable Incidents to NDIS Commission (list the 5 types under Section 73Z of NDIS Act)
7. Roles and Responsibilities
8. Record Keeping (minimum 7 years)
9. Review Schedule (annual)
10. Related Legislation and Standards

Return well-structured markdown only. No preamble or explanation. Use professional language. Do NOT use code blocks, ASCII diagrams, or tables — use numbered lists and bullet points only.`,

  complaints: `Generate a professional, audit-ready Complaints Handling Policy for an NDIS registered provider.

The policy MUST comply with NDIS Practice Standards and the NDIS (Complaints Management and Resolution) Rules 2018.

Include these sections:
1. Purpose
2. Scope
3. Policy Statement
4. Definitions
5. How to Make a Complaint (multiple channels)
6. Complaints Handling Procedure (acknowledgement timeframes, investigation, resolution, escalation)
7. Escalation to NDIS Commission
8. Feedback and Continuous Improvement
9. Roles and Responsibilities
10. Confidentiality and Privacy
11. Record Keeping
12. Review Schedule (annual)
13. Related Legislation

Return well-structured markdown only. No preamble. Professional language. Do NOT use code blocks, ASCII diagrams, or tables — use numbered lists and bullet points only.`,

  risk: `Generate a professional, audit-ready Risk Management Policy for an NDIS registered provider.

The policy MUST comply with NDIS Practice Standards and Quality Indicators for risk management.

Include these sections:
1. Purpose
2. Scope
3. Policy Statement
4. Risk Management Framework (identify, assess, control, monitor)
5. Risk Categories (participant safety, financial, operational, compliance, reputational)
6. Risk Assessment Procedure
7. Risk Register Requirements
8. Roles and Responsibilities
9. Continuous Improvement
10. Record Keeping
11. Review Schedule (annual)
12. Related Standards and Legislation

Return well-structured markdown only. No preamble. Professional language. Do NOT use code blocks, ASCII diagrams, or tables — use numbered lists and bullet points only.`,

  code_of_conduct: `Generate a professional, audit-ready Code of Conduct for an NDIS registered provider and their workers.

The policy MUST align with the NDIS Code of Conduct (Section 73C of the NDIS Act 2013) and all 7 obligations.

Include these sections:
1. Purpose
2. Scope
3. The 7 NDIS Code of Conduct Obligations (listed and explained)
4. Behavioural Standards (professional behaviour, boundaries, privacy, social media)
5. Conflicts of Interest
6. Gifts and Benefits
7. Reporting Obligations (misconduct, abuse, neglect)
8. Consequences for Breach
9. Acknowledgement (signature section)
10. Review Schedule (annual)
11. Related Legislation

Return well-structured markdown only. No preamble. Professional language. Do NOT use code blocks, ASCII diagrams, or tables — use numbered lists and bullet points only.`,
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { policy_type } = await request.json();

    if (!POLICY_PROMPTS[policy_type]) {
      return NextResponse.json({ error: "Invalid policy type" }, { status: 400 });
    }

    // Get user profile for personalisation
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_name, abn, state, contact_name")
      .eq("id", user.id)
      .single();

    const businessContext = `
Business Details:
- Business Name: ${profile?.business_name || "My NDIS Business"}
- ABN: ${profile?.abn || "Not provided"}
- State/Territory: ${profile?.state || "Australia"}
- Contact Person: ${profile?.contact_name || "The Provider"}
- Effective Date: ${new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: `You are an expert NDIS compliance consultant with deep knowledge of Australian disability services legislation. Generate professional, audit-ready policy documents that comply with the NDIS Practice Standards 2021 and all relevant legislation.`,
      messages: [
        {
          role: "user",
          content: `${POLICY_PROMPTS[policy_type]}\n\n${businessContext}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    // Save to database
    const { data, error } = await supabase
      .from("policies")
      .upsert(
        {
          user_id: user.id,
          policy_type,
          content: content.text,
          generated_at: new Date().toISOString(),
          last_reviewed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,policy_type" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ policy: data });
  } catch (error) {
    console.error("Policy generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate policy" },
      { status: 500 }
    );
  }
}
