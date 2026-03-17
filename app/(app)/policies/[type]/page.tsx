"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Download, RefreshCw, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Policy, POLICY_LABELS } from "@/lib/types";
import { formatDate } from "@/lib/utils";

function renderMarkdown(md: string): string {
  // Process line by line for more reliable rendering
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

    // Headings
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

    // Unordered list
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

    // Ordered list
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

    // Paragraph
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

export default function PolicyViewPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const policyType = type as Policy["policy_type"];
  const label = POLICY_LABELS[policyType] || "Policy";

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("policies")
        .select("*")
        .eq("policy_type", policyType)
        .single();
      setPolicy(data);
      setLoading(false);
    }
    load();
  }, [policyType]);

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/generate-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy_type: policyType }),
      });
      if (!res.ok) throw new Error();
      const { policy: newPolicy } = await res.json();
      setPolicy(newPolicy);
      toast.success("Policy regenerated!");
    } catch {
      toast.error("Regeneration failed");
    } finally {
      setRegenerating(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  async function handleDownloadPDF() {
    if (!policy) return;
    // Dynamic import to avoid SSR issues
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ format: "a4", unit: "mm" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 95);
    doc.text(label, margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${formatDate(policy.generated_at)}`, margin, y);
    y += 8;

    // Horizontal line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Content — strip markdown for PDF
    const cleanMarkdown = (text: string) => text
      .replace(/^---+$/gm, "")                          // horizontal rules
      .replace(/^```[\s\S]*?```/gm, (m) =>              // code blocks → plain, clean arrows
        m.replace(/^```\w*\n?/gm, "").replace(/```$/gm, "")
         .replace(/[└├─↓→⬇!"]+\s*/g, "→ "))
      .replace(/^\|[-| :]+\|$/gm, "")                   // table separator rows
      .replace(/^\|(.+)\|$/gm, (_, cells) =>            // table rows → plain lines
        cells.split("|").map((c: string) => c.trim()).filter(Boolean).join("   "))
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")          // [text](link) → text
      .replace(/^#{1,6}\s+/gm, "")                      // headings
      .replace(/\*\*(.+?)\*\*/g, "$1")                  // bold
      .replace(/\*(.+?)\*/g, "$1")                      // italic
      .replace(/^[-*]\s+/gm, "• ")                      // bullets
      .replace(/^>\s+/gm, "  ")                         // blockquotes
      .replace(/\n{3,}/g, "\n\n");                      // collapse extra blank lines

    const plainText = cleanMarkdown(policy.content);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);

    const lines = plainText.split("\n");
    for (const line of lines) {
      if (!line.trim()) {
        y += 3;
        continue;
      }
      // Style section headings (numbered like "1. Purpose" or "5.2 ...")
      const isHeading = /^\d+(\.\d+)?\s+[A-Z]/.test(line.trim());
      if (isHeading) {
        if (y + 10 > 280) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(30, 58, 95);
        doc.text(line.trim(), margin, y);
        y += 7;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        continue;
      }
      const wrapped = doc.splitTextToSize(line, maxWidth);
      if (y + wrapped.length * 5.5 > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(wrapped, margin, y);
      y += wrapped.length * 5.5;
    }

    doc.save(`${label.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("PDF downloaded!");
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`h-4 bg-slate-100 rounded animate-pulse ${i % 3 === 0 ? "w-3/4" : "w-full"}`} />
          ))}
        </div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <div className="text-4xl mb-4">📄</div>
        <h2 className="font-semibold text-[#0F172A] text-lg mb-2">Policy not generated yet</h2>
        <p className="text-[#64748B] text-sm mb-6">
          This policy hasn&apos;t been generated. Go back to generate it.
        </p>
        <Link href="/policies">
          <Button variant="outline">Back to Policies</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6 print:hidden">
        <Link href="/policies">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[#0F172A] truncate">{label}</h1>
          <p className="text-xs text-[#64748B]">Last generated {formatDate(policy.generated_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="hidden sm:flex">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={regenerating}
          >
            <RefreshCw className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{regenerating ? "Generating..." : "Regenerate"}</span>
          </Button>
        </div>
      </div>

      {/* Policy Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-10 print:border-0 print:p-0">
        <div
          className="prose prose-slate max-w-none text-sm"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(policy.content) }}
        />
      </div>
    </div>
  );
}
