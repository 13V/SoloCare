"use client";
import { useState } from "react";
import { FileText, RefreshCw, Download, ChevronRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Policy, POLICY_LABELS } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface Props {
  policyType: Policy["policy_type"];
  policy?: Policy;
  onGenerate: (type: Policy["policy_type"]) => Promise<void>;
  generating: boolean;
}

export function PolicyCard({ policyType, policy, onGenerate, generating }: Props) {
  const label = POLICY_LABELS[policyType];

  return (
    <Card className={`border ${policy ? "border-slate-200" : "border-dashed border-slate-300 bg-slate-50/50"} hover:shadow-sm transition-shadow`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg shrink-0 ${policy ? "bg-[#1E3A5F]/10" : "bg-slate-100"}`}>
              <FileText className={`h-5 w-5 ${policy ? "text-[#1E3A5F]" : "text-slate-400"}`} />
            </div>
            <div>
              <h3 className="font-semibold text-[#0F172A] text-sm leading-tight">{label}</h3>
              {policy ? (
                <p className="text-xs text-[#64748B] mt-0.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Generated {formatDate(policy.generated_at)}
                </p>
              ) : (
                <p className="text-xs text-slate-400 mt-0.5">Not generated yet</p>
              )}
            </div>
          </div>
          <Badge variant={policy ? "valid" : "missing"}>
            {policy ? "Ready" : "Missing"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2">
          {policy ? (
            <>
              <Link href={`/policies/${policyType}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  View Policy <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[#64748B]"
                onClick={() => onGenerate(policyType)}
                disabled={generating}
                title="Regenerate"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
              </Button>
            </>
          ) : (
            <Button
              className="w-full text-xs"
              size="sm"
              onClick={() => onGenerate(policyType)}
              disabled={generating}
            >
              {generating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Policy"
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
