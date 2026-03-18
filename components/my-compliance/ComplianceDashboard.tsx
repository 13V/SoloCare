"use client";

import { useState } from "react";
import { Plus, ShieldCheck, Calendar, AlertTriangle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkerDocumentForm } from "./WorkerDocumentForm";
import { WorkerDocument } from "@/lib/types-features";

interface Props {
  initialDocuments: WorkerDocument[];
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function StatusBadge({ status, expiryDate }: { status: WorkerDocument["status"]; expiryDate: string | null }) {
  if (status === "expired") {
    return <Badge variant="expired" className="text-xs">Expired</Badge>;
  }
  if (status === "expiring_soon" && expiryDate) {
    const days = daysUntil(expiryDate);
    return <Badge variant="expiring" className="text-xs">Expiring in {days}d</Badge>;
  }
  return <Badge variant="valid" className="text-xs">Current</Badge>;
}

export function ComplianceDashboard({ initialDocuments }: Props) {
  const [documents, setDocuments] = useState<WorkerDocument[]>(initialDocuments);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WorkerDocument | null>(null);

  const expiredOrSoon = documents.filter(
    (d) => d.status === "expired" || d.status === "expiring_soon"
  );

  function handleSaved(doc: WorkerDocument) {
    setDocuments((prev) => {
      const exists = prev.find((d) => d.id === doc.id);
      if (exists) return prev.map((d) => (d.id === doc.id ? doc : d));
      return [doc, ...prev];
    });
  }

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(doc: WorkerDocument) {
    setEditing(doc);
    setFormOpen(true);
  }

  return (
    <>
      {expiredOrSoon.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">Action required</p>
            <p className="text-sm text-amber-700 mt-0.5">
              {expiredOrSoon.filter((d) => d.status === "expired").length > 0 && (
                <span>{expiredOrSoon.filter((d) => d.status === "expired").length} expired credential{expiredOrSoon.filter((d) => d.status === "expired").length > 1 ? "s" : ""}. </span>
              )}
              {expiredOrSoon.filter((d) => d.status === "expiring_soon").length > 0 && (
                <span>{expiredOrSoon.filter((d) => d.status === "expiring_soon").length} credential{expiredOrSoon.filter((d) => d.status === "expiring_soon").length > 1 ? "s" : ""} expiring soon.</span>
              )}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#64748B]">
          {documents.length} credential{documents.length !== 1 ? "s" : ""} on record
        </p>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Credential
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#1E3A5F]/10 rounded-2xl mb-4">
            <ShieldCheck className="h-7 w-7 text-[#1E3A5F]" />
          </div>
          <h3 className="font-semibold text-[#0F172A] text-base mb-2">No credentials added yet</h3>
          <p className="text-sm text-[#64748B] mb-6 max-w-sm mx-auto">
            Track your worker credentials here — police checks, first aid certificates, insurance, and more.
          </p>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add First Credential
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`bg-white rounded-xl border p-4 ${
                doc.status === "expired"
                  ? "border-red-200"
                  : doc.status === "expiring_soon"
                  ? "border-amber-200"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-0.5">
                    {doc.document_type}
                  </p>
                  <p className="text-sm font-semibold text-[#0F172A] truncate">{doc.document_name}</p>
                </div>
                <StatusBadge status={doc.status} expiryDate={doc.expiry_date} />
              </div>

              <div className="space-y-1 mb-3">
                {doc.issued_date && (
                  <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    Issued: {new Date(doc.issued_date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                )}
                {doc.expiry_date && (
                  <div className={`flex items-center gap-1.5 text-xs ${doc.status === "expired" ? "text-red-600" : doc.status === "expiring_soon" ? "text-amber-600" : "text-[#64748B]"}`}>
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    Expires: {new Date(doc.expiry_date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                    {doc.status === "expiring_soon" && (
                      <span className="font-medium">({daysUntil(doc.expiry_date)} days)</span>
                    )}
                  </div>
                )}
              </div>

              {doc.notes && (
                <p className="text-xs text-[#64748B] mb-3 line-clamp-2">{doc.notes}</p>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-[#64748B] px-2"
                onClick={() => openEdit(doc)}
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
            </div>
          ))}
        </div>
      )}

      <WorkerDocumentForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSaved={handleSaved}
        initial={editing}
      />
    </>
  );
}
