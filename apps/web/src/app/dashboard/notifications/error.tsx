"use client"; import { useEffect } from"react";
import { EmptyState, Button } from"@g4k/ui/components"; export default function Error({ error, reset,
}: { error: Error & { digest?: string }; reset: () => void;
}) { useEffect(() => { console.error(error); }, [error]); return ( <div className="flex h-[80vh] items-center justify-center p-6"> <EmptyState title="Something went wrong!" description={error.message ||"An unexpected error occurred while loading this page."} action={ <Button onClick={() => reset()} variant="outline"> Try again </Button> } /> </div> );
}
