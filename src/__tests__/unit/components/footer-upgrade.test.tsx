import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

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

import Footer from '@/components/layouts/Footer';

describe('Footer Upgrade', () => {
  it('renders with dark gradient background (from-neutral-900 to-neutral-950)', () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector('footer');
    expect(footer).toHaveClass('bg-gradient-to-b', 'from-neutral-900', 'to-neutral-950');
  });

  it('renders the gradient top separator', () => {
    const { container } = render(<Footer />);
    // The separator is a div with gradient from transparent via brand-500 to transparent
    const separator = container.querySelector('.bg-gradient-to-r.from-transparent.via-brand-500.to-transparent');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveClass('h-px');
  });

  it('renders footer description text in neutral-400 (light text)', () => {
    const { container } = render(<Footer />);
    const description = container.querySelector('p.text-neutral-400');
    expect(description).toBeInTheDocument();
    expect(description?.textContent).toContain('DoonPortal');
  });

  it('renders section headings in neutral-200 (light text)', () => {
    const { container } = render(<Footer />);
    const headings = container.querySelectorAll('h3.text-neutral-200');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('renders footer links with hover:text-brand-400 transition', () => {
    const { container } = render(<Footer />);
    // Footer links should have hover color transition to brand-400
    const footerLinks = container.querySelectorAll('ul a');
    footerLinks.forEach((link) => {
      expect(link.className).toContain('hover:text-brand-400');
      expect(link.className).toContain('transition-colors');
    });
  });

  it('renders footer links with animated underline slide-in (after pseudo-element)', () => {
    const { container } = render(<Footer />);
    const footerLinks = container.querySelectorAll('ul a');
    footerLinks.forEach((link) => {
      expect(link.className).toContain('after:');
      expect(link.className).toContain('after:bg-brand-400');
      expect(link.className).toContain('hover:after:w-full');
    });
  });

  it('renders social icons with hover:scale-110 and hover:text-brand-400', () => {
    const { container } = render(<Footer />);
    const socialLinks = container.querySelectorAll('a[aria-label*="Follow DoonPortal"]');
    expect(socialLinks.length).toBe(3); // LinkedIn, Twitter, Facebook
    socialLinks.forEach((link) => {
      expect(link.className).toContain('hover:scale-110');
      expect(link.className).toContain('hover:text-brand-400');
    });
  });

  it('renders social icons with transition-all duration-200', () => {
    const { container } = render(<Footer />);
    const socialLinks = container.querySelectorAll('a[aria-label*="Follow DoonPortal"]');
    socialLinks.forEach((link) => {
      expect(link.className).toContain('transition-all');
      expect(link.className).toContain('duration-200');
    });
  });

  it('renders footer links in neutral-400 base color', () => {
    const { container } = render(<Footer />);
    const footerLinks = container.querySelectorAll('ul a');
    footerLinks.forEach((link) => {
      expect(link.className).toContain('text-neutral-400');
    });
  });

  it('renders copyright text in neutral-500', () => {
    const { container } = render(<Footer />);
    const copyright = container.querySelector('.text-neutral-500');
    expect(copyright).toBeInTheDocument();
    expect(copyright?.textContent).toContain('DoonPortal');
    expect(copyright?.textContent).toContain('All rights reserved');
  });

  it('renders the contentinfo landmark role', () => {
    render(<Footer />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });

  it('renders the border-t separator between content and copyright', () => {
    const { container } = render(<Footer />);
    const borderSection = container.querySelector('.border-t.border-neutral-800');
    expect(borderSection).toBeInTheDocument();
  });
});
