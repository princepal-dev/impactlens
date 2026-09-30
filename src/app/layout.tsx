import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { MobileNav, Sidebar } from "@/components/Sidebar";
import { SetupBanner } from "@/components/SetupBanner";
import { setupStatus } from "@/lib/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ImpactLens — Impact & sustainability media intelligence",
  description: "From field media to measurable impact. AI-powered media intelligence for organizations building a more sustainable world.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const s = setupStatus();
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="no-print pointer-events-none fixed inset-0 bg-grid" />
        <div className="no-print pointer-events-none fixed inset-0 glow-bottom" />
        <div className="relative flex min-h-screen">
          <Sidebar status={{ ready: s.ready, cloudinary: s.cloudinary.mode, ai: s.ai.provider }} />
          <div className="min-w-0 flex-1">
            <MobileNav />
            <main className="print-root mx-auto w-full max-w-[1280px] px-6 pb-20 pt-8 lg:px-10 lg:pt-10">
              {!s.ready && <SetupBanner missing={s.missing} />}
              {children}
            </main>
          </div>
        </div>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: { background: "#111", border: "1px solid rgba(255,255,255,0.1)", color: "#f5f5f4", borderRadius: 8 },
          }}
        />
      </body>
    </html>
  );
}
