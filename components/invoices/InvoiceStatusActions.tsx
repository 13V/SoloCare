"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { InvoiceStatusDerived } from "@/lib/types-features";

interface Props {
  invoiceId: string;
  currentStatus: InvoiceStatusDerived;
}

export function InvoiceStatusActions({ invoiceId, currentStatus }: Props) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  async function updateStatus(newStatus: "sent" | "paid") {
    setUpdating(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("invoices")
        .update({ status: newStatus })
        .eq("id", invoiceId);

      if (error) {
        toast.error("Failed to update invoice status.");
        return;
      }

      toast.success(newStatus === "sent" ? "Invoice marked as sent." : "Invoice marked as paid.");
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setUpdating(false);
    }
  }

  if (currentStatus === "draft") {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={updating}
        onClick={() => updateStatus("sent")}
      >
        {updating ? "Updating..." : "Mark as Sent"}
      </Button>
    );
  }

  if (currentStatus === "sent" || currentStatus === "overdue") {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={updating}
        onClick={() => updateStatus("paid")}
      >
        {updating ? "Updating..." : "Mark as Paid"}
      </Button>
    );
  }

  if (currentStatus === "paid") {
    return (
      <span className="text-sm font-medium text-[#16A34A] px-3 py-1.5">
        Paid
      </span>
    );
  }

  return null;
}
