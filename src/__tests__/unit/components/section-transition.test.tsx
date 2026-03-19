import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SectionTransition from '@/components/ui/SectionTransition';

describe('SectionTransition', () => {
  describe('default behavior', () => {
    it('renders gradient-fade variant by default', () => {
      const { container } = render(<SectionTransition />);
      const el = container.firstChild as HTMLElement;
      expect(el.tagName).toBe('DIV');
      expect(el).toHaveClass('bg-gradient-to-b');
    });

    it('uses brand-50 and white as default colors for gradient-fade', () => {
      const { container } = render(<SectionTransition />);
      const el = container.firstChild as HTMLElement;
      expect(el).toHaveClass('from-brand-50', 'to-white');
    });

    it('applies aria-hidden="true" for accessibility', () => {
      const { container } = render(<SectionTransition />);
      const el = container.firstChild as HTMLElement;
      expect(el).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('wave variant', () => {
    it('renders an SVG element', () => {
      const { container } = render(<SectionTransition variant="wave" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders two wave paths', () => {
      const { container } = render(<SectionTransition variant="wave" />);
      const paths = container.querySelectorAll('path');
      expect(paths).toHaveLength(2);
    });

    it('uses default brand fill colors', () => {
      const { container } = render(<SectionTransition variant="wave" />);
      const paths = container.querySelectorAll('path');
      expect(paths[0]).toHaveClass('fill-brand-100');
      expect(paths[1]).toHaveClass('fill-brand-50');
    });

    it('applies custom fromColor and toColor to paths', () => {
      const { container } = render(
        <SectionTransition variant="wave" fromColor="fill-accent-200" toColor="fill-accent-50" />
      );
      const paths = container.querySelectorAll('path');
      expect(paths[0]).toHaveClass('fill-accent-200');
      expect(paths[1]).toHaveClass('fill-accent-50');
    });

    it('applies aria-hidden to the wrapper', () => {
      const { container } = render(<SectionTransition variant="wave" />);
      const el = container.firstChild as HTMLElement;
      expect(el).toHaveAttribute('aria-hidden', 'true');
    });

    it('renders full width', () => {
      const { container } = render(<SectionTransition variant="wave" />);
      const el = container.firstChild as HTMLElement;
      expect(el).toHaveClass('w-full');
    });
  });

  describe('gradient-fade variant', () => {
    it('renders a gradient div', () => {
      const { container } = render(<SectionTransition variant="gradient-fade" />);
      const el = container.firstChild as HTMLElement;
      expect(el.tagName).toBe('DIV');
      expect(el).toHaveClass('bg-gradient-to-b');
    });

    it('applies custom fromColor and toColor', () => {
      const { container } = render(
        <SectionTransition variant="gradient-fade" fromColor="from-accent-100" toColor="to-accent-50" />
      );
      const el = container.firstChild as HTMLElement;
      expect(el).toHaveClass('from-accent-100', 'to-accent-50');
    });

    it('has appropriate height classes', () => {
      const { container } = render(<SectionTransition variant="gradient-fade" />);
      const el = container.firstChild as HTMLElement;
      expect(el).toHaveClass('h-24');
    });
  });

  describe('soft-color variant', () => {
    it('renders a thin gradient band', () => {
      const { container } = render(<SectionTransition variant="soft-color" />);
      const el = container.firstChild as HTMLElement;
      expect(el.tagName).toBe('DIV');
      expect(el).toHaveClass('bg-gradient-to-b');
    });

    it('uses default brand colors', () => {
      const { container } = render(<SectionTransition variant="soft-color" />);
      const el = container.firstChild as HTMLElement;
      expect(el).toHaveClass('from-brand-50', 'to-brand-100');
    });

    it('includes accent via color for subtle transition', () => {
      const { container } = render(<SectionTransition variant="soft-color" />);
      const el = container.firstChild as HTMLElement;
      expect(el).toHaveClass('via-accent-50');
    });

    it('applies custom fromColor and toColor', () => {
      const { container } = render(
        <SectionTransition variant="soft-color" fromColor="from-neutral-100" toColor="to-neutral-50" />
      );
      const el = container.firstChild as HTMLElement;
      expect(el).toHaveClass('from-neutral-100', 'to-neutral-50');
    });

    it('is thinner than gradient-fade', () => {
      const { container } = render(<SectionTransition variant="soft-color" />);
      const el = container.firstChild as HTMLElement;
      expect(el).toHaveClass('h-8');
    });
  });

  describe('className prop', () => {
    it('applies custom className to gradient-fade', () => {
      const { container } = render(<SectionTransition className="my-8" />);
      const el = container.firstChild as HTMLElement;
      expect(el).toHaveClass('my-8');
    });

    it('applies custom className to wave', () => {
      const { container } = render(<SectionTransition variant="wave" className="my-custom" />);
      const el = container.firstChild as HTMLElement;
      expect(el).toHaveClass('my-custom');
    });

    it('applies custom className to soft-color', () => {
      const { container } = render(<SectionTransition variant="soft-color" className="mt-4" />);
      const el = container.firstChild as HTMLElement;
      expect(el).toHaveClass('mt-4');
    });
  });
});
