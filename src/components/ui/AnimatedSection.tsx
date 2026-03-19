'use client';

import { useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';

interface AnimatedSectionProps {
  children: React.ReactNode;
  variant?: 'fade-in-up' | 'slide-in-left' | 'slide-in-right' | 'scale-in' | 'fade-in';
  delay?: number;
  threshold?: number;
  staggerChildren?: number;
  className?: string;
}

const variantMap: Record<string, Variants> = {
  'fade-in-up': {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  },
  'slide-in-left': {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 },
  },
  'slide-in-right': {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
  },
  'scale-in': {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  },
  'fade-in': {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
};

export default function AnimatedSection({
  children,
  variant = 'fade-in-up',
  delay = 0,
  threshold = 0.2,
  staggerChildren,
  className = '',
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: threshold });

  const selectedVariant = variantMap[variant] ?? variantMap['fade-in-up'];

  const containerVariants: Variants = {
    hidden: selectedVariant.hidden,
    visible: {
      ...selectedVariant.visible,
      transition: {
        duration: 0.5,
        delay,
        ease: 'easeOut',
        ...(staggerChildren != null ? { staggerChildren } : {}),
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={containerVariants}
    >
      {children}
    </motion.div>
  );
}

export { type AnimatedSectionProps };
export { variantMap };

/** Child variants for use with staggerChildren — apply to direct motion.div children */
export const staggerChildVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};
