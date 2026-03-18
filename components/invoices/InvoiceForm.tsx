"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Plus, ChevronDown } from "lucide-react";
import { SUPPORT_CATEGORIES } from "@/lib/types-features";
import { NDIS_RATES, NdisRate } from "@/lib/ndis-rates";

const CATEGORY_TO_RATES: Record<string, NdisRate[]> = {
  "Daily Activities": NDIS_RATES.filter((r) => r.supportItemNumber.startsWith("01_")),
  "Social & Community Participation": NDIS_RATES.filter((r) => r.supportItemNumber.startsWith("04_")),
  "Improved Living Arrangements": NDIS_RATES.filter((r) => r.supportItemNumber.startsWith("08_")),
  "Increased Social & Community Participation": NDIS_RATES.filter((r) => r.supportItemNumber.startsWith("09_")),
  "Finding & Keeping a Job": NDIS_RATES.filter((r) => r.supportItemNumber.startsWith("10_")),
  "Improved Health & Wellbeing": NDIS_RATES.filter((r) => r.supportItemNumber.startsWith("11_")),
  "Improved Daily Living": NDIS_RATES.filter((r) => r.supportItemNumber.startsWith("15_")),
};

function RateLookup({
  category,
  onSelectRate,
}: {
  category: string;
  onSelectRate: (rate: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const rates = CATEGORY_TO_RATES[category] ?? [];

  if (!category || rates.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-[#1E3A5F] font-medium hover:underline whitespace-nowrap"
      >
        Rate lookup
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-20 top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-3 min-w-[260px]">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">
            2024-25 NDIS Rates — {category}
          </p>
          {rates.map((rate) => (
            <div key={rate.supportItemNumber} className="mb-3 last:mb-0">
              <p className="text-xs font-medium text-[#0F172A] mb-1">{rate.description}</p>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { label: "Weekday", value: rate.weekday },
                  { label: "Eve / Night", value: rate.weekdayEvening },
                  { label: "Saturday", value: rate.saturday },
                  { label: "Sunday", value: rate.sunday },
                  { label: "Public Holiday", value: rate.publicHoliday },
                ].map(({ label, value }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => { onSelectRate(value); setOpen(false); }}
                    className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg border border-slate-100 hover:border-[#1E3A5F] hover:bg-[#1E3A5F]/5 transition-colors text-left"
                  >
                    <span className="text-[#64748B]">{label}</span>
                    <span className="font-semibold text-[#0F172A]">${value.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 text-xs text-[#64748B] hover:text-[#0F172A]"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

interface ParticipantOption {
  id: string;
  first_name: string;
  last_name: string | null;
}

interface LineItemDraft {
  localId: string;
  description: string;
  support_category: string;
  hours: string;
  rate: string;
}

interface Props {
  participants: ParticipantOption[];
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function futureDateStr(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function calcAmount(hours: string, rate: string): number {
  const h = parseFloat(hours) || 0;
  const r = parseFloat(rate) || 0;
  return Math.round(h * r * 100) / 100;
}

let localIdCounter = 0;
function newLocalId() {
  localIdCounter += 1;
  return `local-${localIdCounter}`;
}

export function InvoiceForm({ participants }: Props) {
  const router = useRouter();
  const [participantId, setParticipantId] = useState("");
  const [issueDate, setIssueDate] = useState(todayStr());
  const [dueDate, setDueDate] = useState(futureDateStr(14));
  const [notes, setNotes] = useState("");
  const [gstRegistered, setGstRegistered] = useState(false);
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([
    { localId: newLocalId(), description: "", support_category: "", hours: "", rate: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  function addRow() {
    setLineItems((prev) => [
      ...prev,
      { localId: newLocalId(), description: "", support_category: "", hours: "", rate: "" },
    ]);
  }

  function removeRow(localId: string) {
    setLineItems((prev) => prev.filter((item) => item.localId !== localId));
  }

  function updateRow(localId: string, field: keyof Omit<LineItemDraft, "localId">, value: string) {
    setLineItems((prev) =>
      prev.map((item) => (item.localId === localId ? { ...item, [field]: value } : item))
    );
  }

  const subtotal = lineItems.reduce((sum, item) => sum + calcAmount(item.hours, item.rate), 0);
  const gst = gstRegistered ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
  const total = subtotal + gst;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!participantId) {
      toast.error("Please select a participant.");
      return;
    }

    const validItems = lineItems.filter((item) => item.description.trim());
    if (validItems.length === 0) {
      toast.error("Please add at least one line item with a description.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not authenticated. Please sign in again.");
        return;
      }

      const { data: invoiceNumber, error: rpcError } = await supabase.rpc("next_invoice_number", {
        p_user_id: user.id,
      });
      if (rpcError) {
        toast.error("Could not generate invoice number.");
        return;
      }

      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          user_id: user.id,
          participant_id: participantId,
          invoice_number: invoiceNumber,
          issue_date: issueDate,
          due_date: dueDate,
          status: "draft",
          gst_registered: gstRegistered,
          notes: notes.trim() || null,
        })
        .select()
        .single();

      if (invoiceError || !invoice) {
        toast.error("Failed to create invoice.");
        return;
      }

      const itemRows = validItems.map((item, index) => ({
        invoice_id: invoice.id,
        user_id: user.id,
        sort_order: index,
        description: item.description.trim(),
        support_category: item.support_category || null,
        hours: parseFloat(item.hours) || 0,
        rate: parseFloat(item.rate) || 0,
        amount: calcAmount(item.hours, item.rate),
      }));

      const { error: itemsError } = await supabase.from("invoice_line_items").insert(itemRows);
      if (itemsError) {
        toast.error("Invoice created but line items failed to save.");
        router.push(`/invoices/${invoice.id}`);
        return;
      }

      toast.success("Invoice created successfully.");
      router.push(`/invoices/${invoice.id}`);
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Participant & Dates */}
      <Card className="border-slate-200">
        <CardContent className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#64748B] uppercase tracking-wide mb-1.5">
              Participant
            </label>
            <select
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F]"
              required
            >
              <option value="">Select a participant</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name || ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#64748B] uppercase tracking-wide mb-1.5">
                Issue Date
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748B] uppercase tracking-wide mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F]"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card className="border-slate-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#0F172A]">Line Items</h2>
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-3.5 w-3.5" />
              Add Row
            </Button>
          </div>

          <div className="space-y-3">
            {/* Header row */}
            <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_80px_80px_80px_36px] gap-2 text-xs font-medium text-[#64748B] uppercase tracking-wide px-1">
              <span>Description</span>
              <span>Category</span>
              <span>Hours</span>
              <span>Rate ($)</span>
              <span>Amount</span>
              <span />
            </div>

            {lineItems.map((item) => {
              const amount = calcAmount(item.hours, item.rate);
              return (
                <div key={item.localId} className="border border-slate-100 rounded-xl p-3 space-y-2 sm:space-y-0 sm:grid sm:grid-cols-[1fr_1fr_80px_80px_80px_36px] sm:gap-2 sm:items-center sm:border-0 sm:rounded-none sm:p-0">
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateRow(item.localId, "description", e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F] w-full"
                  />
                  <div className="space-y-1">
                    <select
                      value={item.support_category}
                      onChange={(e) => updateRow(item.localId, "support_category", e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F] w-full"
                    >
                      <option value="">No category</option>
                      {SUPPORT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <RateLookup
                      category={item.support_category}
                      onSelectRate={(rate) => updateRow(item.localId, "rate", rate.toFixed(2))}
                    />
                  </div>
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    step="0.25"
                    value={item.hours}
                    onChange={(e) => updateRow(item.localId, "hours", e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F] w-full"
                  />
                  <input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={item.rate}
                    onChange={(e) => updateRow(item.localId, "rate", e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F] w-full"
                  />
                  <div className="px-3 py-2 text-sm font-medium text-[#0F172A] bg-slate-50 rounded-lg text-right">
                    ${amount.toFixed(2)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(item.localId)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 flex items-center justify-center"
                    aria-label="Remove row"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="border-slate-200">
        <CardContent className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#64748B] uppercase tracking-wide mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional information for this invoice..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F] resize-none"
            />
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="gst-registered"
              checked={gstRegistered}
              onChange={(e) => setGstRegistered(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#1E3A5F]"
            />
            <label htmlFor="gst-registered" className="text-sm text-[#0F172A]">
              I am GST registered
              <span className="block text-xs text-[#64748B] mt-0.5">
                Note: most NDIS support services are GST-free
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card className="border-slate-200">
        <CardContent className="p-5">
          <div className="space-y-2 max-w-xs ml-auto">
            <div className="flex justify-between text-sm text-[#64748B]">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {gstRegistered ? (
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

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting} className="min-w-[140px]">
          {submitting ? "Creating..." : "Create Invoice"}
        </Button>
      </div>
    </form>
  );
}
