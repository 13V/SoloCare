import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Invoice, InvoiceLineItem, deriveInvoiceStatus } from "@/lib/types-features";
import { InvoicePDFDownload } from "./InvoicePDFDownload";
import { InvoiceStatusActions } from "@/components/invoices/InvoiceStatusActions";

function statusBadgeVariant(status: string) {
  switch (status) {
    case "draft": return "outline";
    case "sent": return "default";
    case "paid": return "valid";
    case "overdue": return "warning";
    default: return "outline";
  }
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: invoiceRaw } = await supabase
    .from("invoices")
    .select("*, participants(first_name, last_name), invoice_line_items(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!invoiceRaw) notFound();

  const invoice = invoiceRaw as Invoice & {
    invoice_line_items: InvoiceLineItem[];
    participants: { first_name: string; last_name: string | null } | null;
  };

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, abn")
    .eq("id", user.id)
    .single();

  const derived = deriveInvoiceStatus(invoice);
  const sortedItems = [...(invoice.invoice_line_items || [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const subtotal = sortedItems.reduce((sum, item) => sum + item.amount, 0);
  const gst = invoice.gst_registered ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
  const total = subtotal + gst;

  const participantName = invoice.participants
    ? `${invoice.participants.first_name}${invoice.participants.last_name ? ` ${invoice.participants.last_name}` : ""}`
    : "Unknown participant";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[#0F172A]">{invoice.invoice_number}</h1>
          <p className="text-xs text-[#64748B]">Created {formatDate(invoice.created_at)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <InvoiceStatusActions invoiceId={invoice.id} currentStatus={derived} />
          <InvoicePDFDownload
            invoice={invoice}
            businessName={profile?.business_name || "NDIS Provider"}
            abn={profile?.abn || null}
          />
        </div>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2 mb-6">
        <Badge variant={statusBadgeVariant(derived)} className="text-sm px-3 py-1 capitalize">
          {derived}
        </Badge>
      </div>

      {/* Header card */}
      <Card className="border-slate-200 bg-blue-50/30 mb-4">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="bg-blue-100 p-2.5 rounded-lg">
            <FileSpreadsheet className="h-6 w-6 text-[#1E3A5F]" />
          </div>
          <div>
            <p className="font-semibold text-[#0F172A]">{participantName}</p>
            <p className="text-sm text-[#64748B]">
              Issued {formatDate(invoice.issue_date)} · Due {formatDate(invoice.due_date)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Line items */}
      <Card className="border-slate-200 mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedItems.length === 0 ? (
            <p className="text-sm text-[#64748B]">No line items.</p>
          ) : (
            <div className="space-y-0">
              <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_64px_80px_80px] gap-2 text-xs font-medium text-[#64748B] uppercase tracking-wide pb-2 border-b border-slate-100">
                <span>Description</span>
                <span>Category</span>
                <span className="text-right">Hours</span>
                <span className="text-right">Rate</span>
                <span className="text-right">Amount</span>
              </div>
              {sortedItems.map((item) => (
                <div
                  key={item.id}
                  className="grid sm:grid-cols-[1fr_1fr_64px_80px_80px] gap-2 py-2.5 border-b border-slate-50 text-sm"
                >
                  <span className="text-[#0F172A]">{item.description}</span>
                  <span className="text-[#64748B] text-xs">{item.support_category || "-"}</span>
                  <span className="text-[#0F172A] text-right">{item.hours}</span>
                  <span className="text-[#0F172A] text-right">${item.rate.toFixed(2)}</span>
                  <span className="font-medium text-[#0F172A] text-right">${item.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          <div className="mt-4 space-y-2 max-w-xs ml-auto">
            <div className="flex justify-between text-sm text-[#64748B]">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {invoice.gst_registered ? (
              <div className="flex justify-between text-sm text-[#64748B]">
                <span>GST (10%)</span>
                <span>${gst.toFixed(2)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-sm text-[#64748B]">
                <span>GST</span>
                <span className="text-xs">GST-free</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-[#0F172A] border-t border-slate-200 pt-2">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[#0F172A] leading-relaxed whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
