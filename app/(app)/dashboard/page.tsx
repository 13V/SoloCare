import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { SubscribedToast } from "./SubscribedToast";
import { FolderLock, FileText, AlertTriangle, ArrowRight, Clock, Settings, CheckCircle2, Circle, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDocumentStatus, formatDate } from "@/lib/utils";
import { POLICY_LABELS } from "@/lib/types";
import { calculateAuditScore } from "@/lib/audit-score";

const REQUIRED_DOC_TYPES = ["worker_screening", "police_check", "insurance"];
const POLICY_TYPES = ["incident_management", "complaints", "risk", "code_of_conduct"];

function ScoreRing({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score === 100 ? "#16A34A" : score >= 60 ? "#D97706" : "#DC2626";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-bold text-[#0F172A]" style={{ color }}>{score}%</span>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const getDashboardData = unstable_cache(
    async (userId: string) => {
      const [{ data: profile }, { data: documents }, { data: policies }, { data: incidents }] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", userId).single(),
          supabase.from("vault_documents").select("*").eq("user_id", userId),
          supabase.from("policies").select("id, policy_type, generated_at").eq("user_id", userId),
          supabase.from("incidents").select("id, incident_date, incident_type, participant_first_name").eq("user_id", userId).order("incident_date", { ascending: false }).limit(5),
        ]);
      return { profile, documents, policies, incidents };
    },
    ["dashboard"],
    { revalidate: 60, tags: [`dashboard-${user.id}`] }
  );

  const { profile, documents, policies, incidents } = await getDashboardData(user.id);

  if (!profile?.onboarding_complete) redirect("/onboarding");

  const auditResult = await calculateAuditScore(user.id);

  // Score calculation — 7 total checkpoints: 3 required docs + 4 policies
  const docPoints = REQUIRED_DOC_TYPES.reduce((acc, reqType) => {
    const doc = documents?.find((d) => d.document_type === reqType);
    if (!doc) return acc;
    const status = getDocumentStatus(doc.expiry_date);
    return status === "valid" || status === "expiring_soon" ? acc + 1 : acc;
  }, 0);
  const policyPoints = POLICY_TYPES.filter((pt) => policies?.find((p) => p.policy_type === pt)).length;
  const totalPoints = docPoints + policyPoints;
  const score = Math.round((totalPoints / 7) * 100);

  // Issues list
  const issues: string[] = [];
  for (const reqType of REQUIRED_DOC_TYPES) {
    const doc = documents?.find((d) => d.document_type === reqType);
    if (!doc) issues.push(`Missing: ${reqType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}`);
    else {
      const status = getDocumentStatus(doc.expiry_date);
      if (status === "expired") issues.push(`Expired: ${doc.document_name}`);
      else if (status === "expiring_soon") issues.push(`Expiring soon: ${doc.document_name}`);
    }
  }
  POLICY_TYPES.filter((pt) => !policies?.find((p) => p.policy_type === pt))
    .forEach((pt) => issues.push(`Missing policy: ${POLICY_LABELS[pt as keyof typeof POLICY_LABELS]}`));

  const auditReady = score === 100;
  const scoreColor = auditReady ? "text-green-700" : score >= 60 ? "text-amber-700" : "text-red-700";
  const scoreBg = auditReady ? "bg-green-50 border-green-200" : score >= 60 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

  // Expiring soon docs for alert strip
  const expiringSoon = documents?.filter((d) => getDocumentStatus(d.expiry_date) === "expiring_soon") || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <Suspense><SubscribedToast /></Suspense>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] font-heading">
            G&apos;day, {profile?.contact_name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">{profile?.business_name}</p>
        </div>
        <Link href="/settings">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Audit Score Widget */}
      {(() => {
        const bandStyles: Record<string, { bg: string; text: string; ringColour: string; badge: string }> = {
          green: { bg: "bg-green-50 border-green-200", text: "text-green-700", ringColour: "#16A34A", badge: "bg-green-100 text-green-700" },
          blue: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", ringColour: "#2563EB", badge: "bg-blue-100 text-blue-700" },
          amber: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", ringColour: "#D97706", badge: "bg-amber-100 text-amber-700" },
          red: { bg: "bg-red-50 border-red-200", text: "text-red-700", ringColour: "#DC2626", badge: "bg-red-100 text-red-700" },
        };
        const s = bandStyles[auditResult.bandColour];
        const radius = 28;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (auditResult.score / 100) * circumference;
        return (
          <div className={`rounded-xl border p-4 mb-4 ${s.bg}`}>
            <div className="flex items-center gap-4">
              <div className="relative inline-flex items-center justify-center shrink-0">
                <svg width="72" height="72" className="-rotate-90">
                  <circle cx="36" cy="36" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="8" />
                  <circle
                    cx="36" cy="36" r={radius} fill="none"
                    stroke={s.ringColour} strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-lg font-bold" style={{ color: s.ringColour }}>{auditResult.score}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <ClipboardCheck className={`h-4 w-4 shrink-0 ${s.text}`} />
                  <span className={`text-sm font-bold ${s.text}`}>{auditResult.band}</span>
                </div>
                <p className="text-xs text-[#64748B]">
                  {auditResult.categories.reduce((sum, c) => sum + c.earned, 0)}/
                  {auditResult.categories.reduce((sum, c) => sum + c.possible, 0)} compliance points earned
                </p>
              </div>
              <Link href="/audit" className="shrink-0">
                <Button size="sm" variant="outline" className={`text-xs border-current ${s.text}`}>
                  Full report
                </Button>
              </Link>
            </div>
          </div>
        );
      })()}

      {/* Daily quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Link href="/notes/new" className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-[#1E3A5F]/40 hover:shadow-sm transition-all group">
          <div className="bg-[#1E3A5F]/8 p-2 rounded-lg shrink-0 group-hover:bg-[#1E3A5F]/12 transition-colors">
            <FileText className="h-4 w-4 text-[#1E3A5F]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#0F172A]">Add Note</p>
            <p className="text-xs text-slate-400 truncate">Progress note</p>
          </div>
        </Link>
        <Link href="/shifts/new" className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-[#1E3A5F]/40 hover:shadow-sm transition-all group">
          <div className="bg-[#1E3A5F]/8 p-2 rounded-lg shrink-0 group-hover:bg-[#1E3A5F]/12 transition-colors">
            <Clock className="h-4 w-4 text-[#1E3A5F]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#0F172A]">Log Shift</p>
            <p className="text-xs text-slate-400 truncate">Hours &amp; earnings</p>
          </div>
        </Link>
      </div>

      {/* Expiry alert strip */}
      {expiringSoon.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
          <Clock className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{expiringSoon.length} document{expiringSoon.length > 1 ? "s" : ""}</strong> expiring soon —{" "}
            {expiringSoon.map(d => d.document_name).join(", ")}
          </p>
          <Link href="/vault" className="ml-auto shrink-0">
            <Button size="sm" variant="outline" className="text-xs border-amber-300 text-amber-700 hover:bg-amber-100">
              Review
            </Button>
          </Link>
        </div>
      )}

      {/* Audit Score Banner */}
      <div className={`rounded-xl p-5 mb-6 border ${scoreBg}`}>
        <div className="flex items-center gap-6">
          <ScoreRing score={score} />
          <div className="flex-1 min-w-0">
            <h2 className={`font-bold text-xl ${scoreColor}`}>
              {auditReady ? "Audit Ready ✓" : score >= 60 ? "Almost There" : "Action Required"}
            </h2>
            <p className={`text-sm mt-0.5 ${scoreColor} opacity-80`}>
              {totalPoints} of 7 compliance checkpoints complete
            </p>
            {issues.length > 0 && (
              <ul className="mt-2 space-y-1">
                {issues.slice(0, 4).map((issue, i) => (
                  <li key={i} className="text-sm flex items-center gap-1.5 text-slate-700">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full shrink-0" />
                    {issue}
                  </li>
                ))}
                {issues.length > 4 && (
                  <li className="text-xs text-slate-500">+{issues.length - 4} more issues</li>
                )}
              </ul>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Compliance progress</span>
            <span>{totalPoints}/7 checkpoints</span>
          </div>
          <div className="h-2 bg-white/60 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${score}%`,
                backgroundColor: auditReady ? "#16A34A" : score >= 60 ? "#D97706" : "#DC2626"
              }}
            />
          </div>
        </div>
      </div>

      {/* Compliance Cards */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {/* Vault Card */}
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-[#1E3A5F]/10 p-2 rounded-lg">
                  <FolderLock className="h-5 w-5 text-[#1E3A5F]" />
                </div>
                <CardTitle className="text-base">Compliance Vault</CardTitle>
              </div>
              <Badge variant={docPoints === 3 ? "valid" : docPoints > 0 ? "expiring" : "expired"}>
                {docPoints}/3 required
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#0F172A]">{documents?.length || 0}</p>
            <p className="text-sm text-[#64748B] mb-4">
              document{(documents?.length || 0) !== 1 ? "s" : ""} uploaded
            </p>
            <Link href="/vault">
              <Button variant="outline" size="sm" className="w-full">
                Manage Documents <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Policies Card */}
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-[#1E3A5F]/10 p-2 rounded-lg">
                  <FileText className="h-5 w-5 text-[#1E3A5F]" />
                </div>
                <CardTitle className="text-base">Policies</CardTitle>
              </div>
              <Badge variant={policyPoints === 4 ? "valid" : policyPoints > 0 ? "expiring" : "expired"}>
                {policyPoints}/4 generated
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#0F172A]">{policyPoints}</p>
            <p className="text-sm text-[#64748B] mb-4">of 4 policies generated</p>
            <Link href="/policies">
              <Button variant="outline" size="sm" className="w-full">
                {policyPoints === 0 ? "Generate Policies" : "View Policies"} <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Audit Checklist */}
      <Card className="border-slate-200 mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Before Your Audit — 5 Things to Complete</CardTitle>
            <span className="text-sm font-semibold text-[#1E3A5F]">{totalPoints}/7</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-0">
          {[
            {
              done: !!documents?.find(d => d.document_type === "worker_screening" && getDocumentStatus(d.expiry_date) !== "expired"),
              label: "Upload Worker Screening Check",
              sub: "NDIS mandatory — state-issued",
              href: "/vault/upload?type=worker_screening",
            },
            {
              done: !!documents?.find(d => d.document_type === "police_check" && getDocumentStatus(d.expiry_date) !== "expired"),
              label: "Upload National Police Check",
              sub: "Must be less than 3 years old",
              href: "/vault/upload?type=police_check",
            },
            {
              done: !!documents?.find(d => d.document_type === "insurance" && getDocumentStatus(d.expiry_date) !== "expired"),
              label: "Upload Public Liability Insurance",
              sub: "Mandatory for registered providers",
              href: "/vault/upload?type=insurance",
            },
            {
              done: policyPoints === 4,
              label: "Generate all 4 NDIS policies",
              sub: "Incident, Complaints, Risk, Code of Conduct",
              href: "/policies",
            },
            {
              done: !!profile?.abn && !!profile?.business_name && !!profile?.state,
              label: "Complete your business profile",
              sub: "ABN, business name, and state required",
              href: "/settings",
            },
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-3 py-3 ${i < 4 ? "border-b border-slate-100" : ""}`}>
              {item.done ? (
                <CheckCircle2 className="h-5 w-5 text-[#16A34A] shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-slate-300 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.done ? "text-slate-400 line-through" : "text-[#0F172A]"}`}>
                  {item.label}
                </p>
                <p className="text-xs text-slate-400">{item.sub}</p>
              </div>
              {!item.done && (
                <Link href={item.href}>
                  <button className="text-xs text-[#1E3A5F] font-medium hover:underline shrink-0">
                    Do it →
                  </button>
                </Link>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Incidents */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-amber-50 p-2 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-[#D97706]" />
              </div>
              <CardTitle className="text-base">Recent Incidents</CardTitle>
            </div>
            <Link href="/incidents/new">
              <Button size="sm">Log Incident</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {(incidents?.length || 0) === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">✓</div>
              <p className="text-[#64748B] text-sm font-medium">No incidents logged</p>
              <p className="text-xs text-slate-400 mt-1">That&apos;s a good thing!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {incidents?.map((incident) => (
                <div key={incident.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-[#0F172A]">
                      {incident.incident_type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </p>
                    <p className="text-xs text-[#64748B]">
                      {incident.participant_first_name} · {formatDate(incident.incident_date)}
                    </p>
                  </div>
                  <Link href={`/incidents/${incident.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs text-slate-400">View</Button>
                  </Link>
                </div>
              ))}
              <Link href="/incidents">
                <Button variant="link" size="sm" className="w-full mt-2 text-[#1E3A5F]">
                  View all incidents
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
