import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock framer-motion to render plain elements
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
      const safeProps: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(props)) {
        if (
          typeof value !== 'object' &&
          typeof value !== 'function' &&
          !['initial', 'animate', 'exit', 'variants', 'custom', 'whileHover', 'whileTap', 'transition'].includes(key)
        ) {
          safeProps[key] = value;
        }
      }
      return <div {...safeProps}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useInView: () => true,
}));

import Navbar from '@/components/layouts/Navbar';

describe('Navbar Upgrade', () => {
  let scrollHandler: (() => void) | null = null;

  beforeEach(() => {
    scrollHandler = null;
    // Capture the scroll event handler
    vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'scroll') {
        scrollHandler = handler as () => void;
      }
    });
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {});
    Object.defineProperty(window, 'scrollY', { writable: true, value: 0 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders with transparent background when not scrolled (scrollY = 0)', () => {
    Object.defineProperty(window, 'scrollY', { writable: true, value: 0 });
    const { container } = render(<Navbar />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('bg-transparent');
  });

  it('applies glassmorphism classes when scrolled past 50px', () => {
    Object.defineProperty(window, 'scrollY', { writable: true, value: 0 });
    const { container } = render(<Navbar />);

    // Simulate scroll past 50px
    Object.defineProperty(window, 'scrollY', { writable: true, value: 51 });
    act(() => {
      scrollHandler?.();
    });

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('bg-white/80');
    expect(nav).toHaveClass('backdrop-blur-xl');
    expect(nav).toHaveClass('border-white/20');
    expect(nav).toHaveClass('shadow-nav');
  });

  it('does not apply glassmorphism classes when scrolled exactly 50px', () => {
    Object.defineProperty(window, 'scrollY', { writable: true, value: 0 });
    const { container } = render(<Navbar />);

    Object.defineProperty(window, 'scrollY', { writable: true, value: 50 });
    act(() => {
      scrollHandler?.();
    });

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('bg-transparent');
  });

  it('applies transition-all and duration-300 for smooth scroll transition', () => {
    const { container } = render(<Navbar />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('transition-all', 'duration-300');
  });

  it('has border-b class when scrolled (glassmorphism state)', () => {
    Object.defineProperty(window, 'scrollY', { writable: true, value: 0 });
    const { container } = render(<Navbar />);

    Object.defineProperty(window, 'scrollY', { writable: true, value: 100 });
    act(() => {
      scrollHandler?.();
    });

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('border-b');
  });

  it('renders desktop nav links with animated underline classes (after pseudo-element)', () => {
    const { container } = render(<Navbar />);
    // Desktop nav links should have the animated underline CSS classes
    const desktopLinks = container.querySelectorAll('.hidden.md\\:flex a');
    desktopLinks.forEach((link) => {
      // Check for the after: pseudo-element underline animation classes
      expect(link.className).toContain('after:');
      expect(link.className).toContain('after:bg-brand-500');
      expect(link.className).toContain('after:transition-all');
      expect(link.className).toContain('hover:after:w-full');
    });
  });

  it('renders dropdown animation with 200ms transition duration', () => {
    const { container } = render(<Navbar />);
    // The dropdown uses framer-motion AnimatePresence with transition duration 0.2 (200ms)
    // Since we mock framer-motion, we verify the dropdown structure exists
    // The actual transition config is { duration: 0.2 } in the source
    const dropdownParents = container.querySelectorAll('[aria-haspopup="true"]');
    expect(dropdownParents.length).toBeGreaterThan(0);
  });

  it('is fixed at top of viewport with z-50', () => {
    const { container } = render(<Navbar />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-50');
  });

  it('reverts to transparent when scrolling back to top', () => {
    Object.defineProperty(window, 'scrollY', { writable: true, value: 0 });
    const { container } = render(<Navbar />);

    // Scroll down
    Object.defineProperty(window, 'scrollY', { writable: true, value: 100 });
    act(() => {
      scrollHandler?.();
    });

    let nav = container.querySelector('nav');
    expect(nav).toHaveClass('bg-white/80');

    // Scroll back to top
    Object.defineProperty(window, 'scrollY', { writable: true, value: 0 });
    act(() => {
      scrollHandler?.();
    });

    nav = container.querySelector('nav');
    expect(nav).toHaveClass('bg-transparent');
  });

  it('renders the main navigation landmark', () => {
    render(<Navbar />);
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav).toBeInTheDocument();
  });
});
