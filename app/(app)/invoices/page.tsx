import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, FileSpreadsheet, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Invoice, deriveInvoiceStatus, InvoiceStatusDerived } from "@/lib/types-features";

type StatusFilter = "all" | InvoiceStatusDerived;

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
];

function statusBadgeVariant(status: InvoiceStatusDerived) {
  switch (status) {
    case "draft": return "outline";
    case "sent": return "default";
    case "paid": return "valid";
    case "overdue": return "warning";
  }
}

function statusLabel(status: InvoiceStatusDerived) {
  switch (status) {
    case "draft": return "Draft";
    case "sent": return "Sent";
    case "paid": return "Paid";
    case "overdue": return "Overdue";
  }
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: rawStatus } = await searchParams;
  const activeFilter: StatusFilter =
    STATUS_TABS.some((t) => t.value === rawStatus) ? (rawStatus as StatusFilter) : "all";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: invoicesRaw } = await supabase
    .from("invoices")
    .select("*, participants(first_name, last_name), invoice_line_items(amount)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const invoices = (invoicesRaw || []) as Invoice[];

  const filtered = invoices.filter((inv) => {
    if (activeFilter === "all") return true;
    return deriveInvoiceStatus(inv) === activeFilter;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] font-heading">Invoices</h1>
          <p className="text-sm text-[#64748B] mt-1">
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/invoices/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === "all" ? "/invoices" : `/invoices?status=${tab.value}`}
          >
            <button
              className={
                activeFilter === tab.value
                  ? "px-3 py-1.5 rounded-md text-sm font-medium bg-white text-[#0F172A] shadow-sm"
                  : "px-3 py-1.5 rounded-md text-sm font-medium text-[#64748B] hover:text-[#0F172A]"
              }
            >
              {tab.label}
            </button>
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-50 rounded-2xl mb-4">
            <FileSpreadsheet className="h-7 w-7 text-[#64748B]" />
          </div>
          <h3 className="font-semibold text-[#0F172A] text-base mb-2">No invoices yet</h3>
          <p className="text-sm text-[#64748B] mb-6 max-w-sm mx-auto">
            Create your first invoice to start billing participants for NDIS support services.
          </p>
          <Link href="/invoices/new">
            <Button>Create Invoice</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((invoice) => {
            const derived = deriveInvoiceStatus(invoice);
            const total = (invoice.invoice_line_items || []).reduce(
              (sum, item) => sum + (item.amount || 0),
              0
            );
            const participantName = invoice.participants
              ? `${invoice.participants.first_name}${invoice.participants.last_name ? ` ${invoice.participants.last_name}` : ""}`
              : "Unknown participant";

            return (
              <Link key={invoice.id} href={`/invoices/${invoice.id}`} className="block">
                <Card className="border-slate-200 hover:shadow-md hover:border-[#1E3A5F]/30 transition-all cursor-pointer active:scale-[0.99]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="bg-blue-50 p-2 rounded-lg shrink-0">
                          <FileSpreadsheet className="h-4 w-4 text-[#1E3A5F]" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0F172A] text-sm">
                            {invoice.invoice_number}
                          </p>
                          <p className="text-xs text-[#64748B] mt-0.5">
                            {participantName}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Issued {formatDate(invoice.issue_date)} · Due {formatDate(invoice.due_date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Badge variant={statusBadgeVariant(derived)} className="text-xs whitespace-nowrap">
                          {statusLabel(derived)}
                        </Badge>
                        <span className="text-sm font-semibold text-[#0F172A]">
                          ${total.toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(invoice.created_at)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
