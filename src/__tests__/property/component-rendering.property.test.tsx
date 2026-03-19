import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import fc from 'fast-check';
import React from 'react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <div ref={ref} {...props}>{children}</div>
    )),
    span: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <span ref={ref} {...props}>{children}</span>
    )),
    h1: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <h1 ref={ref} {...props}>{children}</h1>
    )),
    p: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <p ref={ref} {...props}>{children}</p>
    )),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useInView: () => true,
  useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
  useTransform: () => 0,
}));

// Mock window.matchMedia for HeroAnimation
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock('next/image', () => ({
  default: (props: any) => {
    const { fill, priority, ...rest } = props;
    return <img {...rest} />;
  },
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import ProductCard from '@/components/sections/ProductCard';
import FeatureGrid from '@/components/sections/FeatureGrid';
import HeroSection from '@/components/sections/HeroSection';
import CTASection from '@/components/sections/CTASection';

/**
 * Property 1: ProductCard links to correct detail page
 * For any ProductCard rendered with a product slug, the card's link href
 * should equal /products/{slug}.
 * **Validates: Requirements 3.5, 8.4**
 */
describe('Property 1: ProductCard links to correct detail page', () => {
  it('card href equals /products/{slug} for any slug', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z][a-z0-9-]{1,30}$/),
        (slug) => {
          const href = `/products/${slug}`;
          const { container, unmount } = render(
            <ProductCard title="Test" description="Desc" icon="🏫" href={href} />
          );
          const link = container.querySelector('a');
          expect(link).toHaveAttribute('href', href);
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 2: FeatureGrid renders all product features
 * For any product data object containing a list of features, the FeatureGrid
 * component should render exactly one item for each feature in the list.
 * **Validates: Requirements 4.4, 5.4, 6.4**
 */
describe('Property 2: FeatureGrid renders all features', () => {
  it('renders exactly one item per feature for any feature array', () => {
    const featureArb = fc.record({
      icon: fc.constantFrom('📚', '📊', '🔔', '💰', '🏫'),
      title: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
      description: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    });

    fc.assert(
      fc.property(
        fc.array(featureArb, { minLength: 1, maxLength: 12 }),
        (features) => {
          // Ensure unique titles for reliable querying
          const uniqueFeatures = features.filter(
            (f, i, arr) => arr.findIndex((x) => x.title === f.title) === i
          );
          if (uniqueFeatures.length === 0) return;

          const { container, unmount } = render(<FeatureGrid features={uniqueFeatures} />);
          uniqueFeatures.forEach((f) => {
            const found = container.querySelector(`h3`);
            expect(found).toBeTruthy();
          });
          // Verify count of feature cards matches
          const h3s = container.querySelectorAll('h3');
          expect(h3s.length).toBe(uniqueFeatures.length);
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 14: Reusable components render different prop values
 * For any two distinct sets of valid props passed to a reusable component,
 * the rendered output should reflect the different prop values.
 * **Validates: Requirements 17.2**
 */
describe('Property 14: Reusable components render different prop values', () => {
  it('HeroSection renders different headlines for different props', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 60 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 60 }).filter((s) => s.trim().length > 0),
        (headline1, headline2) => {
          fc.pre(headline1 !== headline2);

          const normalize = (s: string) => s.split(/\s+/).filter(Boolean).join(' ');

          const { container: c1, unmount: u1 } = render(
            <HeroSection headline={headline1} subheadline="Sub" ctaButtons={[]} />
          );
          const h1a = c1.querySelector('h1');
          expect(h1a?.textContent).toBe(normalize(headline1));
          u1();

          const { container: c2, unmount: u2 } = render(
            <HeroSection headline={headline2} subheadline="Sub" ctaButtons={[]} />
          );
          const h1b = c2.querySelector('h1');
          expect(h1b?.textContent).toBe(normalize(headline2));
          u2();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('ProductCard renders different titles for different props', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0),
        (title1, title2) => {
          fc.pre(title1 !== title2);

          const { container: c1, unmount: u1 } = render(
            <ProductCard title={title1} description="D" icon="🏫" href="/test" />
          );
          const h3a = c1.querySelector('h3');
          expect(h3a?.textContent).toBe(title1);
          u1();

          const { container: c2, unmount: u2 } = render(
            <ProductCard title={title2} description="D" icon="🏫" href="/test" />
          );
          const h3b = c2.querySelector('h3');
          expect(h3b?.textContent).toBe(title2);
          u2();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('CTASection renders different headlines for different props', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 60 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 60 }).filter((s) => s.trim().length > 0),
        (h1, h2) => {
          fc.pre(h1 !== h2);

          const { container: c1, unmount: u1 } = render(
            <CTASection headline={h1} ctaButton={{ label: 'Go', href: '/' }} />
          );
          const heading1 = c1.querySelector('h2');
          expect(heading1?.textContent).toBe(h1);
          u1();

          const { container: c2, unmount: u2 } = render(
            <CTASection headline={h2} ctaButton={{ label: 'Go', href: '/' }} />
          );
          const heading2 = c2.querySelector('h2');
          expect(heading2?.textContent).toBe(h2);
          u2();
        }
      ),
      { numRuns: 100 }
    );
  });
});
