"use client";
import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { DOCUMENT_TYPE_LABELS } from "@/lib/types";

const DOC_TYPES = Object.entries(DOCUMENT_TYPE_LABELS);

function UploadForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultType = searchParams.get("type") || "";

  const [docType, setDocType] = useState(defaultType);
  const [docName, setDocName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File too large — max 10MB");
      return;
    }
    if (!["application/pdf", "image/jpeg", "image/png", "image/jpg"].includes(f.type)) {
      toast.error("Only PDF, JPG, or PNG files allowed");
      return;
    }
    setFile(f);
    if (!docName) setDocName(f.name.replace(/\.[^/.]+$/, ""));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!docType) { toast.error("Select a document type"); return; }
    if (!docName.trim()) { toast.error("Enter a document name"); return; }
    if (!file) { toast.error("Please select a file to upload"); return; }

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Upload to Supabase Storage
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}.${ext}`;
    const { error: storageError } = await supabase.storage
      .from("vault")
      .upload(filePath, file, { upsert: false });

    if (storageError) {
      toast.error("Upload failed: " + storageError.message);
      setLoading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("vault").getPublicUrl(filePath);

    // Save document record
    const { error: dbError } = await supabase.from("vault_documents").insert({
      user_id: user.id,
      document_type: docType,
      document_name: docName,
      file_url: publicUrl,
      expiry_date: expiryDate || null,
    });

    if (dbError) {
      toast.error("Failed to save document record");
      setLoading(false);
      return;
    }

    toast.success("Document uploaded successfully!");
    router.push("/vault");
    router.refresh();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/vault">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] font-heading">Upload Document</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Add a compliance document to your vault</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* File drop zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-[#1E3A5F] bg-[#1E3A5F]/5"
              : file
              ? "border-green-400 bg-green-50"
              : "border-slate-300 hover:border-[#1E3A5F]/50"
          }`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
        >
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <Check className="h-10 w-10 text-green-500" />
              <p className="font-medium text-green-700">{file.name}</p>
              <p className="text-xs text-green-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-slate-500"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-10 w-10 text-slate-300" />
              <p className="font-medium text-[#64748B]">Drop your file here or tap to browse</p>
              <p className="text-xs text-slate-400">PDF, JPG, or PNG · Max 10MB</p>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        <div className="space-y-2">
          <Label htmlFor="doc_type">Document Type</Label>
          <Select value={docType} onValueChange={setDocType}>
            <SelectTrigger id="doc_type">
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              {DOC_TYPES.map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="doc_name">Document Name</Label>
          <Input
            id="doc_name"
            placeholder="e.g. Worker Screening Check - Sarah Smith"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiry">Expiry Date</Label>
          <Input
            id="expiry"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
          <p className="text-xs text-[#64748B]">
            Leave blank for documents without an expiry date.
          </p>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Uploading..." : "Upload Document"}
        </Button>
      </form>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#64748B]">Loading...</div>}>
      <UploadForm />
    </Suspense>
  );
}
