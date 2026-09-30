import { SearchX } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Not found"
      description="This evidence or page doesn't exist. It may have been deleted or moved."
      className="mt-10"
      action={
        <div className="flex gap-2">
          <Button size="sm" variant="primary" asChild>
            <Link href="/media">Open media library</Link>
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <Link href="/">Back to overview</Link>
          </Button>
        </div>
      }
    />
  );
}
