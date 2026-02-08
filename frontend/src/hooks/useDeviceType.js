import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

const useDeviceType = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < MOBILE_BREAKPOINT;
    }
    return false;
  });

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    const handler = (e) => setIsMobile(e.matches);
    
    // Set initial value
    setIsMobile(mql.matches);
    
    // Listen for changes
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return { isMobile, isDesktop: !isMobile };
};

export default useDeviceType;
