"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WorkerDocument, WORKER_DOCUMENT_TYPES } from "@/lib/types-features";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (doc: WorkerDocument) => void;
  initial?: WorkerDocument | null;
}

function computeStatus(expiryDate: string | null): WorkerDocument["status"] {
  if (!expiryDate) return "current";
  const expiry = new Date(expiryDate);
  const now = new Date();
  if (expiry < now) return "expired";
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (expiry <= thirtyDays) return "expiring_soon";
  return "current";
}

export function WorkerDocumentForm({ open, onClose, onSaved, initial }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    document_type: initial?.document_type ?? "",
    document_name: initial?.document_name ?? "",
    issued_date: initial?.issued_date ?? "",
    expiry_date: initial?.expiry_date ?? "",
    notes: initial?.notes ?? "",
  });

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.document_type) {
      toast.error("Please select a document type");
      return;
    }
    if (!form.document_name.trim()) {
      toast.error("Please enter a document name");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not logged in");
        return;
      }

      const payload = {
        user_id: user.id,
        document_type: form.document_type,
        document_name: form.document_name.trim(),
        issued_date: form.issued_date || null,
        expiry_date: form.expiry_date || null,
        notes: form.notes.trim() || null,
        status: computeStatus(form.expiry_date || null),
        updated_at: new Date().toISOString(),
      };

      let data: WorkerDocument | null = null;
      let error: { message: string } | null = null;

      if (initial?.id) {
        const result = await supabase
          .from("worker_documents")
          .update(payload)
          .eq("id", initial.id)
          .eq("user_id", user.id)
          .select()
          .single();
        data = result.data as WorkerDocument | null;
        error = result.error;
      } else {
        const result = await supabase
          .from("worker_documents")
          .insert(payload)
          .select()
          .single();
        data = result.data as WorkerDocument | null;
        error = result.error;
      }

      if (error || !data) {
        toast.error("Failed to save document");
        return;
      }

      toast.success(initial?.id ? "Document updated" : "Document added");
      onSaved(data);
      onClose();
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Edit Document" : "Add Credential"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="document_type">Document Type <span className="text-red-500">*</span></Label>
            <Select
              value={form.document_type}
              onValueChange={(v) => handleChange("document_type", v)}
            >
              <SelectTrigger id="document_type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {WORKER_DOCUMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="document_name">Document Name / Reference <span className="text-red-500">*</span></Label>
            <Input
              id="document_name"
              value={form.document_name}
              onChange={(e) => handleChange("document_name", e.target.value)}
              placeholder="e.g. NDIS Screening Check SA — John Smith"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issued_date">Issued Date</Label>
              <Input
                id="issued_date"
                type="date"
                value={form.issued_date}
                onChange={(e) => handleChange("issued_date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input
                id="expiry_date"
                type="date"
                value={form.expiry_date}
                onChange={(e) => handleChange("expiry_date", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : initial?.id ? "Save Changes" : "Add Document"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
