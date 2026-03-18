import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — SoloCare",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b border-slate-100 bg-white">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/">
            <Image src="/solocare_lockup.svg" alt="SoloCare" width={140} height={46} className="h-8 w-auto" />
          </Link>
          <Link href="/login" className="text-sm text-slate-500 hover:text-slate-700">Sign in</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-[#0F172A] font-heading mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-400 mb-10">Last updated: March 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-sm leading-relaxed text-slate-600">

          <section>
            <h2 className="text-base font-semibold text-[#0F172A] mb-3">1. Who we are</h2>
            <p>SoloCare is operated by Lumen ADL ABN [INSERT ABN], Adelaide, South Australia. We are subject to the Australian Privacy Act 1988 and the Australian Privacy Principles (APPs).</p>
            <p className="mt-2">If you have any privacy questions, contact us at <a href="mailto:privacy@solocare.au" className="text-[#1E3A5F] hover:underline">privacy@solocare.au</a>.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#0F172A] mb-3">2. What information we collect</h2>
            <p><strong className="text-[#0F172A]">Account information:</strong> Your email address and password (or Google account if you sign in with Google).</p>
            <p className="mt-2"><strong className="text-[#0F172A]">Business profile:</strong> Business name, ABN, trading state, contact name, and phone number. This is used to personalise your generated policies.</p>
            <p className="mt-2"><strong className="text-[#0F172A]">Compliance documents:</strong> File names, expiry dates, and document types for files you upload to the vault. Files are stored in Supabase (Sydney region).</p>
            <p className="mt-2"><strong className="text-[#0F172A]">Participant records:</strong> Names, NDIS numbers, plan dates, and any notes or shift data you enter for your participants.</p>
            <p className="mt-2"><strong className="text-[#0F172A]">Usage data:</strong> Standard server logs (IP address, browser type, pages visited) used for security and debugging. Not used for advertising.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#0F172A] mb-3">3. How we use your information</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To provide and operate the SoloCare service</li>
              <li>To generate personalised NDIS policy documents</li>
              <li>To send document expiry reminder emails</li>
              <li>To process payments via Stripe</li>
              <li>To respond to support requests</li>
              <li>To improve the product (using anonymised, aggregated data only)</li>
            </ul>
            <p className="mt-3">We do not use your data for advertising. We do not sell your data. We do not use your data to train AI models.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#0F172A] mb-3">4. Who we share data with</h2>
            <p>We use a small number of trusted third-party services to operate SoloCare:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong className="text-[#0F172A]">Supabase</strong> — database and file storage (Sydney, Australia)</li>
              <li><strong className="text-[#0F172A]">Stripe</strong> — payment processing (your card details go directly to Stripe; we never see them)</li>
              <li><strong className="text-[#0F172A]">Resend</strong> — transactional email delivery</li>
              <li><strong className="text-[#0F172A]">Anthropic</strong> — AI policy generation (your business name, ABN, and state are sent to generate policies; not stored by Anthropic)</li>
              <li><strong className="text-[#0F172A]">Vercel</strong> — application hosting</li>
            </ul>
            <p className="mt-3">We do not share your data with any other third parties without your consent, unless required by law.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#0F172A] mb-3">5. Participant data</h2>
            <p>Participant information (names, NDIS numbers, progress notes) is sensitive personal information. We store it securely and only use it to provide the service to you.</p>
            <p className="mt-2">You are the controller of your participants' data. You are responsible for ensuring you have appropriate consent and authority to store participant information in SoloCare, consistent with the NDIS Practice Standards and the Privacy Act.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#0F172A] mb-3">6. Data security</h2>
            <p>All data is encrypted in transit (TLS) and at rest. Access to the database is restricted and logged. We use Row Level Security in Supabase so your data is only accessible to your account.</p>
            <p className="mt-2">Despite these measures, no system is 100% secure. If you believe your account has been compromised, contact us immediately at <a href="mailto:security@solocare.au" className="text-[#1E3A5F] hover:underline">security@solocare.au</a>.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#0F172A] mb-3">7. Data retention and deletion</h2>
            <p>Your data is retained for as long as your account is active. If you cancel your account, your data is retained for 30 days so you can export it, then permanently deleted.</p>
            <p className="mt-2">To request deletion of your account and data, email <a href="mailto:privacy@solocare.au" className="text-[#1E3A5F] hover:underline">privacy@solocare.au</a>.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#0F172A] mb-3">8. Your rights</h2>
            <p>Under the Australian Privacy Act, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Access the personal information we hold about you</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Complain to the Office of the Australian Information Commissioner (OAIC) if you believe we've mishandled your data</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, email <a href="mailto:privacy@solocare.au" className="text-[#1E3A5F] hover:underline">privacy@solocare.au</a>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#0F172A] mb-3">9. Cookies</h2>
            <p>SoloCare uses session cookies to keep you logged in. We do not use advertising cookies or tracking pixels. We do not use Google Analytics or similar analytics services.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#0F172A] mb-3">10. Changes to this policy</h2>
            <p>We may update this policy. We will notify you by email at least 14 days before material changes take effect.</p>
          </section>

        </div>
      </main>

      <footer className="border-t border-slate-100 py-8 px-4 mt-12">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <Image src="/solocare_lockup.svg" alt="SoloCare" width={100} height={33} className="h-6 w-auto" />
          <div className="flex gap-4 text-xs text-slate-400">
            <Link href="/privacy" className="hover:text-slate-600">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-600">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
