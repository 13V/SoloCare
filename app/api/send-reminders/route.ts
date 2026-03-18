import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://solocare.com.au";

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function buildEmailHtml(name: string, businessName: string, docs: { document_name: string; daysLeft: number; expiry_date: string }[]) {
  const docRows = docs.map(d => `
    <tr>
      <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #0f172a;">${d.document_name}</td>
      <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: ${d.daysLeft <= 7 ? "#dc2626" : "#d97706"}; font-weight: 600; text-align: right;">
        ${d.daysLeft <= 0 ? "Expired" : `${d.daysLeft} day${d.daysLeft !== 1 ? "s" : ""} left`}
      </td>
    </tr>
  `).join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin: 0; padding: 0; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
    <!-- Header -->
    <tr>
      <td style="background: #1e3a5f; padding: 24px 32px;">
        <p style="margin: 0; color: #ea7c3c; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">SoloCare</p>
        <h1 style="margin: 4px 0 0; color: #ffffff; font-size: 22px; font-weight: 700;">Document Expiry Alert</h1>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding: 32px;">
        <p style="margin: 0 0 16px; color: #0f172a; font-size: 15px;">Hi ${name},</p>
        <p style="margin: 0 0 24px; color: #475569; font-size: 14px; line-height: 1.6;">
          You have <strong>${docs.length} document${docs.length > 1 ? "s" : ""}</strong> in your
          <strong>${businessName}</strong> compliance vault that need${docs.length === 1 ? "s" : ""} attention before expiry.
        </p>
        <!-- Doc Table -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
          <tr style="background: #f8fafc;">
            <td style="padding: 10px 16px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Document</td>
            <td style="padding: 10px 16px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; text-align: right;">Status</td>
          </tr>
          ${docRows}
        </table>
        <p style="margin: 0 0 24px; color: #475569; font-size: 14px; line-height: 1.6;">
          Expired documents can affect your NDIS audit readiness. Upload updated versions to stay compliant.
        </p>
        <a href="${siteUrl}/vault" style="display: inline-block; background: #1e3a5f; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">
          Update Documents →
        </a>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; border-top: 1px solid #f1f5f9; background: #f8fafc;">
        <p style="margin: 0; color: #94a3b8; font-size: 12px;">
          SoloCare · NDIS Compliance · solocare.com.au<br>
          You&apos;re receiving this because you have a SoloCare account.
          <a href="${siteUrl}/settings" style="color: #64748b;">Manage notifications</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorised calls
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  const supabase = await createClient();

  // Get all documents expiring in 7 or 30 days
  const today = new Date();
  const in7Days = new Date(today); in7Days.setDate(today.getDate() + 7);
  const in30Days = new Date(today); in30Days.setDate(today.getDate() + 30);

  const { data: expiringDocs } = await supabase
    .from("vault_documents")
    .select("*, profiles(contact_name, business_name)")
    .not("expiry_date", "is", null)
    .lte("expiry_date", in30Days.toISOString().slice(0, 10))
    .gte("expiry_date", today.toISOString().slice(0, 10));

  if (!expiringDocs || expiringDocs.length === 0) {
    return NextResponse.json({ message: "No expiring documents found", sent: 0 });
  }

  // Group by user_id
  const byUser = expiringDocs.reduce<Record<string, typeof expiringDocs>>((acc, doc) => {
    if (!acc[doc.user_id]) acc[doc.user_id] = [];
    acc[doc.user_id].push(doc);
    return acc;
  }, {});

  let sent = 0;
  const errors: string[] = [];

  for (const [userId, docs] of Object.entries(byUser)) {
    // Get user email
    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
    if (!user?.email) continue;

    const profile = (docs[0] as { profiles?: { contact_name?: string; business_name?: string } }).profiles;
    const name = profile?.contact_name?.split(" ")[0] || "there";
    const businessName = profile?.business_name || "your business";

    const docList = docs.map(d => ({
      document_name: d.document_name,
      expiry_date: d.expiry_date,
      daysLeft: getDaysUntil(d.expiry_date),
    }));

    // Only send for 7-day and 30-day milestones
    const relevant = docList.filter(d => d.daysLeft <= 30);
    if (relevant.length === 0) continue;

    const { error } = await resend.emails.send({
      from: "SoloCare <reminders@solocare.com.au>",
      to: user.email,
      subject: `⚠️ ${relevant.length} document${relevant.length > 1 ? "s" : ""} expiring soon — action required`,
      html: buildEmailHtml(name, businessName, relevant),
    });

    if (error) {
      errors.push(`${userId}: ${error.message}`);
    } else {
      sent++;
    }
  }

  return NextResponse.json({ message: "Reminders sent", sent, errors });
}
