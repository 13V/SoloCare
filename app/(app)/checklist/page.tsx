"use client";
import { useState, useEffect } from "react";
import { ExternalLink, CheckCircle2, Circle, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  externalLink?: { label: string; url: string };
  internalLink?: { label: string; href: string };
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "mygov_id",
    title: "Create a myGovID account",
    description: "Digital identity required for accessing all Australian government portals. Download the myGovID app and verify your identity.",
    externalLink: { label: "myGovID website", url: "https://www.mygovid.gov.au" },
  },
  {
    id: "proda",
    title: "Set up a PRODA account",
    description: "Provider Digital Access — required to access the NDIS myplace provider portal and other government services.",
    externalLink: { label: "PRODA website", url: "https://proda.humanservices.gov.au" },
  },
  {
    id: "commission_portal",
    title: "Apply through the NDIS Commission Portal",
    description: "Submit your registration application via the NDIS Commission portal using your myGovID.",
    externalLink: { label: "NDIS Commission Portal", url: "https://www.ndiscommission.gov.au/providers/registered-ndis-providers/provider-registration" },
  },
  {
    id: "key_personnel",
    title: "Prepare Key Personnel evidence",
    description: "Gather qualifications, experience documentation, and police checks for all key personnel (directors, managers, and direct support workers).",
  },
  {
    id: "worker_screening",
    title: "Complete NDIS Worker Screening Check",
    description: "State-issued screening check that is mandatory for all workers delivering NDIS supports. Apply through your state's worker screening unit.",
    externalLink: { label: "Find your state screening unit", url: "https://www.ndiscommission.gov.au/workers/worker-screening" },
  },
  {
    id: "police_check",
    title: "Obtain National Police Check",
    description: "A current National Police Check (less than 3 years old) is required for registration. Obtain through Australian Federal Police or accredited bodies.",
    externalLink: { label: "AFP Police Check", url: "https://afpnationalpolicechecks.converga.com.au" },
  },
  {
    id: "first_aid",
    title: "Complete First Aid & CPR Certificate",
    description: "A current First Aid and CPR certificate is strongly recommended for all NDIS support workers. Must be renewed every 3 years (CPR annually).",
  },
  {
    id: "insurance",
    title: "Obtain Public Liability Insurance",
    description: "A minimum of $10M public liability insurance coverage is recommended for NDIS providers. Professional indemnity insurance is also advisable.",
  },
  {
    id: "policies",
    title: "Generate your 4 NDIS Policies",
    description: "NDIS requires documented policies for Incident Management, Complaints, Risk Management, and Code of Conduct. SoloCare can generate all 4 for you.",
    internalLink: { label: "Generate policies in SoloCare", href: "/policies" },
  },
  {
    id: "incidents",
    title: "Set up your Incident Management System",
    description: "You must have a system to record, manage, and report incidents. SoloCare includes a built-in NDIS-compliant incident log.",
    internalLink: { label: "View Incident Log", href: "/incidents" },
  },
  {
    id: "self_assessment",
    title: "Complete Quality Indicator Self-Assessment",
    description: "The NDIS Commission requires a self-assessment against the NDIS Practice Standards quality indicators as part of your registration application.",
    externalLink: { label: "NDIS Commission Portal", url: "https://www.ndiscommission.gov.au/providers/registered-ndis-providers/provider-registration" },
  },
  {
    id: "submit_application",
    title: "Submit your Registration Application",
    description: "Once all steps are complete, submit your full registration application via the NDIS Commission portal. Processing typically takes 3–6 months.",
    externalLink: { label: "Submit Application", url: "https://www.ndiscommission.gov.au/providers/registered-ndis-providers/provider-registration" },
  },
];

export default function ChecklistPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("registration_checklist")
        .eq("id", user.id)
        .single();

      if (profile?.registration_checklist) {
        setChecked(profile.registration_checklist as Record<string, boolean>);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleToggle(itemId: string) {
    const newChecked = { ...checked, [itemId]: !checked[itemId] };
    setChecked(newChecked);
    setSaving(itemId);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ registration_checklist: newChecked })
        .eq("id", user.id);

      if (error) throw error;
    } catch {
      // Revert on error
      setChecked(checked);
      toast.error("Failed to save progress");
    } finally {
      setSaving(null);
    }
  }

  const completedCount = CHECKLIST_ITEMS.filter((item) => checked[item.id]).length;
  const allDone = completedCount === CHECKLIST_ITEMS.length;
  const progressPct = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A] font-heading">NDIS Registration Checklist</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Complete these 12 steps to become a registered NDIS provider
        </p>
      </div>

      {/* Progress bar */}
      <Card className="mb-6 border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[#0F172A]">
              {completedCount} of {CHECKLIST_ITEMS.length} steps complete
            </span>
            <span className="text-sm font-bold text-[#1E3A5F]">{progressPct}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-[#1E3A5F] h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* All done banner */}
      {allDone && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6 flex items-center gap-4">
          <div className="bg-green-100 rounded-full p-3 shrink-0">
            <PartyPopper className="h-6 w-6 text-[#16A34A]" />
          </div>
          <div>
            <p className="font-bold text-green-800 text-base">Registration Ready!</p>
            <p className="text-sm text-green-700 mt-0.5">
              You&apos;ve completed all 12 steps. You&apos;re ready to submit your NDIS registration application!
            </p>
          </div>
        </div>
      )}

      {/* Checklist items */}
      <div className="space-y-3">
        {CHECKLIST_ITEMS.map((item, index) => {
          const isChecked = !!checked[item.id];
          const isSaving = saving === item.id;

          return (
            <Card
              key={item.id}
              className={cn(
                "border transition-all duration-150",
                isChecked ? "border-green-200 bg-green-50/50" : "border-slate-200 bg-white"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggle(item.id)}
                    disabled={isSaving}
                    className={cn(
                      "mt-0.5 shrink-0 transition-opacity",
                      isSaving && "opacity-50"
                    )}
                    aria-label={isChecked ? `Uncheck: ${item.title}` : `Check: ${item.title}`}
                  >
                    {isChecked ? (
                      <CheckCircle2 className="h-6 w-6 text-[#16A34A]" />
                    ) : (
                      <Circle className="h-6 w-6 text-slate-300" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-[#64748B] mt-0.5 shrink-0 w-5">
                        {index + 1}.
                      </span>
                      <div className="min-w-0">
                        <p className={cn(
                          "text-sm font-semibold leading-snug",
                          isChecked ? "text-[#64748B] line-through decoration-[#64748B]/50" : "text-[#0F172A]"
                        )}>
                          {item.title}
                        </p>
                        <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                          {item.description}
                        </p>

                        {/* Links */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.internalLink && (
                            <Link
                              href={item.internalLink.href}
                              className="inline-flex items-center gap-1 text-xs font-medium text-[#EA7C3C] hover:text-[#EA7C3C]/80 transition-colors"
                            >
                              {item.internalLink.label}
                              <span className="text-[10px]">→</span>
                            </Link>
                          )}
                          {item.externalLink && (
                            <a
                              href={item.externalLink.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-[#1E3A5F] hover:text-[#1E3A5F]/70 transition-colors"
                            >
                              {item.externalLink.label}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
