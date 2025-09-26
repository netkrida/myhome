"use client";

import { useEffect } from "react";

/**
 * HydrationFix component to prevent hydration mismatches
 * This component handles client-side only operations that might cause hydration issues
 */
export function HydrationFix() {
  useEffect(() => {
    // Ensure body cursor style is consistent
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'auto';
      
      // Prevent browser extensions from causing hydration mismatches
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const target = mutation.target as HTMLElement;
            if (target === document.body && target.style.cursor !== 'auto') {
              target.style.cursor = 'auto';
            }
          }
        });
      });

      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['style']
      });

      return () => observer.disconnect();
    }
  }, []);

  return null;
}
