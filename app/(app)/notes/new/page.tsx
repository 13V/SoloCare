"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Participant, ParticipantGoal, SUPPORT_CATEGORIES } from "@/lib/types-features";

function today() {
  return new Date().toISOString().split("T")[0];
}

function NewNoteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedParticipantId = searchParams.get("participant_id") || "";

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeGoals, setActiveGoals] = useState<ParticipantGoal[]>([]);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    participant_id: preselectedParticipantId,
    session_date: today(),
    session_start: "",
    session_end: "",
    support_category: "",
    what_happened: "",
    goals_worked: "",
    participant_response: "",
    follow_up: "",
  });

  useEffect(() => {
    async function loadParticipants() {
      const supabase = createClient();
      const { data } = await supabase
        .from("participants")
        .select("*")
        .eq("active", true)
        .order("first_name");
      setParticipants((data || []) as Participant[]);
    }
    loadParticipants();
  }, []);

  useEffect(() => {
    async function loadGoals() {
      if (!form.participant_id) {
        setActiveGoals([]);
        setSelectedGoalIds([]);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase
        .from("participant_goals")
        .select("id, goal_description, category, status, user_id, participant_id, target_date, notes, created_at, updated_at")
        .eq("participant_id", form.participant_id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(50);
      setActiveGoals((data || []) as ParticipantGoal[]);
      setSelectedGoalIds([]);
    }
    loadGoals();
  }, [form.participant_id]);

  function toggleGoal(goalId: string) {
    setSelectedGoalIds((prev) =>
      prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]
    );
  }

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.participant_id) {
      toast.error("Please select a participant");
      return;
    }
    if (!form.what_happened.trim()) {
      toast.error("Please describe what happened during the session");
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

      const { error } = await supabase.from("progress_notes").insert({
        user_id: user.id,
        participant_id: form.participant_id,
        session_date: form.session_date,
        session_start: form.session_start || null,
        session_end: form.session_end || null,
        support_category: form.support_category || null,
        what_happened: form.what_happened.trim(),
        goals_worked: form.goals_worked.trim() || null,
        participant_response: form.participant_response.trim() || null,
        follow_up: form.follow_up.trim() || null,
        goal_ids: selectedGoalIds.length > 0 ? selectedGoalIds : [],
      });

      if (error) throw error;

      toast.success("Progress note saved");
      router.push("/notes");
    } catch {
      toast.error("Failed to save progress note");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/notes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] font-heading">Add Progress Note</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Document your support session</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
        <p className="text-sm text-blue-800">
          <strong>NDIS requirement:</strong> Progress notes must be completed after every support session. They demonstrate you are delivering supports in line with the participant&apos;s plan.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Session Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Session Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="participant_id">Participant <span className="text-red-500">*</span></Label>
              <Select
                value={form.participant_id}
                onValueChange={(val) => handleChange("participant_id", val)}
              >
                <SelectTrigger id="participant_id">
                  <SelectValue placeholder="Select participant" />
                </SelectTrigger>
                <SelectContent>
                  {participants.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.first_name} {p.last_name || ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="session_date">Session Date <span className="text-red-500">*</span></Label>
              <Input
                id="session_date"
                type="date"
                value={form.session_date}
                onChange={(e) => handleChange("session_date", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session_start">Start Time</Label>
                <Input
                  id="session_start"
                  type="time"
                  value={form.session_start}
                  onChange={(e) => handleChange("session_start", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session_end">End Time</Label>
                <Input
                  id="session_end"
                  type="time"
                  value={form.session_end}
                  onChange={(e) => handleChange("session_end", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="support_category">Support Category</Label>
              <Select
                value={form.support_category}
                onValueChange={(val) => handleChange("support_category", val)}
              >
                <SelectTrigger id="support_category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {activeGoals.length > 0 && (
              <div className="space-y-2">
                <Label>Goals Worked on This Session</Label>
                <div className="space-y-2">
                  {activeGoals.map((goal) => (
                    <label
                      key={goal.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        selectedGoalIds.includes(goal.id)
                          ? "border-[#1E3A5F] bg-[#1E3A5F]/5"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedGoalIds.includes(goal.id)}
                        onChange={() => toggleGoal(goal.id)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#1E3A5F]"
                      />
                      <span className="text-sm text-[#0F172A] flex-1">
                        {goal.goal_description}
                        {goal.category && (
                          <span className="ml-2 text-xs text-[#64748B]">({goal.category})</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Note Content */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Note Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="what_happened">
                What Happened <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="what_happened"
                value={form.what_happened}
                onChange={(e) => handleChange("what_happened", e.target.value)}
                placeholder="Describe the support provided during this session..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goals_worked">Goals Worked Toward</Label>
              <Textarea
                id="goals_worked"
                value={form.goals_worked}
                onChange={(e) => handleChange("goals_worked", e.target.value)}
                placeholder="Which NDIS plan goals were worked on?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="participant_response">Participant Response</Label>
              <Textarea
                id="participant_response"
                value={form.participant_response}
                onChange={(e) => handleChange("participant_response", e.target.value)}
                placeholder="How did the participant respond to the support?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="follow_up">Follow-Up Required</Label>
              <Textarea
                id="follow_up"
                value={form.follow_up}
                onChange={(e) => handleChange("follow_up", e.target.value)}
                placeholder="Any follow-up actions needed?"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Saving..." : "Save Progress Note"}
        </Button>
      </form>
    </div>
  );
}

export default function NewNotePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#64748B]">Loading...</div>}>
      <NewNoteForm />
    </Suspense>
  );
}
