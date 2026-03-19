import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock framer-motion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    useScroll: vi.fn(() => ({ scrollYProgress: { get: () => 0 } })),
    useTransform: vi.fn(() => ({ get: () => 0 })),
  };
});

// Default: desktop viewport
let matchMediaMatches = false;
const listeners: Array<(e: { matches: boolean }) => void> = [];

beforeEach(() => {
  matchMediaMatches = false;
  listeners.length = 0;
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: matchMediaMatches,
      media: query,
      addEventListener: vi.fn((_: string, cb: (e: { matches: boolean }) => void) => listeners.push(cb)),
      removeEventListener: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

import HeroAnimation from '@/components/sections/HeroAnimation';

describe('HeroAnimation', () => {
  it('renders children on top of the animation', () => {
    render(
      <HeroAnimation>
        <h1>Welcome</h1>
      </HeroAnimation>
    );
    expect(screen.getByText('Welcome')).toBeInTheDocument();
  });

  it('renders animated gradient background with default colors', () => {
    const { container } = render(
      <HeroAnimation>
        <p>Content</p>
      </HeroAnimation>
    );
    const gradientBg = container.querySelector('.animate-gradient');
    expect(gradientBg).toBeInTheDocument();
    expect(gradientBg).toHaveClass('bg-gradient-to-br', 'from-brand-600', 'via-brand-500', 'to-accent-500');
  });

  it('applies custom gradient colors', () => {
    const { container } = render(
      <HeroAnimation gradientColors={{ from: 'from-red-500', to: 'to-blue-500' }}>
        <p>Content</p>
      </HeroAnimation>
    );
    const gradientBg = container.querySelector('.animate-gradient');
    expect(gradientBg).toHaveClass('from-red-500', 'to-blue-500');
  });

  it('applies custom gradient colors with via', () => {
    const { container } = render(
      <HeroAnimation gradientColors={{ from: 'from-red-500', via: 'via-green-400', to: 'to-blue-500' }}>
        <p>Content</p>
      </HeroAnimation>
    );
    const gradientBg = container.querySelector('.animate-gradient');
    expect(gradientBg).toHaveClass('from-red-500', 'via-green-400', 'to-blue-500');
  });

  it('renders floating orb elements on desktop by default', () => {
    const { container } = render(
      <HeroAnimation>
        <p>Content</p>
      </HeroAnimation>
    );
    const orbs = container.querySelectorAll('.animate-float-orb');
    expect(orbs.length).toBe(4);
  });

  it('floating orbs have blur, rounded-full, and opacity classes', () => {
    const { container } = render(
      <HeroAnimation>
        <p>Content</p>
      </HeroAnimation>
    );
    const orbs = container.querySelectorAll('.animate-float-orb');
    orbs.forEach((orb) => {
      expect(orb).toHaveClass('rounded-full', 'blur-3xl', 'opacity-60');
    });
  });

  it('does not render floating elements when floatingElements=false', () => {
    const { container } = render(
      <HeroAnimation floatingElements={false}>
        <p>Content</p>
      </HeroAnimation>
    );
    const orbs = container.querySelectorAll('.animate-float-orb');
    expect(orbs.length).toBe(0);
  });

  it('does not render floating elements on mobile viewport', () => {
    matchMediaMatches = true;
    // Re-mock matchMedia for this test
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { container } = render(
      <HeroAnimation>
        <p>Content</p>
      </HeroAnimation>
    );
    const orbs = container.querySelectorAll('.animate-float-orb');
    expect(orbs.length).toBe(0);
  });

  it('children are rendered in a z-10 container', () => {
    const { container } = render(
      <HeroAnimation>
        <p>Content</p>
      </HeroAnimation>
    );
    const childWrapper = container.querySelector('.z-10');
    expect(childWrapper).toBeInTheDocument();
    expect(childWrapper).toHaveTextContent('Content');
  });

  it('container has overflow-hidden to contain orbs', () => {
    const { container } = render(
      <HeroAnimation>
        <p>Content</p>
      </HeroAnimation>
    );
    expect(container.firstChild).toHaveClass('overflow-hidden');
  });

  it('gradient background is marked aria-hidden', () => {
    const { container } = render(
      <HeroAnimation>
        <p>Content</p>
      </HeroAnimation>
    );
    const gradientBg = container.querySelector('.animate-gradient');
    expect(gradientBg).toHaveAttribute('aria-hidden', 'true');
  });

  it('floating orbs are marked aria-hidden', () => {
    const { container } = render(
      <HeroAnimation>
        <p>Content</p>
      </HeroAnimation>
    );
    const orbs = container.querySelectorAll('.animate-float-orb');
    orbs.forEach((orb) => {
      expect(orb).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
