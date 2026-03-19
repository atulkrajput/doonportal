'use client';

import { motion, useInView, Variants } from 'framer-motion';
import { useRef } from 'react';
import type { Feature } from '@/types';
import SectionWrapper from '@/components/ui/SectionWrapper';
import Card from '@/components/ui/Card';

interface FeatureGridProps {
  features: Feature[];
  columns?: 2 | 3 | 4;
  title?: string;
  subtitle?: string;
  hoverHighlight?: boolean;
  staggerDelay?: number;
}

const columnClasses: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

const containerVariants: Variants = {
  hidden: {},
  visible: (staggerDelay: number) => ({
    transition: {
      staggerChildren: staggerDelay,
    },
  }),
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const iconVariants: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export default function FeatureGrid({
  features,
  columns = 3,
  title,
  subtitle,
  hoverHighlight = false,
  staggerDelay = 0.1,
}: FeatureGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const hoverClasses = hoverHighlight
    ? 'hover:shadow-elevated hover:bg-brand-50 transition-all duration-200'
    : '';

  return (
    <SectionWrapper>
      {(title || subtitle) && (
        <div className="mb-12 text-center">
          {title && (
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-4 text-lg text-neutral-600">{subtitle}</p>
          )}
        </div>
      )}

      <motion.div
        ref={ref}
        className={`grid gap-6 ${columnClasses[columns]}`}
        variants={containerVariants}
        custom={staggerDelay}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
      >
        {features.map((feature) => (
          <motion.div key={feature.title} variants={itemVariants}>
            <Card className={`h-full ${hoverClasses}`}>
              <motion.div className="text-3xl hover:-translate-y-0.5 transition-transform duration-200" variants={iconVariants}>
                {feature.icon}
              </motion.div>
              <h3 className="mt-4 text-lg font-semibold text-neutral-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-neutral-600">{feature.description}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </SectionWrapper>
  );
}
