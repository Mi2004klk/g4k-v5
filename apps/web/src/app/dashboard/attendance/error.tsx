"use client";
import Link from "next/link"; import { useEffect } from"react";
import { EmptyState, Button } from"@g4k/ui/components"; export default function Error({ error, reset,
}: { error: Error & { digest?: string }; reset: () => void;
}) { useEffect(() => { console.error(error); }, [error]); return ( <div className="flex h-[80dvh] items-center justify-center p-6"> <EmptyState title="Something went wrong!"  description={error.message || "An unexpected error occurred while loading this page. If this keeps happening, try refreshing the page or contact your administrator."}
    action={      <div className="flex gap-4 mt-6">
        <Button variant="outline" onClick={() => reset()}>Try again</Button>
        <Link href="/dashboard"><Button variant="primary">Go to Dashboard</Button></Link>
      </div> } /> </div> );
}
