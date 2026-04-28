import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile(containerRef?: React.RefObject<HTMLElement | null>) {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useLayoutEffect(() => {
    if (containerRef !== undefined) {
      const el = containerRef.current;
      if (!el) return;
      const observer = new ResizeObserver((entries) => {
        setIsMobile(entries[0].contentRect.width < MOBILE_BREAKPOINT);
      });
      observer.observe(el);
      setIsMobile(el.offsetWidth < MOBILE_BREAKPOINT);
      return () => observer.disconnect();
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}
