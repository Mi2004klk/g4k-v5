import { useState, useCallback, useRef, useEffect } from 'react';

type WorkerFunction<T, R> = (input: T) => R;

/**
 * Creates an inline web worker to offload heavy calculations from the main thread.
 * Ensure the passed function doesn't rely on closures or external scope.
 */
export function useWorker<T, R>(workerFn: WorkerFunction<T, R>) {
  const [result, setResult] = useState<R | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    // Generate inline worker Blob URL
    const code = `
      self.onmessage = function(e) {
        const result = (${workerFn.toString()})(e.data);
        self.postMessage(result);
      }
    `;
    const blob = new Blob([code], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    urlRef.current = workerUrl;

    workerRef.current = new Worker(workerUrl);

    workerRef.current.onmessage = (e: MessageEvent<R>) => {
      setResult(e.data);
      setIsProcessing(false);
    };

    workerRef.current.onerror = (e) => {
      setError(new Error(e.message));
      setIsProcessing(false);
    };

    return () => {
      // Cleanup on unmount
      workerRef.current?.terminate();
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
      }
    };
  }, [workerFn]);

  const processData = useCallback((data: T) => {
    if (workerRef.current) {
      setIsProcessing(true);
      setError(null);
      workerRef.current.postMessage(data);
    }
  }, []);

  return { processData, result, isProcessing, error };
}
