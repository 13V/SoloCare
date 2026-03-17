import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { INCIDENT_TYPE_LABELS } from "@/lib/types";

export default async function IncidentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: incidents } = await supabase
    .from("incidents")
    .select("*")
    .eq("user_id", user.id)
    .order("incident_date", { ascending: false });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] font-heading">Incident Log</h1>
          <p className="text-sm text-[#64748B] mt-1">
            {incidents?.length || 0} incident{incidents?.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
        <Link href="/incidents/new">
          <Button>
            <Plus className="h-4 w-4" />
            Log Incident
          </Button>
        </Link>
      </div>

      {/* NDIS reminder banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-[#D97706] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">NDIS Reporting Reminder</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Reportable incidents must be notified to the NDIS Commission within <strong>24 hours</strong> of becoming aware. Review your Incident Management Policy for the full list of reportable incidents.
            </p>
          </div>
        </div>
      </div>

      {!incidents || incidents.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-50 rounded-2xl mb-4">
            <CheckCircle className="h-7 w-7 text-[#16A34A]" />
          </div>
          <h3 className="font-semibold text-[#0F172A] text-base mb-2">No incidents recorded</h3>
          <p className="text-sm text-[#64748B] mb-2 max-w-sm mx-auto">
            That&apos;s great! When an incident does occur, log it here within the required timeframes.
          </p>
          <div className="inline-block bg-slate-50 rounded-lg px-4 py-3 mb-6 text-left">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">NDIS Reporting Timeframes</p>
            <div className="space-y-1">
              <p className="text-xs text-slate-600"><span className="font-medium text-red-600">24 hours</span> — Death, serious injury, abuse, assault</p>
              <p className="text-xs text-slate-600"><span className="font-medium text-amber-600">5 business days</span> — Unauthorised restrictive practice</p>
            </div>
          </div>
          <br />
          <Link href="/incidents/new">
            <Button>Log an Incident</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {incidents.map((incident) => (
            <Link key={incident.id} href={`/incidents/${incident.id}`} className="block">
              <Card className="border-slate-200 hover:shadow-md hover:border-[#1E3A5F]/30 transition-all cursor-pointer active:scale-[0.99]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="bg-amber-100 p-2 rounded-lg shrink-0">
                        <AlertTriangle className="h-4 w-4 text-[#D97706]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#0F172A] text-sm">
                          {INCIDENT_TYPE_LABELS[incident.incident_type as keyof typeof INCIDENT_TYPE_LABELS] || incident.incident_type}
                        </p>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          {incident.participant_first_name} · {formatDate(incident.incident_date)} at {incident.incident_time}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{incident.location}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge variant={incident.reported_to_ndis ? "valid" : "warning"} className="text-xs whitespace-nowrap">
                        {incident.reported_to_ndis ? "Reported" : "Not Reported"}
                      </Badge>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(incident.created_at)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
