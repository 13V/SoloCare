"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface ReportingFields {
  is_reportable: boolean;
  reportable_type: "immediate" | "non_immediate" | null;
  ndis_notified_at: string | null;
  notification_due_at: string | null;
  notification_outcome: string | null;
  notification_reference: string | null;
}

interface Props {
  incidentId: string;
  incidentDate: string;
  initial: ReportingFields;
}

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return result;
}

function calcDueDate(type: "immediate" | "non_immediate", incidentDate: string): string {
  const base = new Date(incidentDate);
  if (type === "immediate") {
    base.setHours(base.getHours() + 24);
    return base.toISOString();
  }
  return addBusinessDays(base, 5).toISOString();
}

function isOverdue(dueDateStr: string | null): boolean {
  if (!dueDateStr) return false;
  return new Date(dueDateStr) < new Date();
}

export function ReportingTracker({ incidentId, incidentDate, initial }: Props) {
  const [fields, setFields] = useState<ReportingFields>(initial);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(initial.is_reportable);
  const [notifiedDateTime, setNotifiedDateTime] = useState(
    initial.ndis_notified_at ? initial.ndis_notified_at.slice(0, 16) : ""
  );

  async function save(updates: Partial<ReportingFields>) {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("incidents")
        .update(updates)
        .eq("id", incidentId);
      if (error) {
        toast.error("Failed to save");
        return;
      }
      setFields((prev) => ({ ...prev, ...updates }));
      toast.success("Saved");
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleReportable() {
    const newValue = !fields.is_reportable;
    setExpanded(newValue);
    await save({ is_reportable: newValue });
  }

  async function handleTypeChange(type: "immediate" | "non_immediate") {
    const dueAt = calcDueDate(type, incidentDate);
    await save({ reportable_type: type, notification_due_at: dueAt });
  }

  async function handleMarkNotified() {
    if (!notifiedDateTime) {
      toast.error("Please enter the date and time you notified the NDIS Commission");
      return;
    }
    await save({ ndis_notified_at: new Date(notifiedDateTime).toISOString() });
  }

  async function handleSaveOutcome() {
    await save({
      notification_outcome: fields.notification_outcome,
      notification_reference: fields.notification_reference,
    });
  }

  const overdue = isOverdue(fields.notification_due_at) && !fields.ndis_notified_at;
  const notified = !!fields.ndis_notified_at;

  return (
    <Card className={`border-slate-200 mb-4 ${overdue ? "border-red-200" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Mandatory Reporting
          </CardTitle>
          {notified && <Badge variant="valid">Notified</Badge>}
          {overdue && <Badge variant="expired">Overdue</Badge>}
          {fields.is_reportable && !notified && !overdue && (
            <Badge variant="warning">Pending notification</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleReportable}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:ring-offset-2 ${
              fields.is_reportable ? "bg-[#1E3A5F]" : "bg-slate-200"
            }`}
            aria-pressed={fields.is_reportable}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                fields.is_reportable ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <Label className="cursor-pointer" onClick={handleToggleReportable}>
            This is a reportable incident
          </Label>
        </div>

        {(fields.is_reportable || expanded) && (
          <>
            {/* Reportable type */}
            <div className="space-y-2">
              <Label>Incident type</Label>
              <Select
                value={fields.reportable_type ?? ""}
                onValueChange={(v) => handleTypeChange(v as "immediate" | "non_immediate")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reporting type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">
                    Immediate — notify within 24 hours
                  </SelectItem>
                  <SelectItem value="non_immediate">
                    Non-Immediate — notify within 5 business days
                  </SelectItem>
                </SelectContent>
              </Select>
              {fields.reportable_type === "immediate" && (
                <p className="text-xs text-red-600 font-medium">
                  Reportable incidents involving death, serious injury, abuse, or assault must be reported to the NDIS Commission within 24 hours.
                </p>
              )}
              {fields.reportable_type === "non_immediate" && (
                <p className="text-xs text-amber-600 font-medium">
                  Unauthorised restrictive practices must be reported within 5 business days.
                </p>
              )}
            </div>

            {/* Due date */}
            {fields.notification_due_at && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${overdue ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
                <Clock className="h-4 w-4 shrink-0" />
                <span>
                  Notification due:{" "}
                  <strong>
                    {new Date(fields.notification_due_at).toLocaleString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </strong>
                  {overdue && " — OVERDUE"}
                </span>
              </div>
            )}

            {/* Notified at */}
            {!notified ? (
              <div className="space-y-2">
                <Label htmlFor="notified_at">Date &amp; Time Notified</Label>
                <div className="flex gap-2">
                  <Input
                    id="notified_at"
                    type="datetime-local"
                    value={notifiedDateTime}
                    onChange={(e) => setNotifiedDateTime(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleMarkNotified}
                    disabled={saving || !notifiedDateTime}
                    size="sm"
                  >
                    Mark Notified
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  Notified on{" "}
                  <strong>
                    {new Date(fields.ndis_notified_at!).toLocaleString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </strong>
                </span>
              </div>
            )}

            {/* Reference & Outcome */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="space-y-2">
                <Label htmlFor="ref_num">Notification Reference Number</Label>
                <Input
                  id="ref_num"
                  value={fields.notification_reference ?? ""}
                  onChange={(e) =>
                    setFields((prev) => ({ ...prev, notification_reference: e.target.value }))
                  }
                  placeholder="NDIS Commission reference number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="outcome">Outcome / Notes</Label>
                <Textarea
                  id="outcome"
                  value={fields.notification_outcome ?? ""}
                  onChange={(e) =>
                    setFields((prev) => ({ ...prev, notification_outcome: e.target.value }))
                  }
                  placeholder="Record the outcome of your notification..."
                  rows={3}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveOutcome}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Reference &amp; Outcome"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
