'use client';

import type { Feature } from '@/types';
import FeatureGrid from '@/components/sections/FeatureGrid';

interface IndustrySectionProps {
  industries: Feature[];
}

export default function IndustrySection({ industries }: IndustrySectionProps) {
  return (
    <FeatureGrid
      features={industries}
      columns={4}
      title="Industries We Serve"
      subtitle="Purpose-built automation platforms for the industries that need them most."
    />
  );
}
