"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { INCIDENT_TYPE_LABELS } from "@/lib/types";

const INCIDENT_TYPES = Object.entries(INCIDENT_TYPE_LABELS).filter(([k]) => k !== "neglect");

export function IncidentForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reportedToNdis, setReportedToNdis] = useState(false);
  const [form, setForm] = useState({
    participant_first_name: "",
    incident_date: "",
    incident_time: "",
    location: "",
    incident_type: "",
    description: "",
    immediate_action: "",
    ndis_report_date: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const required = ["participant_first_name", "incident_date", "incident_time", "location", "incident_type", "description", "immediate_action"];
    for (const field of required) {
      if (!form[field as keyof typeof form]?.trim()) {
        toast.error(`Please fill in: ${field.replace(/_/g, " ")}`);
        return;
      }
    }

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data, error } = await supabase.from("incidents").insert({
      user_id: user.id,
      ...form,
      reported_to_ndis: reportedToNdis,
      ndis_report_date: reportedToNdis && form.ndis_report_date ? form.ndis_report_date : null,
    }).select().single();

    if (error) {
      toast.error("Failed to save incident: " + error.message);
      setLoading(false);
      return;
    }

    toast.success("Incident logged successfully");
    router.push(`/incidents/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Privacy note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <strong>Privacy:</strong> Only use the participant&apos;s first name to protect their privacy in accordance with the Privacy Act 1988.
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="participant_first_name">Participant First Name *</Label>
          <Input
            id="participant_first_name"
            placeholder="e.g. John"
            value={form.participant_first_name}
            onChange={(e) => update("participant_first_name", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="incident_type">Incident Type *</Label>
          <Select value={form.incident_type} onValueChange={(v) => update("incident_type", v)}>
            <SelectTrigger id="incident_type">
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              {INCIDENT_TYPES.map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="incident_date">Date of Incident *</Label>
          <Input
            id="incident_date"
            type="date"
            value={form.incident_date}
            onChange={(e) => update("incident_date", e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="incident_time">Time of Incident *</Label>
          <Input
            id="incident_time"
            type="time"
            value={form.incident_time}
            onChange={(e) => update("incident_time", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location *</Label>
        <Input
          id="location"
          placeholder="e.g. 12 Smith St, Adelaide SA / Community"
          value={form.location}
          onChange={(e) => update("location", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description of Incident *</Label>
        <Textarea
          id="description"
          placeholder="Describe what happened in detail. Include any relevant observations, actions by the participant, and the sequence of events."
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          className="min-h-[120px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="immediate_action">Immediate Action Taken *</Label>
        <Textarea
          id="immediate_action"
          placeholder="Describe the immediate actions taken to address the incident, support the participant, and ensure safety."
          value={form.immediate_action}
          onChange={(e) => update("immediate_action", e.target.value)}
          className="min-h-[100px]"
        />
      </div>

      {/* NDIS Reporting */}
      <div className="border border-slate-200 rounded-xl p-4 space-y-3">
        <h3 className="font-semibold text-[#0F172A] text-sm">NDIS Commission Reporting</h3>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="reported_to_ndis"
            checked={reportedToNdis}
            onChange={(e) => setReportedToNdis(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[#1E3A5F] focus:ring-[#1E3A5F]"
          />
          <Label htmlFor="reported_to_ndis" className="font-normal cursor-pointer">
            This incident has been reported to the NDIS Commission
          </Label>
        </div>
        {reportedToNdis && (
          <div className="space-y-2 pt-2">
            <Label htmlFor="ndis_report_date">Date Reported to NDIS Commission</Label>
            <Input
              id="ndis_report_date"
              type="date"
              value={form.ndis_report_date}
              onChange={(e) => update("ndis_report_date", e.target.value)}
            />
          </div>
        )}
        {!reportedToNdis && (
          <p className="text-xs text-[#64748B]">
            Reminder: Some incidents must be reported to the NDIS Commission within 24 hours. Check your Incident Management Policy for reporting requirements.
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "Saving Incident..." : "Save Incident Report"}
      </Button>
    </form>
  );
}
