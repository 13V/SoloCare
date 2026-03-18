"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ParticipantBudget } from "@/lib/types-features";
import { BudgetForm } from "./BudgetForm";
import { Pencil, Trash2, Plus, TrendingUp } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Props {
  initialBudgets: ParticipantBudget[];
  participantId: string;
}

function BudgetCard({
  budget,
  onEdit,
  onDelete,
}: {
  budget: ParticipantBudget;
  onEdit: (b: ParticipantBudget) => void;
  onDelete: (id: string) => void;
}) {
  const total = budget.total_budget;
  const spent = budget.amount_spent;
  const remaining = total - spent;
  const percentUsed = total > 0 ? Math.min((spent / total) * 100, 100) : 0;
  const percentRemaining = 100 - percentUsed;
  const overspent = spent > total;
  const lowFunds = !overspent && percentRemaining < budget.warning_threshold;

  let barColor = "bg-green-500";
  if (overspent) barColor = "bg-red-500";
  else if (lowFunds) barColor = "bg-amber-400";

  return (
    <div className="p-4 rounded-lg border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm text-[#0F172A] truncate">{budget.support_category}</p>
          {(budget.plan_start_date || budget.plan_end_date) && (
            <p className="text-xs text-[#64748B] mt-0.5">
              Plan:{" "}
              {budget.plan_start_date ? formatDate(budget.plan_start_date) : "?"}
              {" – "}
              {budget.plan_end_date ? formatDate(budget.plan_end_date) : "?"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {overspent && (
            <Badge variant="warning" className="text-xs bg-red-50 text-red-700 border-red-200">
              Overspent
            </Badge>
          )}
          {lowFunds && !overspent && (
            <Badge variant="warning" className="text-xs">
              Low funds
            </Badge>
          )}
          <button
            onClick={() => onEdit(budget)}
            className="p-1.5 text-slate-400 hover:text-[#1E3A5F] transition-colors rounded hover:bg-slate-50"
            aria-label="Edit budget"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(budget.id)}
            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50"
            aria-label="Delete budget"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${percentUsed}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs">
        <div>
          <p className="text-[#64748B]">Total</p>
          <p className="font-semibold text-[#0F172A]">${total.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-[#64748B]">Spent</p>
          <p className="font-semibold text-[#0F172A]">${spent.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-[#64748B]">Remaining</p>
          <p className={`font-semibold ${overspent ? "text-red-600" : "text-[#0F172A]"}`}>
            ${remaining.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function BudgetTracker({ initialBudgets, participantId }: Props) {
  const router = useRouter();
  const [budgets, setBudgets] = useState<ParticipantBudget[]>(initialBudgets);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<ParticipantBudget | null>(null);

  function handleEdit(budget: ParticipantBudget) {
    setEditingBudget(budget);
    setShowForm(true);
  }

  function handleAdd() {
    setEditingBudget(null);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingBudget(null);
  }

  function handleSuccess(saved: ParticipantBudget) {
    setBudgets((prev) => {
      const exists = prev.find((b) => b.id === saved.id);
      if (exists) {
        return prev.map((b) => (b.id === saved.id ? saved : b));
      }
      return [...prev, saved];
    });
    setShowForm(false);
    setEditingBudget(null);
    toast.success(editingBudget ? "Budget updated." : "Budget added.");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this budget? This cannot be undone.")) return;

    const supabase = createClient();
    const { error } = await supabase.from("participant_budgets").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete budget.");
      return;
    }

    setBudgets((prev) => prev.filter((b) => b.id !== id));
    toast.success("Budget deleted.");
    router.refresh();
  }

  const existingCategories = budgets.map((b) => b.support_category);

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#64748B]" />
            NDIS Budget Tracker
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleAdd}
          >
            <Plus className="h-3 w-3" />
            Add Budget
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <div className="mb-4 p-4 rounded-lg border border-slate-200 bg-slate-50">
            <p className="text-sm font-semibold text-[#0F172A] mb-4">
              {editingBudget ? "Edit Budget" : "Add Budget"}
            </p>
            <BudgetForm
              budget={editingBudget}
              participantId={participantId}
              existingCategories={existingCategories}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        )}

        {budgets.length === 0 && !showForm ? (
          <div className="text-center py-6">
            <p className="text-sm text-[#64748B] mb-3">
              No budgets tracked yet. Add a support category to track funding.
            </p>
            <Button variant="outline" size="sm" onClick={handleAdd}>
              Add first budget
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {budgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
