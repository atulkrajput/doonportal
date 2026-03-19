'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';
import SectionWrapper from '@/components/ui/SectionWrapper';

interface FounderSectionProps {
  name: string;
  title: string;
  description: string;
  image: string;
}

export default function FounderSection({
  name,
  title,
  description,
  image,
}: FounderSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <SectionWrapper className="bg-neutral-50">
      <div
        ref={ref}
        className="flex flex-col items-center gap-12 lg:flex-row"
      >
        <motion.div
          className="w-full max-w-sm shrink-0"
          initial={{ opacity: 0, x: -30 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Image
            src={image}
            alt={`${name}, ${title}`}
            width={400}
            height={400}
            className="rounded-2xl object-cover"
            loading="lazy"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Meet Our Founder
          </h2>
          <p className="mt-2 text-lg font-medium text-brand-600">
            {name} — {title}
          </p>
          <p className="mt-4 text-lg leading-relaxed text-neutral-600">
            {description}
          </p>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
