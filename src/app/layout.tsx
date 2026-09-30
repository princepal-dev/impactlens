import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MobileNav, Sidebar } from "@/components/Sidebar";
import { GlowPointer } from "@/components/aceternity/glow-pointer";
import { ThemedToaster } from "@/components/ThemeToggle";
import { VoiceAgent } from "@/components/VoiceAgent";
import { serviceStatus } from "@/lib/config";
import { THEME_INIT_SCRIPT } from "@/lib/theme-script";
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
  const s = serviceStatus();
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full">
        <div className="relative flex min-h-screen">
          <Sidebar online={s.storage.connected && s.ai.connected} />
          <div className="min-w-0 flex-1">
            <MobileNav />
            <main className="print-root w-full px-6 pb-20 pt-8 lg:px-10 lg:pt-10 2xl:px-12">{children}</main>
          </div>
        </div>
        <VoiceAgent />
        <GlowPointer />
        <ThemedToaster />
      </body>
    </html>
  );
}
