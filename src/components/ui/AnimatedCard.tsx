'use client';

import { useEffect, useState } from 'react';

export interface AnimatedCardProps {
  children: React.ReactNode;
  hover?: boolean;
  glassmorphism?: boolean;
  className?: string;
}

export default function AnimatedCard({
  children,
  hover = true,
  glassmorphism = false,
  className = '',
}: AnimatedCardProps) {
  const [canHover, setCanHover] = useState(true);

  useEffect(() => {
    // Detect if the device supports hover (non-touch)
    const mq = window.matchMedia('(hover: hover)');
    setCanHover(mq.matches);
    const handler = (e: MediaQueryListEvent) => setCanHover(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const base = 'rounded-2xl p-6 transition-all duration-200';

  const bgBorder = glassmorphism
    ? 'bg-white/70 backdrop-blur-lg border border-white/20'
    : 'bg-white shadow-soft border border-neutral-200';

  // Only apply hover scale/shadow/border effects on devices that support hover
  const hoverStyles = hover && canHover
    ? 'hover:scale-[1.02] hover:shadow-elevated hover:border-brand-400'
    : '';

  return (
    <div className={`${base} ${bgBorder} ${hoverStyles} ${className}`}>
      {children}
    </div>
  );
}
