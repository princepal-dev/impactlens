import { Suspense } from "react";
import { EvidenceSearch } from "@/components/EvidenceSearch";

export default function SearchPage() {
  return (
    <div className="page-in">
      <header className="mx-auto mb-8 max-w-3xl pt-4 text-center">
        <h1 className="text-[28px] font-semibold tracking-tight">Evidence Search</h1>
        <p className="mt-1.5 text-[14px] text-muted">Ask a question in plain language to search your entire media collection.</p>
      </header>
      <Suspense>
        <EvidenceSearch />
      </Suspense>
    </div>
  );
}
