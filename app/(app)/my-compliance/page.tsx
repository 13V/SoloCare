import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { WorkerDocument } from "@/lib/types-features";
import { ComplianceDashboard } from "@/components/my-compliance/ComplianceDashboard";

export default async function MyCompliancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("worker_documents")
    .select("id, user_id, document_type, document_name, expiry_date, issued_date, notes, status, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const documents = (data ?? []) as WorkerDocument[];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-[#1E3A5F]/10 p-2.5 rounded-xl">
          <ShieldCheck className="h-6 w-6 text-[#1E3A5F]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] font-heading">My Credentials &amp; Compliance</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Track your worker credentials, checks, and insurance documents
          </p>
        </div>
      </div>

      <ComplianceDashboard initialDocuments={documents} />
    </div>
  );
}
