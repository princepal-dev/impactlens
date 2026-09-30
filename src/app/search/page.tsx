import { Suspense } from "react";
import { Spotlight } from "@/components/aceternity/spotlight";
import { EvidenceSearch } from "@/components/EvidenceSearch";

export default function SearchPage() {
  return (
    <div className="page-in">
      <header className="relative mx-auto mb-8 max-w-3xl pt-4 text-center">
        <Spotlight className="-top-44 left-0 text-accent md:-left-24" />
        <h1 className="relative bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-[34px] font-semibold tracking-tight text-transparent">Evidence Search</h1>
        <p className="relative mt-1.5 text-[14px] text-muted">Ask a question in plain language — or tap the mic and say it.</p>
      </header>
      <Suspense>
        <EvidenceSearch />
      </Suspense>
    </div>
  );
}
