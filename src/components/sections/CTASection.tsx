'use client';

import Button from '@/components/ui/Button';
import SectionWrapper from '@/components/ui/SectionWrapper';
import AnimatedSection from '@/components/ui/AnimatedSection';
import GradientBackground from '@/components/ui/GradientBackground';
import { trackCTAClick } from '@/lib/analytics';

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
    wrapper: '',
    headline: 'text-white',
    subheadline: 'text-brand-100',
  },
};

const ctaGradientColors = ['from-neutral-900', 'via-neutral-800', 'to-neutral-900'];

export default function CTASection({
  headline,
  subheadline,
  ctaButton,
  variant = 'default',
}: CTASectionProps) {
  const styles = variantStyles[variant];

  const content = (
    <div className="text-center">
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
          onClick={() => trackCTAClick(ctaButton.label, 'cta-section')}
        >
          {ctaButton.label}
        </Button>
      </div>
    </div>
  );

  const sectionContent =
    variant === 'gradient' ? (
      <GradientBackground colors={ctaGradientColors} animated={true}>
        <SectionWrapper>{content}</SectionWrapper>
      </GradientBackground>
    ) : (
      <SectionWrapper className={styles.wrapper}>{content}</SectionWrapper>
    );

  return (
    <AnimatedSection variant="fade-in-up">
      {sectionContent}
    </AnimatedSection>
  );
}
