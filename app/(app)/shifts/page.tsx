import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Shift } from "@/lib/types-features";

function calcHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 60 * 100) / 100;
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export default async function ShiftsPage({
  searchParams,
}: {
  searchParams: Promise<{ participant_id?: string }>;
}) {
  const { participant_id } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let query = supabase
    .from("shifts")
    .select("*, participants(first_name, last_name)")
    .eq("user_id", user.id)
    .order("shift_date", { ascending: false });

  if (participant_id) {
    query = query.eq("participant_id", participant_id);
  }

  const { data: shiftsData } = await query;

  const shifts = (shiftsData || []) as Shift[];

  // Resolve participant name for filtered view
  let participantName: string | null = null;
  if (participant_id && shifts.length > 0 && shifts[0].participants) {
    const p = shifts[0].participants;
    participantName = `${p.first_name}${p.last_name ? " " + p.last_name : ""}`;
  } else if (participant_id && shifts.length === 0) {
    const { data: pData } = await supabase
      .from("participants")
      .select("first_name, last_name")
      .eq("id", participant_id)
      .eq("user_id", user.id)
      .single();
    if (pData) participantName = `${pData.first_name}${pData.last_name ? " " + pData.last_name : ""}`;
  }

  // This month summary
  const thisMonthShifts = shifts.filter((s) => isThisMonth(s.shift_date));
  const totalHours = thisMonthShifts.reduce(
    (acc, s) => acc + calcHours(s.start_time, s.end_time),
    0
  );
  const totalEarnings = thisMonthShifts
    .filter((s) => s.hourly_rate !== null)
    .reduce((acc, s) => acc + calcHours(s.start_time, s.end_time) * (s.hourly_rate || 0), 0);
  const hasEarnings = thisMonthShifts.some((s) => s.hourly_rate !== null);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] font-heading">Shift Log</h1>
          <p className="text-sm text-[#64748B] mt-1">
            {participant_id && participantName
              ? `Showing shifts for ${participantName}`
              : `${shifts.length} shift${shifts.length !== 1 ? "s" : ""} recorded`}
          </p>
          {participant_id && (
            <Link href="/shifts" className="text-xs text-[#1E3A5F] hover:underline mt-0.5 inline-block">
              View all shifts
            </Link>
          )}
        </div>
        <Link href={participant_id ? `/shifts/new?participant_id=${participant_id}` : "/shifts/new"}>
          <Button>
            <Plus className="h-4 w-4" />
            Log Shift
          </Button>
        </Link>
      </div>

      {/* This month summary */}
      {shifts.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-[#1E3A5F]" />
              <p className="text-xs text-[#64748B] font-medium uppercase tracking-wide">This Month</p>
            </div>
            <p className="text-2xl font-bold text-[#0F172A]">{Math.round(totalHours * 10) / 10}h</p>
            <p className="text-xs text-[#64748B] mt-0.5">
              {thisMonthShifts.length} shift{thisMonthShifts.length !== 1 ? "s" : ""}
            </p>
          </div>
          {hasEarnings && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-[#16A34A]" />
                <p className="text-xs text-[#64748B] font-medium uppercase tracking-wide">Earnings</p>
              </div>
              <p className="text-2xl font-bold text-[#16A34A]">${totalEarnings.toFixed(2)}</p>
              <p className="text-xs text-[#64748B] mt-0.5">This month</p>
            </div>
          )}
        </div>
      )}

      {shifts.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-100 rounded-2xl mb-4">
            <Clock className="h-7 w-7 text-[#64748B]" />
          </div>
          <h3 className="font-semibold text-[#0F172A] text-base mb-2">No shifts logged yet</h3>
          <p className="text-sm text-[#64748B] mb-6 max-w-sm mx-auto">
            Track your support hours and earnings. Log each shift to keep accurate records for invoicing and compliance.
          </p>
          <Link href="/shifts/new">
            <Button>Log your first shift</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {shifts.map((shift) => {
            const participantName = shift.participants
              ? `${shift.participants.first_name}${shift.participants.last_name ? " " + shift.participants.last_name : ""}`
              : "Unknown";
            const hours = calcHours(shift.start_time, shift.end_time);
            const earnings = shift.hourly_rate ? hours * shift.hourly_rate : null;

            return (
              <Card
                key={shift.id}
                className="border-slate-200 hover:shadow-sm transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="bg-[#1E3A5F]/10 p-2 rounded-lg shrink-0">
                        <Clock className="h-4 w-4 text-[#1E3A5F]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#0F172A] text-sm">{participantName}</p>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          {formatDate(shift.shift_date)} · {shift.start_time} – {shift.end_time}
                        </p>
                        {shift.support_category && (
                          <p className="text-xs text-slate-400 mt-0.5">{shift.support_category}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-sm font-bold text-[#0F172A]">{hours}h</span>
                      {earnings !== null && (
                        <span className="text-sm font-semibold text-[#16A34A]">
                          ${earnings.toFixed(2)}
                        </span>
                      )}
                      <Badge variant={shift.invoiced ? "valid" : "outline"} className="text-xs">
                        {shift.invoiced ? "Invoiced" : "Not invoiced"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
