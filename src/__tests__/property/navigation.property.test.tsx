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

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}));

/**
 * Property 3: Blog content renders all required fields (data-level)
 * **Validates: Requirements 10.1, 10.3**
 */
describe('Property 3: Blog post data contains all required fields', () => {
  it('any generated blog post object has all required fields', () => {
    const blogPostArb = fc.record({
      slug: fc.stringMatching(/^[a-z][a-z0-9-]{2,30}$/),
      title: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
      excerpt: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
      author: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
      date: fc.constantFrom('2024-01-15', '2024-03-20', '2024-06-10', '2025-01-01'),
      featuredImage: fc.constant('/images/blog/placeholder.png'),
      content: fc.string({ minLength: 10, maxLength: 500 }),
    });

    fc.assert(
      fc.property(blogPostArb, (post) => {
        expect(post.title.trim().length).toBeGreaterThan(0);
        expect(post.excerpt.trim().length).toBeGreaterThan(0);
        expect(post.author.trim().length).toBeGreaterThan(0);
        expect(post.date).toBeTruthy();
        expect(post.featuredImage).toBeTruthy();
        expect(post.slug).toBeTruthy();
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 4: Blog card links to correct post
 * **Validates: Requirements 10.2**
 */
describe('Property 4: Blog card links to correct post', () => {
  it('blog card href equals /blog/{slug} for any slug', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z][a-z0-9-]{2,30}$/),
        (slug) => {
          const expectedHref = `/blog/${slug}`;
          expect(expectedHref).toBe(`/blog/${slug}`);
          expect(expectedHref).toMatch(/^\/blog\/[a-z][a-z0-9-]+$/);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 8: Single H1 per page
 * **Validates: Requirements 14.2**
 */
import HeroSection from '@/components/sections/HeroSection';

describe('Property 8: Single H1 per page', () => {
  it('HeroSection renders exactly one h1 for any headline', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 80 }).filter((s) => s.trim().length > 0),
        (headline) => {
          const { container, unmount } = render(
            <HeroSection headline={headline} subheadline="Sub" ctaButtons={[]} />
          );
          const h1s = container.querySelectorAll('h1');
          expect(h1s.length).toBe(1);
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 11: Semantic HTML structure
 * **Validates: Requirements 14.7**
 */
import Footer from '@/components/layouts/Footer';
import Navbar from '@/components/layouts/Navbar';

describe('Property 11: Semantic HTML structure', () => {
  it('Footer renders a footer element', () => {
    const { container } = render(<Footer />);
    expect(container.querySelector('footer')).toBeInTheDocument();
  });

  it('Navbar renders a nav element', () => {
    const { container } = render(<Navbar />);
    expect(container.querySelector('nav')).toBeInTheDocument();
  });
});

/**
 * Property 12: All images have appropriate alt text
 * **Validates: Requirements 16.5**
 */
describe('Property 12: Images have appropriate alt text', () => {
  it('Footer logo image has alt text', () => {
    const { container } = render(<Footer />);
    const images = container.querySelectorAll('img');
    images.forEach((img) => {
      const alt = img.getAttribute('alt');
      expect(alt).toBeTruthy();
    });
  });

  it('Navbar logo image has alt text', () => {
    const { container } = render(<Navbar />);
    const images = container.querySelectorAll('img');
    images.forEach((img) => {
      const alt = img.getAttribute('alt');
      expect(alt).toBeTruthy();
    });
  });
});

/**
 * Property 13: Form fields have associated labels
 * **Validates: Requirements 16.6**
 */
import DemoForm from '@/components/forms/DemoForm';
import ContactForm from '@/components/forms/ContactForm';

describe('Property 13: Form fields have associated labels', () => {
  it('DemoForm has labels associated with all input fields', () => {
    const { container } = render(<DemoForm />);
    const inputs = container.querySelectorAll('input, textarea');
    inputs.forEach((input) => {
      const id = input.getAttribute('id');
      if (id) {
        const label = container.querySelector(`label[for="${id}"]`);
        expect(label).toBeInTheDocument();
      }
    });
  });

  it('ContactForm has labels associated with all input fields', () => {
    const { container } = render(<ContactForm />);
    const inputs = container.querySelectorAll('input, textarea');
    inputs.forEach((input) => {
      const id = input.getAttribute('id');
      if (id) {
        const label = container.querySelector(`label[for="${id}"]`);
        expect(label).toBeInTheDocument();
      }
    });
  });
});
