"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderLock, FileText, AlertTriangle, LogOut, Settings, Users, NotebookPen, Clock, ClipboardCheck, FileSpreadsheet, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vault", label: "Compliance Vault", icon: FolderLock },
  { href: "/policies", label: "Policies", icon: FileText },
  { href: "/my-compliance", label: "My Credentials", icon: ShieldCheck },
  { href: "/audit", label: "Audit Report", icon: ClipboardCheck },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/participants", label: "Participants", icon: Users },
  { href: "/notes", label: "Progress Notes", icon: NotebookPen },
  { href: "/shifts", label: "Shifts", icon: Clock },
  { href: "/invoices", label: "Invoices", icon: FileSpreadsheet },
  { href: "/checklist", label: "NDIS Checklist", icon: ClipboardCheck },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="hidden md:flex flex-col w-56 lg:w-60 min-h-screen bg-[#1E3A5F] text-white shrink-0">
      <div className="px-4 py-1 border-b border-white/10 bg-white">
        <Image src="/solocare_lockup.svg" alt="SoloCare" width={180} height={60} className="h-10 w-auto" priority />
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150",
                active
                  ? "bg-white/15 text-white shadow-sm shadow-black/10"
                  : "text-blue-100/60 hover:bg-white/8 hover:text-white"
              )}
            >
              <Icon className={cn("h-[18px] w-[18px]", active && "text-[#EA7C3C]")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-white/10">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium text-blue-100/50 hover:bg-white/8 hover:text-white transition-colors w-full"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
