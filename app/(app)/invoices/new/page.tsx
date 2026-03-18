import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { Participant } from "@/lib/types-features";

export default async function NewInvoicePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: participantsRaw } = await supabase
    .from("participants")
    .select("id, first_name, last_name")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("first_name", { ascending: true })
    .limit(200);

  const participants = (participantsRaw || []) as Pick<Participant, "id" | "first_name" | "last_name">[];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] font-heading">New Invoice</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Create an invoice for NDIS support services</p>
        </div>
      </div>
      <InvoiceForm participants={participants} />
    </div>
  );
}
