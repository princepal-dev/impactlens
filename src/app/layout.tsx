import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Sidebar } from "@/components/Sidebar";
import { ThemedToaster } from "@/components/ThemeToggle";
import { VoiceAgentLoader } from "@/components/VoiceAgentLoader";
import { workspaceSummary } from "@/lib/store";
import { THEME_INIT_SCRIPT } from "@/lib/theme-script";
import type { WorkspaceSummary } from "@/lib/types";
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

const EMPTY: WorkspaceSummary = { assets: 0, reports: 0, projects: 0, projectList: [] };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const summary = await workspaceSummary().catch(() => EMPTY);
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full">
        <AppHeader />
        <div className="flex items-start gap-5 px-4 pb-20 pt-5 lg:px-6">
          <Suspense fallback={<div className="w-[248px] shrink-0 max-lg:hidden" />}>
            <Sidebar initial={summary} />
          </Suspense>
          <main className="print-root min-w-0 flex-1">{children}</main>
        </div>
        <VoiceAgentLoader />
        <ThemedToaster />
      </body>
    </html>
  );
}
