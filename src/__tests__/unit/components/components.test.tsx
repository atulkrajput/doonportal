import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => {
    const { fill, priority, ...rest } = props;
    return <img {...rest} />;
  },
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/',
}));

// ---- HeroSection Tests ----
import HeroSection from '@/components/sections/HeroSection';

describe('HeroSection', () => {
  it('renders headline and subheadline', () => {
    render(
      <HeroSection
        headline="Test Headline"
        subheadline="Test Subheadline"
        ctaButtons={[]}
      />
    );
    expect(screen.getByLabelText('Test Headline')).toBeInTheDocument();
    expect(screen.getByText('Test Subheadline')).toBeInTheDocument();
  });

  it('renders CTA buttons with correct links', () => {
    render(
      <HeroSection
        headline="Headline"
        subheadline="Sub"
        ctaButtons={[
          { label: 'Primary CTA', href: '/demo', variant: 'primary' },
          { label: 'Secondary CTA', href: '/solutions', variant: 'secondary' },
        ]}
      />
    );
    const primary = screen.getByText('Primary CTA');
    expect(primary.closest('a')).toHaveAttribute('href', '/demo');
    const secondary = screen.getByText('Secondary CTA');
    expect(secondary.closest('a')).toHaveAttribute('href', '/solutions');
  });

  it('renders the headline as an h1', () => {
    render(
      <HeroSection headline="Main Title" subheadline="Sub" ctaButtons={[]} />
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Main Title');
  });
});

// ---- FeatureGrid Tests ----
import FeatureGrid from '@/components/sections/FeatureGrid';

describe('FeatureGrid', () => {
  const features = [
    { icon: '📚', title: 'Feature A', description: 'Desc A' },
    { icon: '📊', title: 'Feature B', description: 'Desc B' },
    { icon: '🔔', title: 'Feature C', description: 'Desc C' },
  ];

  it('renders all features', () => {
    render(<FeatureGrid features={features} />);
    features.forEach((f) => {
      expect(screen.getByText(f.title)).toBeInTheDocument();
      expect(screen.getByText(f.description)).toBeInTheDocument();
    });
  });

  it('renders title and subtitle when provided', () => {
    render(
      <FeatureGrid features={features} title="Grid Title" subtitle="Grid Subtitle" />
    );
    expect(screen.getByText('Grid Title')).toBeInTheDocument();
    expect(screen.getByText('Grid Subtitle')).toBeInTheDocument();
  });
});

// ---- ProductCard Tests ----
import ProductCard from '@/components/sections/ProductCard';

describe('ProductCard', () => {
  it('renders title, description, and icon', () => {
    render(
      <ProductCard
        title="School Management"
        description="Manage your school"
        icon="🏫"
        href="/products/school-management"
      />
    );
    expect(screen.getByText('School Management')).toBeInTheDocument();
    expect(screen.getByText('Manage your school')).toBeInTheDocument();
    expect(screen.getByText('🏫')).toBeInTheDocument();
  });

  it('links to the correct product page', () => {
    render(
      <ProductCard
        title="Test"
        description="Desc"
        icon="🏫"
        href="/products/school-management"
      />
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/products/school-management');
  });

  it('renders feature list when provided', () => {
    render(
      <ProductCard
        title="Test"
        description="Desc"
        icon="🏫"
        href="/products/test"
        features={['Feature 1', 'Feature 2']}
      />
    );
    expect(screen.getByText('Feature 1')).toBeInTheDocument();
    expect(screen.getByText('Feature 2')).toBeInTheDocument();
  });
});

// ---- CTASection Tests ----
import CTASection from '@/components/sections/CTASection';

describe('CTASection', () => {
  it('renders headline and CTA button', () => {
    render(
      <CTASection
        headline="Ready to Start?"
        ctaButton={{ label: 'Book Demo', href: '/book-demo' }}
      />
    );
    expect(screen.getByText('Ready to Start?')).toBeInTheDocument();
    const btn = screen.getByText('Book Demo');
    expect(btn.closest('a')).toHaveAttribute('href', '/book-demo');
  });

  it('renders subheadline when provided', () => {
    render(
      <CTASection
        headline="CTA"
        subheadline="Some extra info"
        ctaButton={{ label: 'Go', href: '/' }}
      />
    );
    expect(screen.getByText('Some extra info')).toBeInTheDocument();
  });
});

// ---- Footer Tests ----
import Footer from '@/components/layouts/Footer';

describe('Footer', () => {
  it('renders company description', () => {
    render(<Footer />);
    expect(screen.getByText(/DoonPortal builds automation platforms/)).toBeInTheDocument();
  });

  it('renders footer link groups', () => {
    render(<Footer />);
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
  });

  it('renders social media links', () => {
    render(<Footer />);
    expect(screen.getByLabelText(/Follow DoonPortal on LinkedIn/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Follow DoonPortal on Twitter/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Follow DoonPortal on Facebook/)).toBeInTheDocument();
  });

  it('renders contact info', () => {
    render(<Footer />);
    expect(screen.getByText('info@doonportal.com')).toBeInTheDocument();
  });
});

// ---- Navbar Tests ----
import Navbar from '@/components/layouts/Navbar';

describe('Navbar', () => {
  it('renders the logo', () => {
    render(<Navbar />);
    expect(screen.getByAltText('DoonPortal')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Navbar />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Blog')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('renders Book Demo CTA button', () => {
    render(<Navbar />);
    const demoButtons = screen.getAllByText('Book Demo');
    expect(demoButtons.length).toBeGreaterThan(0);
  });

  it('renders hamburger menu button for mobile', () => {
    render(<Navbar />);
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });
});
