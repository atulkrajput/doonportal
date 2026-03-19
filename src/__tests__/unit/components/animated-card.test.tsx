import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AnimatedCard from '@/components/ui/AnimatedCard';

describe('AnimatedCard', () => {
  it('renders children correctly', () => {
    render(
      <AnimatedCard>
        <p>Card content</p>
      </AnimatedCard>
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies base styles: rounded-2xl, p-6, transition-all, duration-200', () => {
    const { container } = render(
      <AnimatedCard>
        <p>Content</p>
      </AnimatedCard>
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('rounded-2xl', 'p-6', 'transition-all', 'duration-200');
  });

  it('applies default non-glassmorphism styles: bg-white, shadow-soft, border-neutral-200', () => {
    const { container } = render(
      <AnimatedCard>
        <p>Content</p>
      </AnimatedCard>
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-white', 'shadow-soft', 'border', 'border-neutral-200');
  });

  it('defaults hover to true and applies hover classes', () => {
    const { container } = render(
      <AnimatedCard>
        <p>Content</p>
      </AnimatedCard>
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('hover:scale-[1.02]', 'hover:shadow-elevated', 'hover:border-brand-400');
  });

  it('does not apply hover classes when hover=false', () => {
    const { container } = render(
      <AnimatedCard hover={false}>
        <p>Content</p>
      </AnimatedCard>
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain('hover:scale-');
    expect(card.className).not.toContain('hover:shadow-elevated');
    expect(card.className).not.toContain('hover:border-brand-400');
  });

  it('applies glassmorphism styles when glassmorphism=true', () => {
    const { container } = render(
      <AnimatedCard glassmorphism>
        <p>Glass content</p>
      </AnimatedCard>
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-white/70', 'backdrop-blur-lg', 'border-white/20');
  });

  it('does not apply base bg/border when glassmorphism=true', () => {
    const { container } = render(
      <AnimatedCard glassmorphism>
        <p>Glass content</p>
      </AnimatedCard>
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain('shadow-soft');
    expect(card.className).not.toContain('border-neutral-200');
  });

  it('applies custom className', () => {
    const { container } = render(
      <AnimatedCard className="my-custom">
        <p>Content</p>
      </AnimatedCard>
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('my-custom');
  });

  it('renders as a plain div (no framer-motion)', () => {
    const { container } = render(
      <AnimatedCard>
        <p>Content</p>
      </AnimatedCard>
    );
    const card = container.firstChild as HTMLElement;
    expect(card.tagName).toBe('DIV');
  });

  it('supports both hover and glassmorphism together', () => {
    const { container } = render(
      <AnimatedCard hover glassmorphism>
        <p>Content</p>
      </AnimatedCard>
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-white/70', 'backdrop-blur-lg', 'border-white/20');
    expect(card).toHaveClass('hover:scale-[1.02]', 'hover:shadow-elevated', 'hover:border-brand-400');
  });
});
