import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { Feature } from '@/types';

// Mock framer-motion to render plain elements and capture props
const mockUseInView = vi.fn(() => true);

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, custom, ...rest }: { children?: React.ReactNode; className?: string; custom?: unknown; [key: string]: unknown }) => {
      const safeProps: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(rest)) {
        if (
          typeof value !== 'object' &&
          typeof value !== 'function' &&
          !['initial', 'animate', 'exit', 'variants', 'whileHover', 'whileTap', 'transition'].includes(key)
        ) {
          safeProps[key] = value;
        }
      }
      return (
        <div className={className} data-custom={custom !== undefined ? String(custom) : undefined} {...safeProps}>
          {children}
        </div>
      );
    },
  },
  useInView: (...args: unknown[]) => mockUseInView(...args),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import FeatureGrid from '@/components/sections/FeatureGrid';

const sampleFeatures: Feature[] = [
  { icon: '🏫', title: 'School Management', description: 'Complete school ERP solution' },
  { icon: '📦', title: 'Inventory POS', description: 'Retail inventory management' },
  { icon: '🐄', title: 'Dairy Management', description: 'Dairy farm automation' },
];

describe('FeatureGrid Enhanced', () => {
  it('renders all feature items', () => {
    render(<FeatureGrid features={sampleFeatures} />);
    expect(screen.getByText('School Management')).toBeInTheDocument();
    expect(screen.getByText('Inventory POS')).toBeInTheDocument();
    expect(screen.getByText('Dairy Management')).toBeInTheDocument();
  });

  it('renders feature icons, titles, and descriptions', () => {
    render(<FeatureGrid features={sampleFeatures} />);
    sampleFeatures.forEach((feature) => {
      expect(screen.getByText(feature.icon)).toBeInTheDocument();
      expect(screen.getByText(feature.title)).toBeInTheDocument();
      expect(screen.getByText(feature.description)).toBeInTheDocument();
    });
  });

  it('applies hover highlight classes when hoverHighlight=true', () => {
    const { container } = render(
      <FeatureGrid features={sampleFeatures} hoverHighlight />
    );
    // Cards with hover highlight should have elevated shadow and brand bg tint on hover
    const cards = container.querySelectorAll('.hover\\:shadow-elevated');
    expect(cards.length).toBe(sampleFeatures.length);

    const brandBgCards = container.querySelectorAll('.hover\\:bg-brand-50');
    expect(brandBgCards.length).toBe(sampleFeatures.length);
  });

  it('applies transition-all duration-200 when hoverHighlight=true', () => {
    const { container } = render(
      <FeatureGrid features={sampleFeatures} hoverHighlight />
    );
    const transitionCards = container.querySelectorAll('.transition-all.duration-200');
    expect(transitionCards.length).toBe(sampleFeatures.length);
  });

  it('does not apply hover highlight classes when hoverHighlight=false (default)', () => {
    const { container } = render(
      <FeatureGrid features={sampleFeatures} />
    );
    const hoverCards = container.querySelectorAll('.hover\\:shadow-elevated');
    expect(hoverCards.length).toBe(0);
  });

  it('uses custom staggerDelay value', () => {
    const { container } = render(
      <FeatureGrid features={sampleFeatures} staggerDelay={0.2} />
    );
    // The container motion.div should receive custom={0.2} for stagger
    const gridContainer = container.querySelector('[data-custom="0.2"]');
    expect(gridContainer).toBeInTheDocument();
  });

  it('uses default staggerDelay of 0.1', () => {
    const { container } = render(
      <FeatureGrid features={sampleFeatures} />
    );
    const gridContainer = container.querySelector('[data-custom="0.1"]');
    expect(gridContainer).toBeInTheDocument();
  });

  it('renders title and subtitle when provided', () => {
    render(
      <FeatureGrid
        features={sampleFeatures}
        title="Our Features"
        subtitle="What we offer"
      />
    );
    expect(screen.getByText('Our Features')).toBeInTheDocument();
    expect(screen.getByText('What we offer')).toBeInTheDocument();
  });

  it('does not render title section when no title or subtitle', () => {
    const { container } = render(
      <FeatureGrid features={sampleFeatures} />
    );
    const titleSection = container.querySelector('.mb-12.text-center');
    expect(titleSection).toBeNull();
  });

  it('renders correct number of grid columns for columns=2', () => {
    const { container } = render(
      <FeatureGrid features={sampleFeatures} columns={2} />
    );
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('sm:grid-cols-2');
  });

  it('renders correct number of grid columns for columns=4', () => {
    const { container } = render(
      <FeatureGrid features={sampleFeatures} columns={4} />
    );
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('lg:grid-cols-4');
  });

  it('renders icon elements with hover translate-y animation', () => {
    const { container } = render(
      <FeatureGrid features={sampleFeatures} />
    );
    const iconElements = container.querySelectorAll('.hover\\:-translate-y-0\\.5');
    expect(iconElements.length).toBe(sampleFeatures.length);
  });

  it('renders with empty features array without error', () => {
    const { container } = render(
      <FeatureGrid features={[]} />
    );
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid?.children.length).toBe(0);
  });
});
