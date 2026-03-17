import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "SoloCare — NDIS Compliance Made Simple",
  description: "Audit-ready NDIS compliance for independent support workers. Upload docs, generate policies, log incidents — done in under an hour.",
  icons: {
    icon: "/solocare_icon.svg",
    apple: "/solocare_icon.svg",
  },
  openGraph: {
    title: "SoloCare — NDIS Compliance Made Simple",
    description: "Audit-ready NDIS compliance for Australian independent support workers. Policies, documents, incidents — sorted in under an hour.",
    url: "https://solocare.com.au",
    siteName: "SoloCare",
    locale: "en_AU",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "SoloCare — NDIS Compliance Made Simple",
    description: "Audit-ready NDIS compliance for Australian independent support workers.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8FAFC] font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
