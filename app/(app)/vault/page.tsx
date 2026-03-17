import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VaultClientPage } from "./VaultClientPage";

const REQUIRED_DOC_TYPES = [
  { type: "worker_screening", label: "Worker Screening Check", required: true, desc: "NDIS Worker Screening Check — state-issued, mandatory" },
  { type: "police_check", label: "National Police Check", required: true, desc: "Must be less than 3 years old" },
  { type: "first_aid", label: "First Aid Certificate", required: false, desc: "Strongly recommended for support workers" },
  { type: "insurance", label: "Public Liability Insurance", required: true, desc: "Mandatory for registered NDIS providers" },
];

export default async function VaultPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: documents } = await supabase
    .from("vault_documents")
    .select("*")
    .eq("user_id", user.id)
    .order("uploaded_at", { ascending: false });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] font-heading">Compliance Vault</h1>
          <p className="text-sm text-[#64748B] mt-1">Store and track all your compliance documents</p>
        </div>
        <Link href="/vault/upload">
          <Button>
            <Plus className="h-4 w-4" />
            Add Document
          </Button>
        </Link>
      </div>

      {/* Required docs checklist */}
      <div className="bg-[#1E3A5F]/5 border border-[#1E3A5F]/20 rounded-xl p-4 mb-6">
        <h2 className="font-semibold text-[#1E3A5F] text-sm mb-3">NDIS Required Documents</h2>
        <div className="space-y-2">
          {REQUIRED_DOC_TYPES.map((req) => {
            const uploaded = documents?.find((d) => d.document_type === req.type);
            return (
              <div key={req.type} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-white text-xs ${uploaded ? "bg-[#16A34A]" : req.required ? "bg-[#DC2626]" : "bg-slate-300"}`}>
                    {uploaded ? "✓" : req.required ? "!" : "?"}
                  </div>
                  <span className="text-sm text-[#0F172A] font-medium truncate">{req.label}</span>
                  {req.required && <Badge variant="outline" className="text-xs border-[#1E3A5F]/30 text-[#1E3A5F] shrink-0">Required</Badge>}
                </div>
                {!uploaded && (
                  <Link href={`/vault/upload?type=${req.type}`}>
                    <Button variant="ghost" size="sm" className="text-xs text-[#1E3A5F] shrink-0">
                      <Upload className="h-3 w-3" /> Upload
                    </Button>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <VaultClientPage initialDocuments={documents || []} />
    </div>
  );
}
