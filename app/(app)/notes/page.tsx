import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, NotebookPen, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ProgressNote } from "@/lib/types-features";

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

// Group notes by month label
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

  let query = supabase
    .from("progress_notes")
    .select("*, participants(first_name, last_name)")
    .eq("user_id", user.id)
    .order("session_date", { ascending: false });

  if (participant_id) {
    query = query.eq("participant_id", participant_id);
  }

  const { data: notesData } = await query;

  const notes = (notesData || []) as ProgressNote[];
  const groups = groupByMonth(notes);

  // Resolve participant name for filtered view
  let participantName: string | null = null;
  if (participant_id && notes.length > 0 && notes[0].participants) {
    const p = notes[0].participants;
    participantName = `${p.first_name}${p.last_name ? " " + p.last_name : ""}`;
  } else if (participant_id && notes.length === 0) {
    const { data: pData } = await supabase
      .from("participants")
      .select("first_name, last_name")
      .eq("id", participant_id)
      .eq("user_id", user.id)
      .single();
    if (pData) participantName = `${pData.first_name}${pData.last_name ? " " + pData.last_name : ""}`;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] font-heading">Progress Notes</h1>
          <p className="text-sm text-[#64748B] mt-1">
            {participant_id && participantName
              ? `Showing notes for ${participantName}`
              : notes.length === 0
              ? "No notes yet"
              : `${notes.length} note${notes.length !== 1 ? "s" : ""} recorded`}
          </p>
          {participant_id && (
            <Link href="/notes" className="text-xs text-[#1E3A5F] hover:underline mt-0.5 inline-block">
              View all notes
            </Link>
          )}
        </div>
        <Link href={participant_id ? `/notes/new?participant_id=${participant_id}` : "/notes/new"}>
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
          <h3 className="font-semibold text-[#0F172A] text-base mb-2">No progress notes yet</h3>
          <p className="text-sm text-[#64748B] mb-2 max-w-sm mx-auto">
            Progress notes are an NDIS legal requirement after each support session.
          </p>
          <p className="text-xs text-[#64748B] mb-6 max-w-sm mx-auto">
            They may be audited by the NDIS Commission — keep them detailed.
          </p>
          <Link href="/notes/new">
            <Button className="bg-[#1E3A5F] hover:bg-[#2D5A8E]">Add your first note</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.label}>
              {/* Month label */}
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-widest mb-3 pl-1">
                {group.label}
              </p>

              <div className="space-y-2">
                {group.notes.map((note) => {
                  const participantName = note.participants
                    ? `${note.participants.first_name}${note.participants.last_name ? " " + note.participants.last_name : ""}`
                    : "Unknown";

                  const duration = calcDuration(note.session_start, note.session_end);
                  const timeLabel = note.session_start
                    ? note.session_start.slice(0, 5) + (note.session_end ? ` – ${note.session_end.slice(0, 5)}` : "")
                    : null;

                  const colorClass = avatarColor(participantName);

                  return (
                    <Link key={note.id} href={`/notes/${note.id}`} className="block group">
                      <div className="bg-white rounded-xl border border-slate-200 hover:border-[#1E3A5F]/40 hover:shadow-sm transition-all p-4 flex items-center gap-4">
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${colorClass}`}>
                          {initials(participantName)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-sm text-[#0F172A]">{participantName}</span>
                            {note.support_category && (
                              <span className="text-[10px] font-medium text-[#64748B] bg-slate-100 rounded-full px-2 py-0.5 hidden sm:inline">
                                {note.support_category}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[#64748B] line-clamp-1 leading-relaxed">
                            {note.what_happened}
                          </p>
                        </div>

                        {/* Right meta */}
                        <div className="shrink-0 text-right flex flex-col items-end gap-1">
                          <span className="text-xs text-[#64748B]">
                            {new Date(note.session_date + "T00:00:00").toLocaleDateString("en-AU", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                          {duration && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#1E3A5F] bg-blue-50 rounded-full px-2 py-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {duration}
                            </span>
                          )}
                        </div>

                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#1E3A5F] transition-colors shrink-0" />
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
