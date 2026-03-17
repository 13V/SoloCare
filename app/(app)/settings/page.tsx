"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { AU_STATES } from "@/lib/types";
import { LogOut, CreditCard, ExternalLink } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

function validateABN(abn: string): boolean {
  const digits = abn.replace(/\s/g, "");
  if (!/^\d{11}$/.test(digits)) return false;
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const adjusted = [parseInt(digits[0]) - 1, ...digits.slice(1).split("").map(Number)];
  const sum = adjusted.reduce((acc, d, i) => acc + d * weights[i], 0);
  return sum % 89 === 0;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [form, setForm] = useState({
    business_name: "",
    abn: "",
    contact_name: "",
    phone: "",
    state: "",
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (profile) {
        setForm({
          business_name: profile.business_name || "",
          abn: profile.abn || "",
          contact_name: profile.contact_name || "",
          phone: profile.phone || "",
          state: profile.state || "",
        });
        setSubscriptionStatus(profile.subscription_status || null);
        setSubscriptionEnd(profile.subscription_period_end || null);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (form.abn && !validateABN(form.abn)) {
      toast.error("Invalid ABN — please check and try again");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").update(form).eq("id", user.id);
    if (error) {
      toast.error("Failed to save changes");
    } else {
      toast.success("Settings saved!");
    }
    setSaving(false);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleBillingPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch {
      toast.error("Could not open billing portal. Please try again.");
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-4">
        {[1, 2].map(i => <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A] font-heading">Settings</h1>
        <p className="text-sm text-[#64748B] mt-1">Manage your business details and account</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Business Details */}
        <Card className="border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Business Details</CardTitle>
            <CardDescription>Used to personalise your policies and incident reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business / Trading Name</Label>
              <Input
                id="business_name"
                value={form.business_name}
                onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
                placeholder="Smith Care Services"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="abn">
                ABN
                {form.abn && (
                  <span className={`ml-2 text-xs font-normal ${validateABN(form.abn) ? "text-green-600" : "text-red-500"}`}>
                    {validateABN(form.abn) ? "✓ Valid" : "✗ Invalid"}
                  </span>
                )}
              </Label>
              <Input
                id="abn"
                value={form.abn}
                onChange={e => setForm(f => ({ ...f, abn: e.target.value }))}
                placeholder="12 345 678 901"
                maxLength={14}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State / Territory</Label>
              <Select value={form.state} onValueChange={v => setForm(f => ({ ...f, state: v }))}>
                <SelectTrigger id="state">
                  <SelectValue placeholder="Select your state" />
                </SelectTrigger>
                <SelectContent>
                  {AU_STATES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Contact Details */}
        <Card className="border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Contact Details</CardTitle>
            <CardDescription>Your personal contact information as the NDIS provider</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact_name">Full Name</Label>
              <Input
                id="contact_name"
                value={form.contact_name}
                onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                placeholder="Troy Watson"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="0400 000 000"
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input value={email} disabled className="bg-slate-50 text-slate-500" />
              <p className="text-xs text-slate-400">Email cannot be changed here. Contact support if needed.</p>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" size="lg" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>

      {/* Account */}
      <Card className="border-slate-200 mt-4">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Image src="/solocare_icon.svg" alt="SoloCare" width={20} height={20} className="h-5 w-5" />
              <span className="text-sm text-slate-600">SoloCare subscription</span>
            </div>
            {subscriptionStatus === "active" ? (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
            ) : (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium capitalize">
                {subscriptionStatus || "Inactive"}
              </span>
            )}
          </div>
          {subscriptionEnd && (
            <p className="text-xs text-slate-400 pb-2 border-b border-slate-100">
              {subscriptionStatus === "active" ? "Renews" : "Expires"}{" "}
              {new Date(subscriptionEnd).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-sm"
            onClick={handleBillingPortal}
            disabled={portalLoading}
          >
            <CreditCard className="h-4 w-4" />
            {portalLoading ? "Opening..." : "Manage billing & invoices"}
            <ExternalLink className="h-3.5 w-3.5 ml-auto text-slate-400" />
          </Button>
          <Button
            variant="ghost"
            className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 justify-start gap-2"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
