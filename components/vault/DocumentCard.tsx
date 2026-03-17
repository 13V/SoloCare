"use client";
import { useState } from "react";
import { FileText, Trash2, ExternalLink, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VaultDocument } from "@/lib/types";
import { formatDate, getDaysUntilExpiry, getDocumentStatus } from "@/lib/utils";

interface Props {
  document: VaultDocument;
  onDelete: (id: string) => void;
}

const statusConfig = {
  valid: { variant: "valid" as const, label: "Valid" },
  expiring_soon: { variant: "expiring" as const, label: "Expiring Soon" },
  expired: { variant: "expired" as const, label: "Expired" },
  missing: { variant: "missing" as const, label: "Missing" },
};

export function DocumentCard({ document, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const status = getDocumentStatus(document.expiry_date);
  const config = statusConfig[status];
  const daysLeft = document.expiry_date ? getDaysUntilExpiry(document.expiry_date) : null;

  return (
    <Card className={`border ${status === "expired" ? "border-red-200 bg-red-50/30" : status === "expiring_soon" ? "border-amber-200 bg-amber-50/30" : "border-slate-200"}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`p-2 rounded-lg shrink-0 ${
              status === "expired" ? "bg-red-100" :
              status === "expiring_soon" ? "bg-amber-100" :
              status === "valid" ? "bg-green-100" : "bg-slate-100"
            }`}>
              <FileText className={`h-5 w-5 ${
                status === "expired" ? "text-red-600" :
                status === "expiring_soon" ? "text-amber-600" :
                status === "valid" ? "text-green-600" : "text-slate-400"
              }`} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-[#0F172A] text-sm truncate">{document.document_name}</p>
              {document.expiry_date ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <Calendar className="h-3 w-3 text-[#64748B]" />
                  <p className="text-xs text-[#64748B]">
                    Expires {formatDate(document.expiry_date)}
                    {daysLeft !== null && daysLeft >= 0 && daysLeft <= 60 && (
                      <span className={`ml-1 font-medium ${daysLeft <= 30 ? "text-amber-600" : "text-[#64748B]"}`}>
                        ({daysLeft}d left)
                      </span>
                    )}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[#64748B] mt-0.5">No expiry set</p>
              )}
              <p className="text-xs text-slate-400 mt-0.5">
                Uploaded {formatDate(document.uploaded_at)}
              </p>
            </div>
          </div>
          <Badge variant={config.variant} className="shrink-0">{config.label}</Badge>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          {document.file_url && (
            <a href={document.file_url} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="outline" size="sm" className="w-full text-xs">
                <ExternalLink className="h-3.5 w-3.5" />
                View File
              </Button>
            </a>
          )}
          {confirmDelete ? (
            <div className="flex gap-2 flex-1">
              <Button
                variant="destructive"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => onDelete(document.id)}
              >
                Confirm Delete
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
