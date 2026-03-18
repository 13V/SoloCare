"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Invoice, InvoiceLineItem } from "@/lib/types-features";

interface Props {
  invoice: Invoice & {
    invoice_line_items: InvoiceLineItem[];
    participants: { first_name: string; last_name: string | null } | null;
  };
  businessName: string;
  abn: string | null;
}

export function InvoicePDFDownload({ invoice, businessName, abn }: Props) {
  async function handleDownload() {
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ format: "a4", unit: "mm" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;
      let y = 20;

      // Header rectangle
      doc.setFillColor(30, 58, 95);
      doc.rect(0, 0, pageWidth, 42, "F");

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(businessName, margin, 20);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      if (abn) {
        doc.text(`ABN: ${abn}`, margin, 30);
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("TAX INVOICE", pageWidth - margin, 20, { align: "right" });
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.invoice_number, pageWidth - margin, 30, { align: "right" });

      y = 58;

      // Bill To
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text("BILL TO", margin, y);
      y += 5;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      const participantName = invoice.participants
        ? `${invoice.participants.first_name}${invoice.participants.last_name ? ` ${invoice.participants.last_name}` : ""}`
        : "Participant";
      doc.text(participantName, margin, y);
      y += 10;

      // Invoice metadata
      const metaY = 58;
      const rightCol = pageWidth / 2 + 10;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Issue Date", rightCol, metaY);
      doc.text("Due Date", rightCol + 50, metaY);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.text(formatDate(invoice.issue_date), rightCol, metaY + 5);
      doc.text(formatDate(invoice.due_date), rightCol + 50, metaY + 5);

      y = Math.max(y, metaY + 20);

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      // Line items table header
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text("DESCRIPTION", margin, y);
      doc.text("CATEGORY", margin + 70, y);
      doc.text("HOURS", pageWidth - margin - 60, y, { align: "right" });
      doc.text("RATE ($)", pageWidth - margin - 30, y, { align: "right" });
      doc.text("AMOUNT ($)", pageWidth - margin, y, { align: "right" });
      y += 4;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;

      const sortedItems = [...invoice.invoice_line_items].sort((a, b) => a.sort_order - b.sort_order);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);

      for (const item of sortedItems) {
        if (y > 260) { doc.addPage(); y = 20; }
        const descLines = doc.splitTextToSize(item.description, 65);
        doc.text(descLines, margin, y);
        const catLines = doc.splitTextToSize(item.support_category || "-", 45);
        doc.text(catLines, margin + 70, y);
        doc.text(String(item.hours), pageWidth - margin - 60, y, { align: "right" });
        doc.text(`$${item.rate.toFixed(2)}`, pageWidth - margin - 30, y, { align: "right" });
        doc.text(`$${item.amount.toFixed(2)}`, pageWidth - margin, y, { align: "right" });
        const lineHeight = Math.max(descLines.length, catLines.length) * 5 + 2;
        y += lineHeight;
      }

      // Divider before totals
      y += 4;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;

      // Totals
      const subtotal = sortedItems.reduce((sum, item) => sum + item.amount, 0);
      const gst = invoice.gst_registered ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
      const total = subtotal + gst;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);

      doc.text("Subtotal", pageWidth - margin - 60, y);
      doc.setTextColor(15, 23, 42);
      doc.text(`$${subtotal.toFixed(2)}`, pageWidth - margin, y, { align: "right" });
      y += 6;

      doc.setTextColor(100, 116, 139);
      if (invoice.gst_registered) {
        doc.text("GST (10%)", pageWidth - margin - 60, y);
        doc.setTextColor(15, 23, 42);
        doc.text(`$${gst.toFixed(2)}`, pageWidth - margin, y, { align: "right" });
      } else {
        doc.text("GST", pageWidth - margin - 60, y);
        doc.setTextColor(15, 23, 42);
        doc.text("GST-free (NDIS)", pageWidth - margin, y, { align: "right" });
      }
      y += 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 58, 95);
      doc.text("TOTAL", pageWidth - margin - 60, y);
      doc.text(`$${total.toFixed(2)}`, pageWidth - margin, y, { align: "right" });
      y += 10;

      // Notes
      if (invoice.notes) {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 116, 139);
        doc.text("NOTES", margin, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        const noteLines = doc.splitTextToSize(invoice.notes, maxWidth);
        doc.text(noteLines, margin, y);
        y += noteLines.length * 5 + 6;
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Generated by SoloCare · solocare.au · Page ${i} of ${pageCount}`,
          pageWidth / 2,
          290,
          { align: "center" }
        );
      }

      doc.save(`Invoice_${invoice.invoice_number}_${participantName.replace(/\s+/g, "_")}.pdf`);
      toast.success("PDF downloaded.");
    } catch {
      toast.error("Failed to generate PDF.");
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload}>
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Download PDF</span>
    </Button>
  );
}
