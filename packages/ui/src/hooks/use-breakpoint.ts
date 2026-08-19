import { useState, useEffect } from 'react';

export function useBreakpoint() {
  const [breakpoints, setBreakpoints] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkBreakpoints = () => {
      const width = window.innerWidth;
      setBreakpoints({
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
        isDesktop: width >= 1024,
      });
    };

    // Initial check
    checkBreakpoints();

    // Debounce the resize event for performance
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkBreakpoints, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return breakpoints;
}
