"use client";
import { useState, useEffect } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PolicyCard } from "@/components/policies/PolicyCard";
import { Policy } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

const POLICY_TYPES: Policy["policy_type"][] = [
  "incident_management",
  "complaints",
  "risk",
  "code_of_conduct",
];

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [generatingTypes, setGeneratingTypes] = useState<Set<string>>(new Set());
  const [generatingAll, setGeneratingAll] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPolicies();
  }, []);

  async function loadPolicies() {
    const supabase = createClient();
    const { data } = await supabase
      .from("policies")
      .select("*")
      .order("generated_at", { ascending: false });
    setPolicies(data || []);
    setLoading(false);
  }

  async function generatePolicy(type: Policy["policy_type"]) {
    setGeneratingTypes((prev) => new Set(prev).add(type));
    try {
      const res = await fetch("/api/generate-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy_type: type }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const { policy } = await res.json();
      setPolicies((prev) => {
        const filtered = prev.filter((p) => p.policy_type !== type);
        return [...filtered, policy];
      });
      toast.success(`${type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} policy generated!`);
    } catch {
      toast.error("Failed to generate policy. Check your API key.");
    } finally {
      setGeneratingTypes((prev) => {
        const next = new Set(prev);
        next.delete(type);
        return next;
      });
    }
  }

  async function generateAll() {
    setGeneratingAll(true);
    const missing = POLICY_TYPES.filter((t) => !policies.find((p) => p.policy_type === t));
    const toGenerate = missing.length > 0 ? missing : POLICY_TYPES;

    toast.info(`Generating ${toGenerate.length} policies... this takes ~30 seconds.`);

    for (const type of toGenerate) {
      await generatePolicy(type);
    }
    setGeneratingAll(false);
    toast.success("All policies generated!");
  }

  const missingCount = POLICY_TYPES.filter((t) => !policies.find((p) => p.policy_type === t)).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] font-heading">NDIS Policies</h1>
          <p className="text-sm text-[#64748B] mt-1">
            {policies.length === 4
              ? "All 4 mandatory policies generated ✓"
              : `${4 - policies.length} of 4 policies still needed`}
          </p>
        </div>
        <Button
          onClick={generateAll}
          disabled={generatingAll || loading}
          className="shrink-0"
        >
          {generatingAll ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {missingCount > 0 ? `Generate ${missingCount} Missing` : "Regenerate All"}
            </>
          )}
        </Button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>AI-powered:</strong> Your policies are generated using your business details and personalised to comply with NDIS Practice Standards 2021. Each policy takes ~10 seconds to generate.
        </p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {POLICY_TYPES.map((type) => (
            <PolicyCard
              key={type}
              policyType={type}
              policy={policies.find((p) => p.policy_type === type)}
              onGenerate={generatePolicy}
              generating={generatingTypes.has(type) || generatingAll}
            />
          ))}
        </div>
      )}
    </div>
  );
}
