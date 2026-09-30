import { Suspense } from "react";
import { EvidenceSearch } from "@/components/EvidenceSearch";

export default function SearchPage() {
  return (
    <div className="page-in">
      <Suspense>
        <EvidenceSearch />
      </Suspense>
    </div>
  );
}
