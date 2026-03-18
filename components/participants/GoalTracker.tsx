"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, Target, CheckCircle2, XCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ParticipantGoal, SUPPORT_CATEGORIES } from "@/lib/types-features";
import { formatDate } from "@/lib/utils";

interface Props {
  initialGoals: ParticipantGoal[];
  participantId: string;
}

const STATUS_STYLES: Record<ParticipantGoal["status"], { label: string; variant: "valid" | "expired" | "warning" | "outline" }> = {
  active: { label: "Active", variant: "warning" },
  achieved: { label: "Achieved", variant: "valid" },
  discontinued: { label: "Discontinued", variant: "outline" },
};

interface GoalFormState {
  goal_description: string;
  category: string;
  target_date: string;
  notes: string;
}

const EMPTY_FORM: GoalFormState = {
  goal_description: "",
  category: "",
  target_date: "",
  notes: "",
};

export function GoalTracker({ initialGoals, participantId }: Props) {
  const [goals, setGoals] = useState<ParticipantGoal[]>(initialGoals);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ParticipantGoal | null>(null);
  const [form, setForm] = useState<GoalFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(goal: ParticipantGoal) {
    setEditing(goal);
    setForm({
      goal_description: goal.goal_description,
      category: goal.category ?? "",
      target_date: goal.target_date ?? "",
      notes: goal.notes ?? "",
    });
    setFormOpen(true);
  }

  function handleChange(field: keyof GoalFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.goal_description.trim()) {
      toast.error("Please enter a goal description");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not logged in");
        return;
      }

      const payload = {
        user_id: user.id,
        participant_id: participantId,
        goal_description: form.goal_description.trim(),
        category: form.category || null,
        target_date: form.target_date || null,
        notes: form.notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (editing?.id) {
        const { data, error } = await supabase
          .from("participant_goals")
          .update(payload)
          .eq("id", editing.id)
          .eq("user_id", user.id)
          .select()
          .single();
        if (error || !data) { toast.error("Failed to update goal"); return; }
        setGoals((prev) => prev.map((g) => (g.id === editing.id ? data as ParticipantGoal : g)));
        toast.success("Goal updated");
      } else {
        const { data, error } = await supabase
          .from("participant_goals")
          .insert({ ...payload, status: "active" })
          .select()
          .single();
        if (error || !data) { toast.error("Failed to add goal"); return; }
        setGoals((prev) => [data as ParticipantGoal, ...prev]);
        toast.success("Goal added");
      }

      setFormOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(goalId: string, status: ParticipantGoal["status"]) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("participant_goals")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", goalId);
      if (error) { toast.error("Failed to update status"); return; }
      setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, status } : g)));
      toast.success(status === "achieved" ? "Goal marked as achieved" : "Goal discontinued");
    } catch {
      toast.error("An unexpected error occurred");
    }
  }

  const activeGoals = goals.filter((g) => g.status === "active");
  const achievedGoals = goals.filter((g) => g.status === "achieved");
  const discontinuedGoals = goals.filter((g) => g.status === "discontinued");

  return (
    <>
      <Card className="border-slate-200 mt-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-[#64748B]" />
              NDIS Goals
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={openAdd}>
              <Plus className="h-3 w-3" />
              Add Goal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-[#64748B] mb-3">No goals tracked yet</p>
              <Button variant="outline" size="sm" onClick={openAdd}>
                Add first goal
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeGoals.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Active</p>
                  {activeGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={openEdit}
                      onStatusChange={updateStatus}
                    />
                  ))}
                </div>
              )}

              {achievedGoals.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Achieved</p>
                  {achievedGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={openEdit}
                      onStatusChange={updateStatus}
                    />
                  ))}
                </div>
              )}

              {discontinuedGoals.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Discontinued</p>
                  {discontinuedGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={openEdit}
                      onStatusChange={updateStatus}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Goal" : "Add NDIS Goal"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="goal_desc">Goal Description <span className="text-red-500">*</span></Label>
              <Textarea
                id="goal_desc"
                value={form.goal_description}
                onChange={(e) => handleChange("goal_description", e.target.value)}
                placeholder="Describe the NDIS goal..."
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal_cat">Support Category</Label>
              <Select value={form.category} onValueChange={(v) => handleChange("category", v)}>
                <SelectTrigger id="goal_cat">
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {SUPPORT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_date">Target Date</Label>
              <Input
                id="target_date"
                type="date"
                value={form.target_date}
                onChange={(e) => handleChange("target_date", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal_notes">Notes (optional)</Label>
              <Textarea
                id="goal_notes"
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Additional context..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editing ? "Save Changes" : "Add Goal"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function GoalCard({
  goal,
  onEdit,
  onStatusChange,
}: {
  goal: ParticipantGoal;
  onEdit: (g: ParticipantGoal) => void;
  onStatusChange: (id: string, status: ParticipantGoal["status"]) => void;
}) {
  const s = STATUS_STYLES[goal.status];

  return (
    <div className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm text-[#0F172A] flex-1">{goal.goal_description}</p>
        <Badge variant={s.variant} className="text-xs shrink-0">{s.label}</Badge>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {goal.category && (
          <span className="text-xs bg-slate-100 text-[#64748B] px-2 py-0.5 rounded-full">
            {goal.category}
          </span>
        )}
        {goal.target_date && (
          <span className="text-xs text-[#64748B]">Target: {formatDate(goal.target_date)}</span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs px-2 text-[#64748B]"
          onClick={() => onEdit(goal)}
        >
          <Pencil className="h-3 w-3" />
          Edit
        </Button>
        {goal.status === "active" && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2 text-green-700 hover:text-green-800 hover:bg-green-50"
              onClick={() => onStatusChange(goal.id, "achieved")}
            >
              <CheckCircle2 className="h-3 w-3" />
              Mark Achieved
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2 text-slate-400 hover:text-slate-600"
              onClick={() => onStatusChange(goal.id, "discontinued")}
            >
              <XCircle className="h-3 w-3" />
              Discontinue
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
