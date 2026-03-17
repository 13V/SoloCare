"use client";
import { useState } from "react";
import { CheckCircle, Sparkles, FileText, FolderLock, Bell } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const features = [
  { icon: Sparkles, text: "AI-generated NDIS policies (saves $500–$2,000 in consultant fees)" },
  { icon: FolderLock, text: "Compliance vault with expiry tracking for all required documents" },
  { icon: FileText, text: "NDIS-compliant incident reports with PDF download" },
  { icon: Bell, text: "Automatic email reminders before documents expire" },
  { icon: CheckCircle, text: "Live audit readiness score — know exactly where you stand" },
];

export default function SubscribePage() {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 mb-4">
            <Image src="/solocare_lockup.svg" alt="SoloCare" width={160} height={53} className="h-9 w-auto" priority />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] font-heading mb-2">
            Your NDIS compliance, sorted.
          </h1>
          <p className="text-[#64748B]">
            A compliance consultant charges $1,000+ just to write your policies.<br />
            SoloCare does it in 60 seconds.
          </p>
        </div>

        {/* Plan toggle */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4">
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setSelectedPlan("monthly")}
              disabled={loading}
              className={`flex-1 rounded-xl border-2 p-4 text-left transition-all ${
                selectedPlan === "monthly"
                  ? "border-[#1E3A5F] bg-[#1E3A5F]/5"
                  : "border-slate-200 hover:border-slate-300"
              } ${loading ? "pointer-events-none opacity-50" : ""}`}
            >
              <div className="font-bold text-[#0F172A] text-lg">$29</div>
              <div className="text-sm text-[#64748B]">per month</div>
            </button>
            <button
              onClick={() => setSelectedPlan("annual")}
              disabled={loading}
              className={`flex-1 rounded-xl border-2 p-4 text-left transition-all relative ${
                selectedPlan === "annual"
                  ? "border-[#EA7C3C] bg-[#EA7C3C]/5"
                  : "border-slate-200 hover:border-slate-300"
              } ${loading ? "pointer-events-none opacity-50" : ""}`}
            >
              <div className="absolute -top-2.5 right-3 bg-[#EA7C3C] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                SAVE 28%
              </div>
              <div className="font-bold text-[#0F172A] text-lg">$249</div>
              <div className="text-sm text-[#64748B]">per year · $20.75/mo</div>
            </button>
          </div>

          {/* Features */}
          <ul className="space-y-3 mb-6">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-[#16A34A] shrink-0 mt-0.5" />
                <span className="text-sm text-[#0F172A]">{text}</span>
              </li>
            ))}
          </ul>

          <Button
            className="w-full"
            size="lg"
            onClick={handleSubscribe}
            disabled={loading}
          >
            {loading ? "Redirecting to checkout..." : `Subscribe — ${selectedPlan === "annual" ? "$249/yr" : "$29/mo"}`}
          </Button>

          <p className="text-center text-xs text-slate-400 mt-3">
            30-day money-back guarantee · Cancel anytime · Secure payment via Stripe
          </p>
        </div>

        {/* Trust line */}
        <p className="text-center text-xs text-slate-400">
          Built for Australian solo NDIS support workers · ABN required from 2026
        </p>
      </div>
    </div>
  );
}
