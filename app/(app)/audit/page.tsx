import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, AlertTriangle, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateAuditScore } from "@/lib/audit-score";

const BAND_STYLES = {
  green: {
    bg: "bg-green-50 border-green-200",
    text: "text-green-700",
    ring: "#16A34A",
    badge: "bg-green-100 text-green-700",
  },
  blue: {
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    ring: "#2563EB",
    badge: "bg-blue-100 text-blue-700",
  },
  amber: {
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    ring: "#D97706",
    badge: "bg-amber-100 text-amber-700",
  },
  red: {
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
    ring: "#DC2626",
    badge: "bg-red-100 text-red-700",
  },
};

function ScoreRingLarge({ score, colour }: { score: number; colour: string }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="136" height="136" className="-rotate-90">
        <circle cx="68" cy="68" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="12" />
        <circle
          cx="68"
          cy="68"
          r={radius}
          fill="none"
          stroke={colour}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-3xl font-bold" style={{ color: colour }}>{score}</span>
        <span className="block text-xs text-[#64748B] font-medium">/ 100</span>
      </div>
    </div>
  );
}

export default async function AuditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await calculateAuditScore(user.id);
  const styles = BAND_STYLES[result.bandColour];
  const totalEarned = result.categories.reduce((sum, c) => sum + c.earned, 0);
  const totalPossible = result.categories.reduce((sum, c) => sum + c.possible, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#0F172A] font-heading">Audit Readiness Report</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Your live NDIS compliance score</p>
        </div>
        <div className="bg-[#1E3A5F]/10 p-2.5 rounded-xl">
          <ClipboardCheck className="h-5 w-5 text-[#1E3A5F]" />
        </div>
      </div>

      {/* Score Banner */}
      <div className={`rounded-xl border p-6 mb-6 ${styles.bg}`}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <ScoreRingLarge score={result.score} colour={styles.ring} />
          <div className="text-center sm:text-left">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-2 ${styles.badge}`}>
              {result.band}
            </span>
            <p className={`text-lg font-bold ${styles.text}`}>
              {totalEarned} of {totalPossible} points earned
            </p>
            <p className="text-sm text-[#64748B] mt-1 max-w-xs">
              {result.score >= 90
                ? "You are well-positioned for an NDIS audit. Keep your documents and notes current."
                : result.score >= 70
                ? "Good progress. Address the outstanding items below to strengthen your compliance."
                : result.score >= 50
                ? "Several compliance areas need attention. Work through the action items below."
                : "Your compliance record requires significant attention before an audit."}
            </p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-4">
        {result.categories.map((cat) => {
          const pct = Math.round((cat.earned / cat.possible) * 100);
          const full = cat.earned === cat.possible;
          return (
            <Card key={cat.label} className="border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {full ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-300 shrink-0" />
                    )}
                    {cat.label}
                  </CardTitle>
                  <span className={`text-sm font-semibold ${full ? "text-green-600" : "text-[#64748B]"}`}>
                    {cat.earned}/{cat.possible} pts
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {/* Progress bar */}
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: full ? "#16A34A" : pct >= 50 ? "#D97706" : "#DC2626",
                    }}
                  />
                </div>

                {cat.actions.length > 0 ? (
                  <ul className="space-y-2">
                    {cat.actions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#64748B]">
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        {action}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-green-700 font-medium">All good — full points earned</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action links */}
      <div className="mt-6 bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-[#0F172A] mb-3">Quick Links</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: "Generate Policies", href: "/policies" },
            { label: "Compliance Vault", href: "/vault" },
            { label: "Log Incident", href: "/incidents/new" },
            { label: "Add Progress Note", href: "/notes/new" },
            { label: "View Participants", href: "/participants" },
            { label: "My Credentials", href: "/my-compliance" },
          ].map(({ label, href }) => (
            <Link key={href} href={href}>
              <Button variant="outline" size="sm" className="w-full text-xs">
                {label}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
