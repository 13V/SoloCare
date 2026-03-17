import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { ProgressNote } from "@/lib/types-features";
import { NotesPDFDownload } from "./NotesPDFDownload";

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: noteData } = await supabase
    .from("progress_notes")
    .select("*, participants(first_name, last_name)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!noteData) notFound();

  const note = noteData as ProgressNote;

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, contact_name, phone")
    .eq("id", user.id)
    .single();

  const participantName = note.participants
    ? `${note.participants.first_name}${note.participants.last_name ? " " + note.participants.last_name : ""}`
    : "Unknown Participant";

  const timeRange =
    note.session_start && note.session_end
      ? `${note.session_start} – ${note.session_end}`
      : note.session_start
      ? `From ${note.session_start}`
      : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/notes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[#0F172A] font-heading truncate">
            {participantName}
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            {formatDate(note.session_date)}
            {timeRange && ` · ${timeRange}`}
            {note.support_category && ` · ${note.support_category}`}
          </p>
        </div>
        <NotesPDFDownload
          note={note}
          providerName={profile?.business_name || null}
          providerContact={profile?.phone || null}
        />
      </div>

      {/* Note Content */}
      <div className="space-y-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#64748B] uppercase tracking-wide">
              What Happened
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[#0F172A] leading-relaxed whitespace-pre-wrap">
              {note.what_happened}
            </p>
          </CardContent>
        </Card>

        {note.goals_worked && (
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#64748B] uppercase tracking-wide">
                Goals Worked Toward
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#0F172A] leading-relaxed whitespace-pre-wrap">
                {note.goals_worked}
              </p>
            </CardContent>
          </Card>
        )}

        {note.participant_response && (
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#64748B] uppercase tracking-wide">
                Participant Response
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#0F172A] leading-relaxed whitespace-pre-wrap">
                {note.participant_response}
              </p>
            </CardContent>
          </Card>
        )}

        {note.follow_up && (
          <Card className="border-slate-200 border-l-4 border-l-amber-400">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#64748B] uppercase tracking-wide">
                Follow-Up Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#0F172A] leading-relaxed whitespace-pre-wrap">
                {note.follow_up}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <div className="text-xs text-[#64748B] pt-2">
          Note recorded on {formatDate(note.created_at)}
        </div>
      </div>
    </div>
  );
}
