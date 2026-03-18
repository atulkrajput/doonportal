'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import SectionWrapper from '@/components/ui/SectionWrapper';

interface SolutionSectionProps {
  solution: { title: string; description: string };
}

export default function SolutionSection({ solution }: SolutionSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <SectionWrapper className="bg-brand-50">
      <motion.div
        ref={ref}
        className="mx-auto max-w-3xl text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          {solution.title}
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-neutral-600">
          {solution.description}
        </p>
      </motion.div>
    </SectionWrapper>
  );
}
