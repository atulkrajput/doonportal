import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import GradientBackground from '@/components/ui/GradientBackground';

describe('GradientBackground', () => {
  it('renders children correctly', () => {
    render(
      <GradientBackground>
        <p>Hello world</p>
      </GradientBackground>
    );
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('applies default gradient-hero color stops when no colors prop provided', () => {
    const { container } = render(
      <GradientBackground>
        <p>Content</p>
      </GradientBackground>
    );
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('bg-gradient-to-br', 'from-brand-600', 'via-brand-500', 'to-accent-500');
  });

  it('applies custom color stops when colors prop is provided', () => {
    const { container } = render(
      <GradientBackground colors={['from-red-500', 'to-blue-500']}>
        <p>Content</p>
      </GradientBackground>
    );
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('bg-gradient-to-br', 'from-red-500', 'to-blue-500');
  });

  it('applies animate-gradient class when animated=true', () => {
    const { container } = render(
      <GradientBackground animated>
        <p>Content</p>
      </GradientBackground>
    );
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('animate-gradient');
  });

  it('does not apply animate-gradient class when animated=false (default)', () => {
    const { container } = render(
      <GradientBackground>
        <p>Content</p>
      </GradientBackground>
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).not.toContain('animate-gradient');
  });

  it('applies relative positioning for children overlay', () => {
    const { container } = render(
      <GradientBackground>
        <p>Content</p>
      </GradientBackground>
    );
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('relative');
  });

  it('applies custom className', () => {
    const { container } = render(
      <GradientBackground className="min-h-screen py-20">
        <p>Content</p>
      </GradientBackground>
    );
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('min-h-screen', 'py-20');
  });

  it('renders as a plain div', () => {
    const { container } = render(
      <GradientBackground>
        <p>Content</p>
      </GradientBackground>
    );
    const el = container.firstChild as HTMLElement;
    expect(el.tagName).toBe('DIV');
  });

  it('supports animated with custom colors together', () => {
    const { container } = render(
      <GradientBackground animated colors={['from-purple-600', 'via-pink-500', 'to-orange-400']}>
        <p>Content</p>
      </GradientBackground>
    );
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('animate-gradient', 'from-purple-600', 'via-pink-500', 'to-orange-400');
  });
});
