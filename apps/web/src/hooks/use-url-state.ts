import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export function useUrlState(key: string, defaultValue: string = "") {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  // Initialize from URL if present, otherwise defaultValue
  const [state, setState] = useState(() => searchParams.get(key) || defaultValue);

  const setUrlState = useCallback((newValue: string) => {
    setState(newValue);
    
    // Create new params based on current URL params
    const params = new URLSearchParams(searchParams.toString());
    
    // We treat empty string and 'all' as "no filter" to keep URLs clean
    if (newValue && newValue !== 'all') {
      params.set(key, newValue);
    } else {
      params.delete(key);
    }
    
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [key, pathname, router, searchParams]);

  // Sync state if URL changes externally (like back/forward buttons)
  useEffect(() => {
    const value = searchParams.get(key) || defaultValue;
    if (value !== state) {
      setState(value);
    }
  }, [searchParams, key, defaultValue]); // Intentionally excluding `state` to prevent loop

  return [state, setUrlState] as const;
}
