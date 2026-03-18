"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ParticipantBudget, SUPPORT_CATEGORIES } from "@/lib/types-features";

interface Props {
  budget: ParticipantBudget | null;
  participantId: string;
  existingCategories: string[];
  onSuccess: (budget: ParticipantBudget) => void;
  onCancel: () => void;
}

export function BudgetForm({ budget, participantId, existingCategories, onSuccess, onCancel }: Props) {
  const [supportCategory, setSupportCategory] = useState(budget?.support_category || "");
  const [totalBudget, setTotalBudget] = useState(budget?.total_budget?.toString() || "");
  const [amountSpent, setAmountSpent] = useState(budget?.amount_spent?.toString() || "");
  const [planStartDate, setPlanStartDate] = useState(budget?.plan_start_date || "");
  const [planEndDate, setPlanEndDate] = useState(budget?.plan_end_date || "");
  const [warningThreshold, setWarningThreshold] = useState(
    budget?.warning_threshold?.toString() || "20"
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!supportCategory) {
      toast.error("Please select a support category.");
      return;
    }

    const total = parseFloat(totalBudget);
    if (isNaN(total) || total < 0) {
      toast.error("Please enter a valid total budget.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not authenticated.");
        return;
      }

      const upsertData = {
        user_id: user.id,
        participant_id: participantId,
        support_category: supportCategory,
        total_budget: total,
        amount_spent: parseFloat(amountSpent) || 0,
        plan_start_date: planStartDate || null,
        plan_end_date: planEndDate || null,
        warning_threshold: parseInt(warningThreshold) || 20,
      };

      let result;
      if (budget?.id) {
        const { data, error } = await supabase
          .from("participant_budgets")
          .update(upsertData)
          .eq("id", budget.id)
          .select()
          .single();
        if (error) {
          toast.error("Failed to update budget.");
          return;
        }
        result = data;
      } else {
        const { data, error } = await supabase
          .from("participant_budgets")
          .insert(upsertData)
          .select()
          .single();
        if (error) {
          toast.error("Failed to save budget.");
          return;
        }
        result = data;
      }

      onSuccess(result as ParticipantBudget);
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  const disabledCategories = existingCategories.filter(
    (cat) => cat !== budget?.support_category
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[#64748B] uppercase tracking-wide mb-1.5">
          Support Category
        </label>
        <select
          value={supportCategory}
          onChange={(e) => setSupportCategory(e.target.value)}
          disabled={!!budget?.id}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F] disabled:bg-slate-50 disabled:text-slate-400"
          required
        >
          <option value="">Select category</option>
          {SUPPORT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat} disabled={disabledCategories.includes(cat)}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#64748B] uppercase tracking-wide mb-1.5">
            Total Budget ($)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={totalBudget}
            onChange={(e) => setTotalBudget(e.target.value)}
            placeholder="0.00"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F]"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#64748B] uppercase tracking-wide mb-1.5">
            Amount Spent ($)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amountSpent}
            onChange={(e) => setAmountSpent(e.target.value)}
            placeholder="0.00"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#64748B] uppercase tracking-wide mb-1.5">
            Plan Start Date
          </label>
          <input
            type="date"
            value={planStartDate}
            onChange={(e) => setPlanStartDate(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#64748B] uppercase tracking-wide mb-1.5">
            Plan End Date
          </label>
          <input
            type="date"
            value={planEndDate}
            onChange={(e) => setPlanEndDate(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#64748B] uppercase tracking-wide mb-1.5">
          Warning Threshold (% remaining)
        </label>
        <input
          type="number"
          min="1"
          max="100"
          value={warningThreshold}
          onChange={(e) => setWarningThreshold(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F]"
        />
        <p className="text-xs text-[#64748B] mt-1">
          Show a low-funds warning when less than this percentage remains.
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : budget?.id ? "Save Changes" : "Add Budget"}
        </Button>
      </div>
    </form>
  );
}
