import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IncidentForm } from "@/components/incidents/IncidentForm";

export default function NewIncidentPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/incidents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] font-heading">Log Incident</h1>
          <p className="text-sm text-[#64748B] mt-0.5">NDIS-compliant incident report</p>
        </div>
      </div>
      <IncidentForm />
    </div>
  );
}
