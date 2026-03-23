'use client';

import { useEffect, useState } from 'react';

export default function BlogContent({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setProgress(Math.min(100, (scrollTop / docHeight) * 100));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Reading progress"
        />
      </div>
      {children}
    </>
  );
}
