"use client";
import { usePathname } from "next/navigation";
import { Shield, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/vault": "Compliance Vault",
  "/vault/upload": "Upload Document",
  "/policies": "Policies",
  "/incidents": "Incidents",
  "/incidents/new": "Log Incident",
  "/onboarding": "Setup",
};

export function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const title = PAGE_TITLES[pathname] || Object.entries(PAGE_TITLES).find(
    ([path]) => pathname.startsWith(path + "/")
  )?.[1] || "SoloCare";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="md:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="flex items-center justify-between px-4 h-12">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#EA7C3C]" />
          <span className="text-sm font-semibold text-[#0F172A] font-heading">{title}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="p-2 -mr-2 text-slate-300 active:text-slate-500 touch-target flex items-center justify-center"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
