'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    const observedElements: Element[] = [];

    // Delay observer setup slightly to guarantee hydration and DOM completion
    const timer = setTimeout(() => {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
              observer?.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '0px 0px -100px 0px',
          threshold: 0.05,
        }
      );

      const elements = document.querySelectorAll('.reveal-on-scroll');
      elements.forEach((el) => {
        if (observer) {
          observer.observe(el);
          observedElements.push(el);
        }
      });
    }, 400);

    return () => {
      clearTimeout(timer);
      if (observer) {
        observedElements.forEach((el) => observer?.unobserve(el));
        observer.disconnect();
      }
    };
  }, [pathname]);

  return null;
}
