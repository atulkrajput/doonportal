'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';
import SectionWrapper from '@/components/ui/SectionWrapper';

interface ScreenshotsSectionProps {
  screenshots: { src: string; alt: string; caption?: string }[];
}

export default function ScreenshotsSection({ screenshots }: ScreenshotsSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <SectionWrapper className="bg-neutral-50">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          Product Screenshots
        </h2>
      </div>

      <div ref={ref} className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {screenshots.map((screenshot, index) => (
          <motion.figure
            key={screenshot.src}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
            className="overflow-hidden rounded-2xl bg-white shadow-card"
          >
            <Image
              src={screenshot.src}
              alt={screenshot.alt}
              width={600}
              height={400}
              className="h-auto w-full object-cover"
              loading="lazy"
            />
            {screenshot.caption && (
              <figcaption className="p-4 text-center text-sm text-neutral-600">
                {screenshot.caption}
              </figcaption>
            )}
          </motion.figure>
        ))}
      </div>
    </SectionWrapper>
  );
}
