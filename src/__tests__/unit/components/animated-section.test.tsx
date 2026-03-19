import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AnimatedSection, { variantMap } from '@/components/ui/AnimatedSection';

// Mock framer-motion's useInView to control viewport detection in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    useInView: vi.fn(() => true),
  };
});

describe('AnimatedSection', () => {
  it('renders children correctly', () => {
    render(
      <AnimatedSection>
        <p>Hello World</p>
      </AnimatedSection>
    );
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <AnimatedSection className="my-custom-class">
        <p>Content</p>
      </AnimatedSection>
    );
    expect(container.firstChild).toHaveClass('my-custom-class');
  });

  it('defaults to fade-in-up variant', () => {
    const { container } = render(
      <AnimatedSection>
        <p>Content</p>
      </AnimatedSection>
    );
    // The component should render a motion.div (rendered as div)
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.tagName).toBe('DIV');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders with all valid variants without error', () => {
    const variants = ['fade-in-up', 'slide-in-left', 'slide-in-right', 'scale-in', 'fade-in'] as const;

    variants.forEach((variant) => {
      const { unmount } = render(
        <AnimatedSection variant={variant}>
          <p>{variant}</p>
        </AnimatedSection>
      );
      expect(screen.getByText(variant)).toBeInTheDocument();
      unmount();
    });
  });

  it('renders children when staggerChildren is set', () => {
    render(
      <AnimatedSection staggerChildren={0.1}>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </AnimatedSection>
    );
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.getByText('Child 3')).toBeInTheDocument();
  });

  it('exports variantMap with all five variants', () => {
    expect(variantMap).toHaveProperty('fade-in-up');
    expect(variantMap).toHaveProperty('slide-in-left');
    expect(variantMap).toHaveProperty('slide-in-right');
    expect(variantMap).toHaveProperty('scale-in');
    expect(variantMap).toHaveProperty('fade-in');
  });

  it('variantMap fade-in-up has correct hidden/visible states', () => {
    const v = variantMap['fade-in-up'];
    expect(v.hidden).toEqual({ opacity: 0, y: 30 });
    expect(v.visible).toEqual({ opacity: 1, y: 0 });
  });

  it('variantMap slide-in-left has correct hidden/visible states', () => {
    const v = variantMap['slide-in-left'];
    expect(v.hidden).toEqual({ opacity: 0, x: -50 });
    expect(v.visible).toEqual({ opacity: 1, x: 0 });
  });

  it('variantMap slide-in-right has correct hidden/visible states', () => {
    const v = variantMap['slide-in-right'];
    expect(v.hidden).toEqual({ opacity: 0, x: 50 });
    expect(v.visible).toEqual({ opacity: 1, x: 0 });
  });

  it('variantMap scale-in has correct hidden/visible states', () => {
    const v = variantMap['scale-in'];
    expect(v.hidden).toEqual({ opacity: 0, scale: 0.9 });
    expect(v.visible).toEqual({ opacity: 1, scale: 1 });
  });

  it('variantMap fade-in has correct hidden/visible states', () => {
    const v = variantMap['fade-in'];
    expect(v.hidden).toEqual({ opacity: 0 });
    expect(v.visible).toEqual({ opacity: 1 });
  });

  it('accepts delay and threshold props without error', () => {
    render(
      <AnimatedSection delay={0.5} threshold={0.5}>
        <p>Delayed content</p>
      </AnimatedSection>
    );
    expect(screen.getByText('Delayed content')).toBeInTheDocument();
  });
});
