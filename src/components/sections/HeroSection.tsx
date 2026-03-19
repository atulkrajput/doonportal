'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import SectionWrapper from '@/components/ui/SectionWrapper';
import HeroAnimation from '@/components/sections/HeroAnimation';

interface HeroSectionProps {
  headline: string;
  subheadline: string;
  ctaButtons: { label: string; href: string; variant: 'primary' | 'secondary' }[];
  backgroundVariant?: 'gradient' | 'image' | 'pattern';
  image?: { src: string; alt: string };
}

const backgroundStyles: Record<string, string> = {
  gradient: '',
  image: 'bg-neutral-900 text-white',
  pattern: 'bg-white',
};

/** Framer Motion variants for staggered word entrance */
const headlineContainerVariants = {
  hidden: {},
  visible: (staggerDelay: number) => ({
    transition: {
      staggerChildren: staggerDelay,
    },
  }),
};

const wordVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

const ctaVariants = {
  hidden: { opacity: 0 },
  visible: (delay: number) => ({
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut', delay },
  }),
};

export default function HeroSection({
  headline,
  subheadline,
  ctaButtons,
  backgroundVariant = 'gradient',
  image,
}: HeroSectionProps) {
  const words = headline.split(/\s+/).filter(Boolean);
  const staggerDelay = 0.08;
  const ctaDelay = words.length * staggerDelay + 0.3;

  const content = (
    <SectionWrapper className={backgroundStyles[backgroundVariant]}>
      <div className="flex flex-col items-center gap-12 lg:flex-row lg:justify-between">
        <div className="max-w-2xl text-center lg:text-left">
          <motion.h1
            className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl"
            variants={headlineContainerVariants}
            initial="hidden"
            animate="visible"
            custom={staggerDelay}
            aria-label={headline}
          >
            {words.map((word, i) => (
              <motion.span
                key={i}
                variants={wordVariants}
                style={{ display: 'inline-block' }}
              >
                {word}
                {i < words.length - 1 ? ' ' : ''}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            className="mt-6 text-lg leading-relaxed text-neutral-600 sm:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: words.length * staggerDelay + 0.1 }}
          >
            {subheadline}
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start"
            variants={ctaVariants}
            initial="hidden"
            animate="visible"
            custom={ctaDelay}
          >
            {ctaButtons.map((btn) => (
              <Button key={btn.label} href={btn.href} variant={btn.variant} size="lg">
                {btn.label}
              </Button>
            ))}
          </motion.div>
        </div>

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

  if (backgroundVariant === 'gradient') {
    return <HeroAnimation>{content}</HeroAnimation>;
  }

  return content;
}
