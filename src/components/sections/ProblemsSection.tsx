'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import SectionWrapper from '@/components/ui/SectionWrapper';
import Card from '@/components/ui/Card';

interface ProblemsSectionProps {
  problems: { title: string; description: string }[];
}

export default function ProblemsSection({ problems }: ProblemsSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <SectionWrapper>
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          The Challenges
        </h2>
        <p className="mt-4 text-lg text-neutral-600">
          Common problems that businesses face without the right tools.
        </p>
      </div>

      <div ref={ref} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {problems.map((problem, index) => (
          <motion.div
            key={problem.title}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
          >
            <Card className="h-full border border-red-100 bg-red-50/50">
              <div className="text-2xl text-red-500">⚠️</div>
              <h3 className="mt-3 text-lg font-semibold text-neutral-900">
                {problem.title}
              </h3>
              <p className="mt-2 text-neutral-600">{problem.description}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}
