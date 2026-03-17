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
import { Participant, SUPPORT_CATEGORIES } from "@/lib/types-features";

function today() {
  return new Date().toISOString().split("T")[0];
}

function calcHours(start: string, end: string): number | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const h = ((eh * 60 + em) - (sh * 60 + sm)) / 60;
  if (h <= 0) return null;
  return Math.round(h * 100) / 100;
}

function NewShiftForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedParticipantId = searchParams.get("participant_id") || "";

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    participant_id: preselectedParticipantId,
    shift_date: today(),
    start_time: "",
    end_time: "",
    hourly_rate: "",
    support_category: "",
    notes: "",
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

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const hours = calcHours(form.start_time, form.end_time);
  const rate = parseFloat(form.hourly_rate);
  const earnings = hours !== null && !isNaN(rate) && rate > 0 ? hours * rate : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.participant_id) {
      toast.error("Please select a participant");
      return;
    }
    if (!form.start_time || !form.end_time) {
      toast.error("Please enter start and end times");
      return;
    }
    if (hours === null || hours <= 0) {
      toast.error("End time must be after start time");
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

      const { error } = await supabase.from("shifts").insert({
        user_id: user.id,
        participant_id: form.participant_id,
        shift_date: form.shift_date,
        start_time: form.start_time,
        end_time: form.end_time,
        hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
        support_category: form.support_category || null,
        notes: form.notes.trim() || null,
        invoiced: false,
      });

      if (error) throw error;

      toast.success("Shift logged successfully");
      router.push("/shifts");
    } catch (err) {
      console.error(err);
      toast.error("Failed to log shift");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/shifts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] font-heading">Log Shift</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Record your support hours</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Shift Details</CardTitle>
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
              <Label htmlFor="shift_date">Date <span className="text-red-500">*</span></Label>
              <Input
                id="shift_date"
                type="date"
                value={form.shift_date}
                onChange={(e) => handleChange("shift_date", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time <span className="text-red-500">*</span></Label>
                <Input
                  id="start_time"
                  type="time"
                  value={form.start_time}
                  onChange={(e) => handleChange("start_time", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time <span className="text-red-500">*</span></Label>
                <Input
                  id="end_time"
                  type="time"
                  value={form.end_time}
                  onChange={(e) => handleChange("end_time", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Hours/earnings preview */}
            {hours !== null && hours > 0 && (
              <div className="bg-[#1E3A5F]/5 rounded-lg p-3 border border-[#1E3A5F]/15">
                <p className="text-sm font-semibold text-[#1E3A5F]">
                  {hours} hour{hours !== 1 ? "s" : ""}
                  {earnings !== null && (
                    <span className="text-[#16A34A] ml-2">= ${earnings.toFixed(2)}</span>
                  )}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Hourly Rate (optional)</Label>
              <Input
                id="hourly_rate"
                type="number"
                min="0"
                step="0.01"
                value={form.hourly_rate}
                onChange={(e) => handleChange("hourly_rate", e.target.value)}
                placeholder="e.g. 57.96"
              />
              <p className="text-xs text-[#64748B]">NDIS support worker hourly rate</p>
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

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Any notes about this shift..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Saving..." : "Log Shift"}
        </Button>
      </form>
    </div>
  );
}

export default function NewShiftPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#64748B]">Loading...</div>}>
      <NewShiftForm />
    </Suspense>
  );
}
