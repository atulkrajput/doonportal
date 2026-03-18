'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Button from '@/components/ui/Button';
import SectionWrapper from '@/components/ui/SectionWrapper';

interface CTASectionProps {
  headline: string;
  subheadline?: string;
  ctaButton: { label: string; href: string };
  variant?: 'default' | 'dark' | 'gradient';
}

const variantStyles: Record<string, { wrapper: string; headline: string; subheadline: string }> = {
  default: {
    wrapper: 'bg-white',
    headline: 'text-neutral-900',
    subheadline: 'text-neutral-600',
  },
  dark: {
    wrapper: 'bg-neutral-900',
    headline: 'text-white',
    subheadline: 'text-neutral-300',
  },
  gradient: {
    wrapper: 'bg-gradient-to-r from-brand-600 to-brand-800',
    headline: 'text-white',
    subheadline: 'text-brand-100',
  },
};

export default function CTASection({
  headline,
  subheadline,
  ctaButton,
  variant = 'default',
}: CTASectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const styles = variantStyles[variant];

  return (
    <SectionWrapper className={styles.wrapper}>
      <motion.div
        ref={ref}
        className="text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <h2 className={`text-3xl font-bold tracking-tight sm:text-4xl ${styles.headline}`}>
          {headline}
        </h2>
        {subheadline && (
          <p className={`mx-auto mt-4 max-w-2xl text-lg ${styles.subheadline}`}>
            {subheadline}
          </p>
        )}
        <div className="mt-8">
          <Button
            href={ctaButton.href}
            variant={variant === 'default' ? 'primary' : 'secondary'}
            size="lg"
          >
            {ctaButton.label}
          </Button>
        </div>
      </motion.div>
    </SectionWrapper>
  );
}
