"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Download, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ServiceAgreement } from "@/lib/types-features";
import { formatDate } from "@/lib/utils";

function renderMarkdown(md: string): string {
  const lines = md.split("\n");
  const output: string[] = [];
  let inList = false;
  let listType: "ul" | "ol" | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (inList) {
        output.push(listType === "ol" ? "</ol>" : "</ul>");
        inList = false;
        listType = null;
      }
      continue;
    }

    if (trimmed.startsWith("# ")) {
      if (inList) { output.push(listType === "ol" ? "</ol>" : "</ul>"); inList = false; }
      output.push(`<h1 class="text-xl sm:text-2xl font-bold text-[#0F172A] mt-8 mb-3 first:mt-0">${applyInline(trimmed.slice(2))}</h1>`);
      continue;
    }
    if (trimmed.startsWith("## ")) {
      if (inList) { output.push(listType === "ol" ? "</ol>" : "</ul>"); inList = false; }
      output.push(`<h2 class="text-base sm:text-lg font-semibold text-[#0F172A] mt-6 mb-2 border-b border-slate-100 pb-1.5">${applyInline(trimmed.slice(3))}</h2>`);
      continue;
    }
    if (trimmed.startsWith("### ")) {
      if (inList) { output.push(listType === "ol" ? "</ol>" : "</ul>"); inList = false; }
      output.push(`<h3 class="text-sm sm:text-base font-semibold text-[#0F172A] mt-4 mb-1.5">${applyInline(trimmed.slice(4))}</h3>`);
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList || listType !== "ul") {
        if (inList) output.push(listType === "ol" ? "</ol>" : "</ul>");
        output.push('<ul class="list-disc ml-5 mb-3 space-y-1">');
        inList = true;
        listType = "ul";
      }
      output.push(`<li class="text-sm text-[#0F172A] leading-relaxed">${applyInline(trimmed.slice(2))}</li>`);
      continue;
    }

    const olMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (olMatch) {
      if (!inList || listType !== "ol") {
        if (inList) output.push(listType === "ol" ? "</ol>" : "</ul>");
        output.push('<ol class="list-decimal ml-5 mb-3 space-y-1">');
        inList = true;
        listType = "ol";
      }
      output.push(`<li class="text-sm text-[#0F172A] leading-relaxed">${applyInline(olMatch[2])}</li>`);
      continue;
    }

    if (inList) { output.push(listType === "ol" ? "</ol>" : "</ul>"); inList = false; }
    output.push(`<p class="text-sm text-[#0F172A] mb-3 leading-relaxed">${applyInline(trimmed)}</p>`);
  }

  if (inList) output.push(listType === "ol" ? "</ol>" : "</ul>");
  return output.join("\n");
}

function applyInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

export default function AgreementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: participantId } = use(params);
  const [agreement, setAgreement] = useState<ServiceAgreement | null>(null);
  const [participantName, setParticipantName] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: agData }, { data: partData }] = await Promise.all([
        supabase
          .from("service_agreements")
          .select("*")
          .eq("participant_id", participantId)
          .maybeSingle(),
        supabase
          .from("participants")
          .select("first_name, last_name")
          .eq("id", participantId)
          .single(),
      ]);
      setAgreement(agData as ServiceAgreement | null);
      if (partData) {
        setParticipantName(`${partData.first_name}${partData.last_name ? " " + partData.last_name : ""}`);
      }
      setLoading(false);
    }
    load();
  }, [participantId]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participant_id: participantId }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const { agreement: newAgreement } = await res.json();
      setAgreement(newAgreement);
      toast.success("Service agreement generated!");
    } catch {
      toast.error("Failed to generate agreement. Check your API key.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownloadPDF() {
    if (!agreement?.content) return;
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ format: "a4", unit: "mm" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let y = 0;

    // Header
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, pageWidth, 28, "F");

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("NDIS Service Agreement", margin, 12);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(participantName, margin, 21);

    y = 38;

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Strip markdown for PDF
    const clean = agreement.content
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/^[-*]\s+/gm, "• ")
      .replace(/\n{3,}/g, "\n\n");

    const lines = clean.split("\n");
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);

    for (const line of lines) {
      if (!line.trim()) { y += 3; continue; }
      const isHeading = /^\d+(\.\d+)?\s+[A-Z]/.test(line.trim());
      if (isHeading) {
        if (y + 10 > 280) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 58, 95);
        doc.text(line.trim(), margin, y);
        y += 7;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        continue;
      }
      const wrapped = doc.splitTextToSize(line, maxWidth);
      if (y + wrapped.length * 5.5 > 280) { doc.addPage(); y = 20; }
      doc.text(wrapped, margin, y);
      y += wrapped.length * 5.5;
    }

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Generated by SoloCare · solocare.com.au", pageWidth / 2, 290, { align: "center" });
    }

    doc.save(`Service_Agreement_${participantName.replace(/\s+/g, "_")}.pdf`);
    toast.success("PDF downloaded!");
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`h-4 bg-slate-100 rounded animate-pulse ${i % 3 === 0 ? "w-3/4" : "w-full"}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/participants/${participantId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[#0F172A] truncate">Service Agreement</h1>
          {participantName && (
            <p className="text-xs text-[#64748B]">{participantName}</p>
          )}
          {agreement && (
            <p className="text-xs text-[#64748B]">
              Generated {formatDate(agreement.generated_at)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {agreement && (
            <>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={generating}
              >
                <RefreshCw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">{generating ? "Generating..." : "Regenerate"}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {!agreement ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#1E3A5F]/10 rounded-2xl mb-4">
            <Sparkles className="h-7 w-7 text-[#1E3A5F]" />
          </div>
          <h3 className="font-semibold text-[#0F172A] text-base mb-2">No service agreement yet</h3>
          <p className="text-sm text-[#64748B] mb-6 max-w-sm mx-auto">
            Generate an NDIS-compliant service agreement for {participantName || "this participant"} using AI. It will be personalised with their plan details.
          </p>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Service Agreement
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-10">
          {generating && (
            <div className="flex items-center gap-2 text-sm text-[#64748B] mb-4">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Regenerating agreement...
            </div>
          )}
          <div
            className="prose prose-slate max-w-none text-sm"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(agreement.content || "") }}
          />
        </div>
      )}
    </div>
  );
}
