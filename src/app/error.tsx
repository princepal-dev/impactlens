"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      tone="error"
      icon={AlertTriangle}
      title="This page couldn't be loaded"
      description={`Something went wrong while loading your workspace.${error.digest ? ` Reference: ${error.digest}` : ""}`}
      className="mt-10"
      action={
        <div className="flex gap-2">
          <Button size="sm" variant="primary" onClick={() => retry()}>
            <RotateCcw /> Try again
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <Link href="/">Back to overview</Link>
          </Button>
        </div>
      }
    />
  );
}
