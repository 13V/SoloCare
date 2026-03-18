import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, NotebookPen, Clock, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ProgressNote, Participant } from "@/lib/types-features";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function calcDuration(start?: string | null, end?: string | null): string | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

function avatarColor(name: string) {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function groupByMonth(notes: ProgressNote[]) {
  const groups: { label: string; notes: ProgressNote[] }[] = [];
  let current: { label: string; notes: ProgressNote[] } | null = null;
  for (const note of notes) {
    const d = new Date(note.session_date + "T00:00:00");
    const label = d.toLocaleDateString("en-AU", { month: "long", year: "numeric" });
    if (!current || current.label !== label) {
      current = { label, notes: [] };
      groups.push(current);
    }
    current.notes.push(note);
  }
  return groups;
}

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ participant_id?: string }>;
}) {
  const { participant_id } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Participant selected: show their notes ──────────────────────────────
  if (participant_id) {
    const [notesResult, participantResult] = await Promise.all([
      supabase
        .from("progress_notes")
        .select("*, participants(first_name, last_name)")
        .eq("user_id", user.id)
        .eq("participant_id", participant_id)
        .order("session_date", { ascending: false }),
      supabase
        .from("participants")
        .select("first_name, last_name")
        .eq("id", participant_id)
        .eq("user_id", user.id)
        .single(),
    ]);

    const notes = (notesResult.data || []) as ProgressNote[];
    const participant = participantResult.data;
    const participantName = participant
      ? `${participant.first_name}${participant.last_name ? " " + participant.last_name : ""}`
      : "Participant";
    const groups = groupByMonth(notes);

    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/notes" className="text-sm text-[#64748B] hover:text-[#1E3A5F] transition-colors">
                Notes
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-sm font-medium text-[#0F172A]">{participantName}</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] font-heading">{participantName}</h1>
            <p className="text-sm text-[#64748B] mt-0.5">
              {notes.length === 0 ? "No notes yet" : `${notes.length} note${notes.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Link href={`/notes/new?participant_id=${participant_id}`}>
            <Button className="bg-[#1E3A5F] hover:bg-[#2D5A8E] gap-2">
              <Plus className="h-4 w-4" />
              Add Note
            </Button>
          </Link>
        </div>

        {notes.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1E3A5F]/8 rounded-2xl mb-5">
              <NotebookPen className="h-8 w-8 text-[#1E3A5F]" />
            </div>
            <h3 className="font-semibold text-[#0F172A] text-base mb-2">No notes for {participantName} yet</h3>
            <p className="text-sm text-[#64748B] mb-6 max-w-sm mx-auto">
              Progress notes are an NDIS legal requirement after each support session.
            </p>
            <Link href={`/notes/new?participant_id=${participant_id}`}>
              <Button className="bg-[#1E3A5F] hover:bg-[#2D5A8E]">Add first note</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-widest mb-3 pl-1">
                  {group.label}
                </p>
                <div className="space-y-2">
                  {group.notes.map((note) => {
                    const duration = calcDuration(note.session_start, note.session_end);
                    return (
                      <Link key={note.id} href={`/notes/${note.id}`} className="block group">
                        <div className="bg-white rounded-xl border border-slate-200 hover:border-[#1E3A5F]/40 hover:shadow-sm transition-all p-4 flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs text-[#64748B]">
                                {new Date(note.session_date + "T00:00:00").toLocaleDateString("en-AU", {
                                  weekday: "short", day: "numeric", month: "short",
                                })}
                              </span>
                              {note.support_category && (
                                <span className="text-[10px] font-medium text-[#64748B] bg-slate-100 rounded-full px-2 py-0.5 hidden sm:inline">
                                  {note.support_category}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-[#0F172A] line-clamp-1 leading-relaxed font-medium">
                              {note.what_happened}
                            </p>
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            {duration && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#1E3A5F] bg-blue-50 rounded-full px-2 py-0.5">
                                <Clock className="h-2.5 w-2.5" />
                                {duration}
                              </span>
                            )}
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#1E3A5F] transition-colors" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── No participant selected: show participant picker ────────────────────
  const [participantsResult, notesCountResult] = await Promise.all([
    supabase
      .from("participants")
      .select("id, first_name, last_name, active")
      .eq("user_id", user.id)
      .eq("active", true)
      .order("first_name"),
    supabase
      .from("progress_notes")
      .select("participant_id")
      .eq("user_id", user.id),
  ]);

  const participants = (participantsResult.data || []) as Pick<Participant, "id" | "first_name" | "last_name" | "active">[];
  const allNotes = notesCountResult.data || [];

  // Count notes per participant
  const noteCountMap: Record<string, number> = {};
  for (const n of allNotes) {
    if (n.participant_id) {
      noteCountMap[n.participant_id] = (noteCountMap[n.participant_id] || 0) + 1;
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] font-heading">Progress Notes</h1>
          <p className="text-sm text-[#64748B] mt-1">Select a participant to view or add notes</p>
        </div>
      </div>

      {participants.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1E3A5F]/8 rounded-2xl mb-5">
            <Users className="h-8 w-8 text-[#1E3A5F]" />
          </div>
          <h3 className="font-semibold text-[#0F172A] text-base mb-2">No participants yet</h3>
          <p className="text-sm text-[#64748B] mb-6 max-w-sm mx-auto">
            Add a participant first, then you can write progress notes for them.
          </p>
          <Link href="/participants/new">
            <Button className="bg-[#1E3A5F] hover:bg-[#2D5A8E]">Add participant</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {participants.map((p) => {
            const name = `${p.first_name}${p.last_name ? " " + p.last_name : ""}`;
            const count = noteCountMap[p.id] || 0;
            const colorClass = avatarColor(name);
            return (
              <Link key={p.id} href={`/notes?participant_id=${p.id}`} className="block group">
                <div className="bg-white rounded-xl border border-slate-200 hover:border-[#1E3A5F]/40 hover:shadow-sm transition-all p-4 flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${colorClass}`}>
                    {initials(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#0F172A] text-sm">{name}</p>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {count === 0 ? "No notes yet" : `${count} note${count !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-7 h-7 rounded-full bg-[#1E3A5F]/8 flex items-center justify-center group-hover:bg-[#1E3A5F]/16 transition-colors">
                      <Plus className="h-3.5 w-3.5 text-[#1E3A5F]" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#1E3A5F] transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
