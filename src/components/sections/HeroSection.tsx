'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import SectionWrapper from '@/components/ui/SectionWrapper';

interface HeroSectionProps {
  headline: string;
  subheadline: string;
  ctaButtons: { label: string; href: string; variant: 'primary' | 'secondary' }[];
  backgroundVariant?: 'gradient' | 'image' | 'pattern';
  image?: { src: string; alt: string };
}

const backgroundStyles: Record<string, string> = {
  gradient: 'bg-gradient-to-br from-brand-50 via-white to-brand-100',
  image: 'bg-neutral-900 text-white',
  pattern: 'bg-white',
};

export default function HeroSection({
  headline,
  subheadline,
  ctaButtons,
  backgroundVariant = 'gradient',
  image,
}: HeroSectionProps) {
  return (
    <SectionWrapper className={backgroundStyles[backgroundVariant]}>
      <div className="flex flex-col items-center gap-12 lg:flex-row lg:justify-between">
        <motion.div
          className="max-w-2xl text-center lg:text-left"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
            {headline}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-neutral-600 sm:text-xl">
            {subheadline}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
            {ctaButtons.map((btn) => (
              <Button key={btn.label} href={btn.href} variant={btn.variant} size="lg">
                {btn.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {image && (
          <motion.div
            className="w-full max-w-lg lg:max-w-xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          >
            <Image
              src={image.src}
              alt={image.alt}
              width={600}
              height={400}
              className="rounded-2xl"
              priority
            />
          </motion.div>
        )}
      </div>
    </SectionWrapper>
  );
}
