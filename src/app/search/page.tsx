import { Suspense } from "react";
import { EvidenceSearch } from "@/components/EvidenceSearch";

export default function SearchPage() {
  return (
    <div className="page-in">
      <header className="mx-auto mb-10 max-w-3xl pt-6 text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-accent" />
          <span className="eyebrow">Evidence Search</span>
          <span className="h-px w-8 bg-accent" />
        </div>
        <h1 className="text-[36px] font-semibold tracking-tight md:text-[44px]">Search your impact evidence</h1>
        <p className="mt-3 text-[15px] text-muted">Ask questions about your entire media collection.</p>
      </header>
      <Suspense>
        <EvidenceSearch />
      </Suspense>
    </div>
  );
}
