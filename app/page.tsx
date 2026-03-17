import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CheckCircle, FileText, AlertCircle, ArrowRight, FolderLock, LayoutDashboard, Clock, Download } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/">
            <Image src="/solocare_lockup.svg" alt="SoloCare" width={160} height={53} className="h-9 w-auto" priority />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-slate-500 text-sm hidden sm:inline-flex">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="text-sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — editorial, not SaaS template */}
      <section className="relative overflow-hidden">
        {/* Angled background */}
        <div className="absolute inset-0 bg-[#1E3A5F]" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-white" style={{ clipPath: "polygon(0 100%, 100% 100%, 100% 0)" }} />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-32 sm:pb-40">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-6">
              <span className="h-px w-8 bg-[#EA7C3C]" />
              <span className="text-[#EA7C3C] text-xs font-semibold tracking-widest uppercase">New NDIS rules 2026</span>
            </div>

            <h1 className="font-heading text-[2rem] sm:text-[2.75rem] lg:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-5">
              Your NDIS audit<br />
              <span className="text-[#EA7C3C]">shouldn&apos;t keep you<br className="sm:hidden" /> up at night.</span>
            </h1>

            <p className="text-blue-100/80 text-base sm:text-lg leading-relaxed mb-8 max-w-md">
              SoloCare gets independent support workers audit-ready in under an hour. Documents, policies, incidents — all sorted.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-3 mb-6">
              <Link href="/signup">
                <Button size="lg" className="bg-[#EA7C3C] hover:bg-[#D66A2E] text-white font-semibold px-7 w-full sm:w-auto transition-all hover:shadow-lg hover:shadow-[#EA7C3C]/20">
                  Get started — $29/mo
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link href="/login" className="sm:pt-2.5">
                <span className="text-blue-200/60 text-sm link-underline cursor-pointer">or sign in</span>
              </Link>
            </div>

            <p className="text-blue-200/40 text-xs">30-day money-back guarantee · Cancel anytime.</p>
          </div>

          {/* Floating stat badges — adds visual interest */}
          <div className="hidden lg:block absolute right-12 top-24 space-y-4">
            <div className="card-elevated px-4 py-3 flex items-center gap-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700">Audit Ready</p>
                <p className="text-[11px] text-slate-400">All 4 policies generated</p>
              </div>
            </div>
            <div className="card-elevated px-4 py-3 flex items-center gap-3 ml-8 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                <FolderLock className="h-5 w-5 text-[#1E3A5F]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700">3 documents</p>
                <p className="text-[11px] text-slate-400">All valid, none expiring</p>
              </div>
            </div>
            <div className="card-elevated px-4 py-3 flex items-center gap-3 animate-fade-in" style={{ animationDelay: "0.6s" }}>
              <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700">Setup time</p>
                <p className="text-[11px] text-slate-400">Under 1 hour</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem — editorial with left border accent */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="sm:flex sm:gap-16 items-start">
            <div className="sm:w-2/5 mb-8 sm:mb-0 sm:sticky sm:top-24">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-px w-6 bg-[#EA7C3C]" />
                <span className="text-[#EA7C3C] text-xs font-semibold tracking-widest uppercase">The problem</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#0F172A] leading-tight">
                150,000 solo workers.<br />
                <span className="text-slate-400">Zero idea where to start.</span>
              </h2>
            </div>
            <div className="sm:w-3/5">
              <div className="border-l-2 border-slate-200 pl-6 space-y-6">
                <p className="text-slate-600 leading-relaxed">
                  The government is making NDIS registration mandatory for all providers. That means compliance audits, policy documents, incident tracking, document storage — the kind of stuff enterprise tools charge $300/mo for.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  You don&apos;t need enterprise software. You&apos;re one person running a support business from your phone. You need something simple that gets the job done.
                </p>
                <div className="bg-[#FEF3EB] border border-[#EA7C3C]/20 rounded-lg px-5 py-4">
                  <p className="text-sm text-[#0F172A] font-medium">
                    &ldquo;I just want to know I&apos;ll pass my audit. I don&apos;t want to spend weeks figuring out compliance software.&rdquo;
                  </p>
                  <p className="text-xs text-slate-500 mt-2">— Every solo NDIS worker we talked to</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features — staggered, not a grid of identical cards */}
      <section className="py-16 sm:py-24 px-4 bg-slate-50/70 border-y border-slate-100 texture-noise">
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-px w-6 bg-[#EA7C3C]" />
            <span className="text-[#EA7C3C] text-xs font-semibold tracking-widest uppercase">What you get</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#0F172A] mb-12">
            Four tools. One subscription.
          </h2>

          <div className="space-y-4">
            {/* Feature rows — alternating layout for visual rhythm */}
            {[
              {
                icon: <FolderLock className="h-5 w-5" />,
                iconBg: "bg-[#1E3A5F]/10 text-[#1E3A5F]",
                title: "Compliance Vault",
                desc: "Upload Worker Screening, Police Check, First Aid and Insurance. Set expiry dates — we warn you 30 days before anything lapses.",
                detail: "PDF, JPG, PNG supported · Max 10MB per file",
              },
              {
                icon: <FileText className="h-5 w-5" />,
                iconBg: "bg-[#EA7C3C]/10 text-[#EA7C3C]",
                title: "Policy Generator",
                desc: "All 4 mandatory NDIS policies generated in seconds. Personalised with your business name, ABN, state and contact details.",
                detail: "Incident Management · Complaints · Risk · Code of Conduct",
              },
              {
                icon: <AlertCircle className="h-5 w-5" />,
                iconBg: "bg-amber-100 text-amber-700",
                title: "Incident Reporter",
                desc: "Log incidents in the exact format the NDIS Commission expects. Download PDF reports instantly, ready to submit.",
                detail: "Tracks 24-hour mandatory reporting window",
              },
              {
                icon: <LayoutDashboard className="h-5 w-5" />,
                iconBg: "bg-emerald-100 text-emerald-700",
                title: "Audit Dashboard",
                desc: "One screen that tells you if you're audit-ready. Green means go. Red tells you exactly what's missing and how to fix it.",
                detail: "Real-time compliance scoring",
              },
            ].map((f, i) => (
              <div key={i} className="card-elevated flex flex-col sm:flex-row items-start gap-4 p-5 sm:p-6">
                <div className={`${f.iconBg} p-2.5 rounded-lg shrink-0`}>
                  {f.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#0F172A] mb-1">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-1.5">{f.desc}</p>
                  <p className="text-xs text-slate-400">{f.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — with connecting line */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-px w-6 bg-[#EA7C3C]" />
            <span className="text-[#EA7C3C] text-xs font-semibold tracking-widest uppercase">How it works</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#0F172A] mb-12">
            Audit-ready in three steps.
          </h2>

          <div className="grid sm:grid-cols-3 gap-8 sm:gap-6 relative">
            {/* Connecting line on desktop */}
            <div className="hidden sm:block absolute top-6 left-[16.67%] right-[16.67%] h-px bg-slate-200" />

            {[
              { n: "01", title: "Upload your docs", desc: "Worker Screening, Police Check, Insurance — drop them in, set expiry dates. Five minutes tops." },
              { n: "02", title: "Generate policies", desc: "One button. All four mandatory NDIS policies, personalised with your details. Thirty seconds." },
              { n: "03", title: "Stay on top of it", desc: "Dashboard tracks everything. Log incidents as they happen. Alerts before documents expire." },
            ].map((step) => (
              <div key={step.n} className="relative">
                <div className="w-12 h-12 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-sm font-heading font-bold mb-4 relative z-10">
                  {step.n}
                </div>
                <h3 className="font-semibold text-[#0F172A] mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing — asymmetric layout */}
      <section className="py-16 sm:py-24 px-4 bg-[#1E3A5F] texture-noise">
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="sm:flex sm:items-start sm:justify-between sm:gap-16">
            <div className="mb-10 sm:mb-0 sm:max-w-sm sm:pt-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-px w-6 bg-[#EA7C3C]" />
                <span className="text-[#EA7C3C] text-xs font-semibold tracking-widest uppercase">Pricing</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-4">
                One plan.<br />
                No surprises.
              </h2>
              <p className="text-blue-100/60 text-sm leading-relaxed">
                Everything included. No tiers, no upsells, no &ldquo;contact sales&rdquo;. Built for solo operators who want to get compliant and move on with their lives.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 sm:p-8 flex-1 max-w-md shadow-xl shadow-black/10">
              <div className="flex items-baseline gap-3 mb-1">
                <div>
                  <span className="font-heading text-4xl font-bold text-[#0F172A]">$29</span>
                  <span className="text-slate-400 text-sm">/mo</span>
                </div>
                <div className="text-slate-300 text-sm">or</div>
                <div>
                  <span className="font-heading text-2xl font-bold text-[#0F172A]">$249</span>
                  <span className="text-slate-400 text-sm">/yr</span>
                  <span className="ml-1.5 text-xs bg-[#EA7C3C]/10 text-[#EA7C3C] font-semibold px-1.5 py-0.5 rounded">SAVE 28%</span>
                </div>
              </div>
              <p className="text-slate-400 text-xs mb-6">30-day money-back guarantee · Cancel anytime</p>

              <div className="space-y-3 mb-8">
                {[
                  { icon: <FolderLock className="h-3.5 w-3.5" />, text: "Compliance Vault — unlimited documents" },
                  { icon: <FileText className="h-3.5 w-3.5" />, text: "All 4 NDIS policies, AI-generated" },
                  { icon: <AlertCircle className="h-3.5 w-3.5" />, text: "Incident reporting + PDF export" },
                  { icon: <LayoutDashboard className="h-3.5 w-3.5" />, text: "Audit-ready dashboard" },
                  { icon: <Clock className="h-3.5 w-3.5" />, text: "Expiry alerts before docs lapse" },
                  { icon: <Download className="h-3.5 w-3.5" />, text: "Download everything as PDF" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-[#0F172A]">
                    <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center shrink-0 text-emerald-600 mt-0.5">
                      {item.icon}
                    </div>
                    {item.text}
                  </div>
                ))}
              </div>

              <Link href="/signup" className="block">
                <Button className="w-full bg-[#EA7C3C] hover:bg-[#D66A2E] transition-all hover:shadow-lg hover:shadow-[#EA7C3C]/20" size="lg">
                  Get started
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <Image src="/solocare_lockup.svg" alt="SoloCare" width={120} height={40} className="h-7 w-auto" />
          <p className="text-xs text-slate-400">Built in Adelaide for Australian NDIS workers · &copy; 2026</p>
        </div>
      </footer>
    </div>
  );
}
