import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { INCIDENT_TYPE_LABELS } from "@/lib/types";
import { IncidentPDFDownload } from "./IncidentPDFDownload";
import { ReportingTracker } from "@/components/incidents/ReportingTracker";

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: incident } = await supabase
    .from("incidents")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!incident) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, contact_name")
    .eq("id", user.id)
    .single();

  const fields = [
    { label: "Participant First Name", value: incident.participant_first_name },
    { label: "Incident Type", value: INCIDENT_TYPE_LABELS[incident.incident_type as keyof typeof INCIDENT_TYPE_LABELS] || incident.incident_type },
    { label: "Date", value: formatDate(incident.incident_date) },
    { label: "Time", value: incident.incident_time },
    { label: "Location", value: incident.location },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/incidents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#0F172A]">Incident Report</h1>
          <p className="text-xs text-[#64748B]">Logged {formatDate(incident.created_at)}</p>
        </div>
        <IncidentPDFDownload incident={incident} profile={profile} />
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 mb-6">
        <Badge variant={incident.reported_to_ndis ? "valid" : "warning"} className="text-sm px-3 py-1">
          {incident.reported_to_ndis ? "Reported to NDIS Commission ✓" : "Not Yet Reported to NDIS Commission"}
        </Badge>
        {incident.ndis_report_date && (
          <span className="text-xs text-[#64748B]">on {formatDate(incident.ndis_report_date)}</span>
        )}
      </div>

      {/* Header card */}
      <Card className="border-amber-200 bg-amber-50/30 mb-4">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="bg-amber-100 p-2.5 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-[#D97706]" />
          </div>
          <div>
            <p className="font-semibold text-[#0F172A]">
              {INCIDENT_TYPE_LABELS[incident.incident_type as keyof typeof INCIDENT_TYPE_LABELS]}
            </p>
            <p className="text-sm text-[#64748B]">
              {formatDate(incident.incident_date)} at {incident.incident_time} · {incident.location}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Fields */}
      <Card className="border-slate-200 mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Incident Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.label}>
                <p className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-1">{f.label}</p>
                <p className="text-sm text-[#0F172A]">{f.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#0F172A] leading-relaxed whitespace-pre-wrap">{incident.description}</p>
        </CardContent>
      </Card>

      <Card className="border-slate-200 mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Immediate Action Taken</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#0F172A] leading-relaxed whitespace-pre-wrap">{incident.immediate_action}</p>
        </CardContent>
      </Card>

      <ReportingTracker
        incidentId={incident.id}
        incidentDate={incident.incident_date}
        initial={{
          is_reportable: incident.is_reportable ?? false,
          reportable_type: incident.reportable_type ?? null,
          ndis_notified_at: incident.ndis_notified_at ?? null,
          notification_due_at: incident.notification_due_at ?? null,
          notification_outcome: incident.notification_outcome ?? null,
          notification_reference: incident.notification_reference ?? null,
        }}
      />
    </div>
  );
}
