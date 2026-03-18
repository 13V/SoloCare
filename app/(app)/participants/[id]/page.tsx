import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Clock, FileText, FileSignature, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Participant, ProgressNote, Shift, ParticipantBudget, FUNDING_TYPE_LABELS } from "@/lib/types-features";
import { BudgetTracker } from "@/components/participants/BudgetTracker";

function calcHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 60 * 100) / 100;
}

export default async function ParticipantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: participant } = await supabase
    .from("participants")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!participant) notFound();

  const p = participant as Participant;

  const [{ data: notesData }, { data: shiftsData }, { data: agreementData }, { data: budgetsData }] = await Promise.all([
    supabase
      .from("progress_notes")
      .select("*")
      .eq("participant_id", id)
      .eq("user_id", user.id)
      .order("session_date", { ascending: false })
      .limit(5),
    supabase
      .from("shifts")
      .select("*")
      .eq("participant_id", id)
      .eq("user_id", user.id)
      .order("shift_date", { ascending: false })
      .limit(5),
    supabase
      .from("service_agreements")
      .select("*")
      .eq("participant_id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("participant_budgets")
      .select("*")
      .eq("participant_id", id)
      .eq("user_id", user.id)
      .order("support_category", { ascending: true })
      .limit(50),
  ]);

  const notes = (notesData || []) as ProgressNote[];
  const shifts = (shiftsData || []) as Shift[];
  const budgets = (budgetsData || []) as ParticipantBudget[];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/participants">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-[#0F172A] font-heading truncate">
            {p.first_name} {p.last_name || ""}
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            {p.ndis_number ? `NDIS: ${p.ndis_number}` : "No NDIS number"}
            {p.funding_type && ` · ${FUNDING_TYPE_LABELS[p.funding_type]}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={p.active ? "valid" : "outline"}>
            {p.active ? "Active" : "Inactive"}
          </Badge>
          <Link href={`/participants/${p.id}/agreement`}>
            <Button variant="ghost" size="sm" className="h-8 text-xs text-[#64748B] gap-1.5">
              <FileSignature className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{agreementData ? "Agreement" : "Agreement"}</span>
            </Button>
          </Link>
          <Link href={`/participants/${p.id}/edit`}>
            <Button variant="ghost" size="sm" className="h-8 text-xs text-[#64748B] gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="flex gap-3 mb-6">
        <Link href={`/notes/new?participant_id=${p.id}`} className="flex-1">
          <Button className="w-full gap-2 bg-[#1E3A5F] hover:bg-[#2D5A8E] text-white">
            <Plus className="h-4 w-4" />
            Add Note
          </Button>
        </Link>
        <Link href={`/shifts/new?participant_id=${p.id}`} className="flex-1">
          <Button variant="outline" className="w-full gap-2">
            <Clock className="h-4 w-4" />
            Log Shift
          </Button>
        </Link>
      </div>

      {/* Notes + Shifts Grid */}
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        {/* Recent Progress Notes */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#64748B]" />
                Recent Progress Notes
              </CardTitle>
              <Link href={`/notes/new?participant_id=${p.id}`}>
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {notes.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-[#64748B] mb-3">No notes yet</p>
                <Link href={`/notes/new?participant_id=${p.id}`}>
                  <Button variant="outline" size="sm">Add first note</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <Link key={note.id} href={`/notes/${note.id}`} className="block">
                    <div className="p-3 rounded-lg border border-slate-100 hover:border-[#1E3A5F]/30 hover:bg-slate-50 transition-colors cursor-pointer">
                      <p className="text-xs font-medium text-[#64748B] mb-1">
                        {formatDate(note.session_date)}
                      </p>
                      <p className="text-sm text-[#0F172A] line-clamp-2">
                        {note.what_happened}
                      </p>
                    </div>
                  </Link>
                ))}
                <Link href={`/notes?participant_id=${p.id}`} className="block text-center">
                  <Button variant="ghost" size="sm" className="text-xs text-[#64748B]">
                    View all notes
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Shifts */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#64748B]" />
                Recent Shifts
              </CardTitle>
              <Link href={`/shifts/new?participant_id=${p.id}`}>
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  <Plus className="h-3 w-3" />
                  Log
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {shifts.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-[#64748B] mb-3">No shifts yet</p>
                <Link href={`/shifts/new?participant_id=${p.id}`}>
                  <Button variant="outline" size="sm">Log first shift</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {shifts.map((shift) => {
                  const hours = calcHours(shift.start_time, shift.end_time);
                  const earnings = shift.hourly_rate ? hours * shift.hourly_rate : null;
                  return (
                    <div
                      key={shift.id}
                      className="p-3 rounded-lg border border-slate-100"
                    >
                      <p className="text-xs font-medium text-[#64748B] mb-1">
                        {formatDate(shift.shift_date)}
                      </p>
                      <p className="text-sm text-[#0F172A]">
                        {shift.start_time} – {shift.end_time} · <strong>{hours}h</strong>
                      </p>
                      {earnings !== null && (
                        <p className="text-xs text-[#16A34A] font-medium mt-0.5">
                          ${earnings.toFixed(2)}
                        </p>
                      )}
                    </div>
                  );
                })}
                <Link href={`/shifts?participant_id=${p.id}`} className="block text-center">
                  <Button variant="ghost" size="sm" className="text-xs text-[#64748B]">
                    View all shifts
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Plan Details */}
      <Card className="border-slate-200 mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Plan Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              {p.plan_start_date && (
                <div>
                  <p className="text-xs text-[#64748B] uppercase tracking-wide font-medium mb-0.5">Plan Start</p>
                  <p className="text-sm text-[#0F172A]">{formatDate(p.plan_start_date)}</p>
                </div>
              )}
              {p.plan_end_date && (
                <div>
                  <p className="text-xs text-[#64748B] uppercase tracking-wide font-medium mb-0.5">Plan End</p>
                  <p className="text-sm text-[#0F172A]">{formatDate(p.plan_end_date)}</p>
                </div>
              )}
              {p.funding_type && (
                <div>
                  <p className="text-xs text-[#64748B] uppercase tracking-wide font-medium mb-0.5">Funding Type</p>
                  <p className="text-sm text-[#0F172A]">{FUNDING_TYPE_LABELS[p.funding_type]}</p>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {p.emergency_contact_name && (
                <div>
                  <p className="text-xs text-[#64748B] uppercase tracking-wide font-medium mb-0.5">Emergency Contact</p>
                  <p className="text-sm text-[#0F172A]">{p.emergency_contact_name}</p>
                </div>
              )}
              {p.emergency_contact_phone && (
                <div>
                  <p className="text-xs text-[#64748B] uppercase tracking-wide font-medium mb-0.5">Emergency Phone</p>
                  <p className="text-sm text-[#0F172A]">{p.emergency_contact_phone}</p>
                </div>
              )}
              {p.date_of_birth && (
                <div>
                  <p className="text-xs text-[#64748B] uppercase tracking-wide font-medium mb-0.5">Date of Birth</p>
                  <p className="text-sm text-[#0F172A]">{formatDate(p.date_of_birth)}</p>
                </div>
              )}
            </div>
          </div>
          {p.notes && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-[#64748B] uppercase tracking-wide font-medium mb-1">Notes</p>
              <p className="text-sm text-[#0F172A]">{p.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* NDIS Budget Tracker */}
      <BudgetTracker initialBudgets={budgets} participantId={id} />
    </div>
  );
}
