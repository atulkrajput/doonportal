'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export interface HeroAnimationProps {
  children: React.ReactNode;
  gradientColors?: { from: string; via?: string; to: string };
  floatingElements?: boolean;
  parallax?: boolean;
}

const defaultGradient = { from: 'from-brand-600', via: 'via-brand-500', to: 'to-accent-500' };

/** Floating orb configuration */
const orbs = [
  { size: 'w-72 h-72', position: 'top-[10%] left-[5%]', color: 'bg-brand-400/30', delay: '0s', duration: '8s' },
  { size: 'w-96 h-96', position: 'top-[50%] right-[5%]', color: 'bg-accent-400/20', delay: '2s', duration: '10s' },
  { size: 'w-64 h-64', position: 'bottom-[10%] left-[30%]', color: 'bg-brand-300/25', delay: '4s', duration: '12s' },
  { size: 'w-80 h-80', position: 'top-[20%] right-[25%]', color: 'bg-accent-300/20', delay: '1s', duration: '9s' },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    setIsMobile(mql.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

export default function HeroAnimation({
  children,
  gradientColors = defaultGradient,
  floatingElements = true,
  parallax = true,
}: HeroAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, 150]);

  const showFloating = floatingElements && !isMobile;
  const enableParallax = parallax && !isMobile;

  const gradientClasses = [
    gradientColors.from,
    gradientColors.via ?? '',
    gradientColors.to,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Animated gradient background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradientClasses} animate-gradient`}
        aria-hidden="true"
      />

      {/* Floating orb elements */}
      {showFloating &&
        orbs.map((orb, i) =>
          enableParallax ? (
            <motion.div
              key={i}
              className={`absolute ${orb.size} ${orb.position} ${orb.color} rounded-full blur-3xl opacity-60 animate-float-orb pointer-events-none`}
              style={{ y: parallaxY, animationDelay: orb.delay, animationDuration: orb.duration }}
              aria-hidden="true"
            />
          ) : (
            <div
              key={i}
              className={`absolute ${orb.size} ${orb.position} ${orb.color} rounded-full blur-3xl opacity-60 animate-float-orb pointer-events-none`}
              style={{ animationDelay: orb.delay, animationDuration: orb.duration }}
              aria-hidden="true"
            />
          )
        )}

      {/* Children rendered on top */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
