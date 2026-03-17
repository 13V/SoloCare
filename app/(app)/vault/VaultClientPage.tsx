"use client";
import { useState } from "react";
import { toast } from "sonner";
import { DocumentCard } from "@/components/vault/DocumentCard";
import { VaultDocument } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Upload, FolderLock } from "lucide-react";

interface Props {
  initialDocuments: VaultDocument[];
}

export function VaultClientPage({ initialDocuments }: Props) {
  const [documents, setDocuments] = useState(initialDocuments);
  const router = useRouter();

  async function handleDelete(id: string) {
    const supabase = createClient();
    const doc = documents.find((d) => d.id === id);

    // Delete from storage if there's a file
    if (doc?.file_url) {
      const path = doc.file_url.split("/").slice(-2).join("/");
      await supabase.storage.from("vault").remove([path]);
    }

    const { error } = await supabase.from("vault_documents").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete document");
      return;
    }
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    toast.success("Document deleted");
    router.refresh();
  }

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-[#1E3A5F]/8 rounded-2xl mb-4">
          <FolderLock className="h-7 w-7 text-[#1E3A5F]" />
        </div>
        <h3 className="font-semibold text-[#0F172A] text-base mb-2">No documents uploaded yet</h3>
        <p className="text-sm text-[#64748B] mb-6 max-w-sm mx-auto">
          Start by uploading your Worker Screening Check — it&apos;s the first document NDIS auditors look for.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/vault/upload?type=worker_screening">
            <Button className="w-full sm:w-auto">
              <Upload className="h-4 w-4" />
              Upload Worker Screening Check
            </Button>
          </Link>
          <Link href="/vault/upload">
            <Button variant="outline" className="w-full sm:w-auto">
              Browse all document types
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-semibold text-[#0F172A] mb-3">Your Documents ({documents.length})</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {documents.map((doc) => (
          <DocumentCard key={doc.id} document={doc} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
