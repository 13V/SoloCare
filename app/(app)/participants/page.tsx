import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Participant, FUNDING_TYPE_LABELS } from "@/lib/types-features";

function formatNDIS(ndis: string): string {
  const cleaned = ndis.replace(/\s/g, "");
  if (cleaned.length !== 9) return ndis;
  return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 9)}`;
}

function isPlanExpiringSoon(endDate: string): boolean {
  const days = (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 90;
}

export default async function ParticipantsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: participants } = await supabase
    .from("participants")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const list = (participants || []) as Participant[];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] font-heading">Participants</h1>
          <p className="text-sm text-[#64748B] mt-1">
            {list.length} participant{list.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/participants/new">
          <Button>
            <Plus className="h-4 w-4" />
            Add Participant
          </Button>
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-100 rounded-2xl mb-4">
            <Users className="h-7 w-7 text-[#64748B]" />
          </div>
          <h3 className="font-semibold text-[#0F172A] text-base mb-2">No participants added yet</h3>
          <p className="text-sm text-[#64748B] mb-6 max-w-sm mx-auto">
            Add your NDIS participants to track their progress notes, shifts, and service agreements.
          </p>
          <Link href="/participants/new">
            <Button>Add your first participant</Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {list.map((p) => (
            <Link key={p.id} href={`/participants/${p.id}`} className="block">
              <Card className="border-slate-200 hover:shadow-md hover:border-[#1E3A5F]/30 transition-all cursor-pointer active:scale-[0.99] h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#0F172A] text-base leading-tight">
                        {p.first_name} {p.last_name || ""}
                      </p>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {p.ndis_number ? `NDIS: ${formatNDIS(p.ndis_number)}` : "No NDIS number"}
                      </p>
                    </div>
                    <Badge variant={p.active ? "valid" : "outline"} className="shrink-0 text-xs">
                      {p.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {p.funding_type && (
                      <Badge variant="outline" className="text-xs text-[#1E3A5F] border-[#1E3A5F]/30">
                        {FUNDING_TYPE_LABELS[p.funding_type]}
                      </Badge>
                    )}
                    {p.plan_end_date && (
                      <Badge
                        variant={isPlanExpiringSoon(p.plan_end_date) ? "warning" : "outline"}
                        className="text-xs"
                      >
                        Plan ends: {formatDate(p.plan_end_date)}
                      </Badge>
                    )}
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
