import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Button from '@/components/ui/Button';

describe('Button — hover/click scale and glow', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies scale(1) by default', () => {
    render(<Button>Test</Button>);
    const btn = screen.getByRole('button', { name: 'Test' });
    expect(btn.style.transform).toBe('scale(1)');
  });

  it('scales to 1.03 on hover', () => {
    render(<Button>Test</Button>);
    const btn = screen.getByRole('button', { name: 'Test' });
    fireEvent.mouseEnter(btn);
    expect(btn.style.transform).toBe('scale(1.03)');
  });

  it('scales to 0.97 on click', () => {
    render(<Button>Test</Button>);
    const btn = screen.getByRole('button', { name: 'Test' });
    fireEvent.mouseEnter(btn);
    fireEvent.mouseDown(btn);
    expect(btn.style.transform).toBe('scale(0.97)');
  });

  it('returns to scale(1) on mouse leave', () => {
    render(<Button>Test</Button>);
    const btn = screen.getByRole('button', { name: 'Test' });
    fireEvent.mouseEnter(btn);
    fireEvent.mouseLeave(btn);
    expect(btn.style.transform).toBe('scale(1)');
  });

  it('uses 200ms transition for hover', () => {
    render(<Button>Test</Button>);
    const btn = screen.getByRole('button', { name: 'Test' });
    fireEvent.mouseEnter(btn);
    expect(btn.style.transition).toContain('200ms');
  });

  it('uses 100ms transition for active state', () => {
    render(<Button>Test</Button>);
    const btn = screen.getByRole('button', { name: 'Test' });
    fireEvent.mouseEnter(btn);
    fireEvent.mouseDown(btn);
    expect(btn.style.transition).toContain('100ms');
  });

  it('applies glow box-shadow on hover for primary variant', () => {
    render(<Button variant="primary">Test</Button>);
    const btn = screen.getByRole('button', { name: 'Test' });
    fireEvent.mouseEnter(btn);
    expect(btn.style.boxShadow).toContain('rgba(26,138,214');
  });

  it('does not apply glow on secondary variant', () => {
    render(<Button variant="secondary">Test</Button>);
    const btn = screen.getByRole('button', { name: 'Test' });
    fireEvent.mouseEnter(btn);
    expect(btn.style.boxShadow).toBe('');
  });

  it('does not apply glow on outline variant', () => {
    render(<Button variant="outline">Test</Button>);
    const btn = screen.getByRole('button', { name: 'Test' });
    fireEvent.mouseEnter(btn);
    expect(btn.style.boxShadow).toBe('');
  });

  it('renders as a link when href is provided', () => {
    render(<Button href="/test">Link</Button>);
    const link = screen.getByRole('link', { name: 'Link' });
    expect(link).toBeInTheDocument();
    expect(link.style.transform).toBe('scale(1)');
  });

  it('applies hover scale to link variant', () => {
    render(<Button href="/test">Link</Button>);
    const link = screen.getByRole('link', { name: 'Link' });
    fireEvent.mouseEnter(link);
    expect(link.style.transform).toBe('scale(1.03)');
  });

  it('preserves existing variant styles', () => {
    render(<Button variant="outline">Outline</Button>);
    const btn = screen.getByRole('button', { name: 'Outline' });
    expect(btn.className).toContain('border');
  });

  it('preserves existing size styles', () => {
    render(<Button size="lg">Large</Button>);
    const btn = screen.getByRole('button', { name: 'Large' });
    expect(btn.className).toContain('px-7');
  });
});
