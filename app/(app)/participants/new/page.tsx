"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { FUNDING_TYPE_LABELS } from "@/lib/types-features";

export default function NewParticipantPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    ndis_number: "",
    date_of_birth: "",
    funding_type: "" as "self_managed" | "plan_managed" | "agency_managed" | "",
    plan_start_date: "",
    plan_end_date: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    notes: "",
  });

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name.trim()) {
      toast.error("First name is required");
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

      const { error } = await supabase.from("participants").insert({
        user_id: user.id,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim() || null,
        ndis_number: form.ndis_number.trim() || null,
        date_of_birth: form.date_of_birth || null,
        funding_type: form.funding_type || null,
        plan_start_date: form.plan_start_date || null,
        plan_end_date: form.plan_end_date || null,
        emergency_contact_name: form.emergency_contact_name.trim() || null,
        emergency_contact_phone: form.emergency_contact_phone.trim() || null,
        notes: form.notes.trim() || null,
        active: true,
      });

      if (error) throw error;

      toast.success("Participant added successfully");
      router.push("/participants");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add participant");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/participants">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] font-heading">Add Participant</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Add a new NDIS participant</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Personal Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name <span className="text-red-500">*</span></Label>
                <Input
                  id="first_name"
                  value={form.first_name}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                  placeholder="Jane"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={form.last_name}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                  placeholder="Smith"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ndis_number">NDIS Number</Label>
              <Input
                id="ndis_number"
                value={form.ndis_number}
                onChange={(e) => handleChange("ndis_number", e.target.value)}
                placeholder="43 000 000 0"
              />
              <p className="text-xs text-[#64748B]">Format: XX XXX XXX XXX</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={form.date_of_birth}
                onChange={(e) => handleChange("date_of_birth", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* NDIS Plan Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">NDIS Plan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="funding_type">Funding Type</Label>
              <Select
                value={form.funding_type}
                onValueChange={(val) => handleChange("funding_type", val)}
              >
                <SelectTrigger id="funding_type">
                  <SelectValue placeholder="Select funding type" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(FUNDING_TYPE_LABELS) as [string, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan_start_date">Plan Start Date</Label>
                <Input
                  id="plan_start_date"
                  type="date"
                  value={form.plan_start_date}
                  onChange={(e) => handleChange("plan_start_date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan_end_date">Plan End Date</Label>
                <Input
                  id="plan_end_date"
                  type="date"
                  value={form.plan_end_date}
                  onChange={(e) => handleChange("plan_end_date", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Contact Name</Label>
              <Input
                id="emergency_contact_name"
                value={form.emergency_contact_name}
                onChange={(e) => handleChange("emergency_contact_name", e.target.value)}
                placeholder="John Smith (Parent)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
              <Input
                id="emergency_contact_phone"
                type="tel"
                value={form.emergency_contact_phone}
                onChange={(e) => handleChange("emergency_contact_phone", e.target.value)}
                placeholder="0400 000 000"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Any additional notes about this participant..."
              rows={3}
            />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Adding..." : "Add Participant"}
        </Button>
      </form>
    </div>
  );
}
