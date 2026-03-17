"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Check } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { validateABN } from "@/lib/utils";
import { AU_STATES } from "@/lib/types";

const STEPS = ["Business Details", "Contact Info", "State & ABN"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    contact_name: "",
    phone: "",
    state: "",
    abn: "",
  });

  const progress = ((step + 1) / STEPS.length) * 100;

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleABNChange(value: string) {
    // Only allow digits and spaces
    const cleaned = value.replace(/[^\d\s]/g, "");
    update("abn", cleaned);
  }

  function nextStep() {
    if (step === 0 && !form.business_name.trim()) {
      toast.error("Enter your business name");
      return;
    }
    if (step === 1 && !form.contact_name.trim()) {
      toast.error("Enter your name");
      return;
    }
    setStep((s) => s + 1);
  }

  async function handleSubmit() {
    const abnCleaned = form.abn.replace(/\s/g, "");
    if (abnCleaned && !validateABN(form.abn)) {
      toast.error("Invalid ABN — please check and try again");
      return;
    }
    if (!form.state) {
      toast.error("Please select your state");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      business_name: form.business_name,
      contact_name: form.contact_name,
      phone: form.phone,
      state: form.state,
      abn: abnCleaned,
      onboarding_complete: true,
    });
    if (error) {
      toast.error("Failed to save — please try again");
      setLoading(false);
      return;
    }
    toast.success("Setup complete! Welcome to SoloCare.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md sm:max-w-lg">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <Image src="/solocare_lockup.svg" alt="SoloCare" width={160} height={53} className="h-9 w-auto" priority />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] font-heading mb-1.5">Let&apos;s get you set up</h1>
          <p className="text-[#64748B] text-sm">
            Takes 2 minutes — we use these to personalise your policies.
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-5">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-1.5 sm:gap-2">
              <div
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  i < step
                    ? "bg-[#16A34A] text-white"
                    : i === step
                    ? "bg-[#1E3A5F] text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 sm:w-12 h-0.5 ${i < step ? "bg-[#16A34A]" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>

        <Progress value={progress} className="mb-6 sm:mb-8 h-1.5" />

        {/* Step content */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-8">
          <h2 className="font-semibold text-[#0F172A] text-lg mb-6">{STEPS[step]}</h2>

          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">Business / Trading Name</Label>
                <Input
                  id="business_name"
                  placeholder="e.g. Smith Care Services"
                  value={form.business_name}
                  onChange={(e) => update("business_name", e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-[#64748B]">
                  This will appear on your NDIS policies and reports.
                </p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Your Full Name</Label>
                <Input
                  id="contact_name"
                  placeholder="e.g. Sarah Smith"
                  value={form.contact_name}
                  onChange={(e) => update("contact_name", e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g. 0412 345 678"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="state">State / Territory</Label>
                <Select value={form.state} onValueChange={(v) => update("state", v)}>
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Select your state" />
                  </SelectTrigger>
                  <SelectContent>
                    {AU_STATES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="abn">ABN (optional but recommended)</Label>
                <Input
                  id="abn"
                  placeholder="e.g. 51 824 753 556"
                  value={form.abn}
                  onChange={(e) => handleABNChange(e.target.value)}
                  maxLength={14}
                />
                {form.abn.replace(/\s/g, "").length === 11 && (
                  <p className={`text-xs font-medium ${validateABN(form.abn) ? "text-green-600" : "text-red-600"}`}>
                    {validateABN(form.abn) ? "✓ Valid ABN" : "✗ Invalid ABN — please check"}
                  </p>
                )}
                <p className="text-xs text-[#64748B]">
                  We&apos;ll validate using the ATO&apos;s algorithm. Required for policy documents.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={loading}>
                Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button className="flex-1" onClick={nextStep}>
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
                {loading ? "Saving..." : "Complete Setup"}
                {!loading && <Check className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
