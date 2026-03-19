import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HoverButton from '@/components/ui/HoverButton';

describe('HoverButton', () => {
  it('renders children through the underlying Button', () => {
    render(<HoverButton>Click me</HoverButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('renders a button element inside the wrapper', () => {
    render(<HoverButton>Test</HoverButton>);
    expect(screen.getByRole('button', { name: 'Test' })).toBeInTheDocument();
  });

  it('applies scale(1) by default (no hover, no click)', () => {
    const { container } = render(<HoverButton>Test</HoverButton>);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.transform).toBe('scale(1)');
  });

  it('scales to hoverScale on mouse enter (default 1.03)', () => {
    const { container } = render(<HoverButton>Test</HoverButton>);
    const wrapper = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(wrapper);
    expect(wrapper.style.transform).toBe('scale(1.03)');
  });

  it('scales to clickScale on mouse down (default 0.97)', () => {
    const { container } = render(<HoverButton>Test</HoverButton>);
    const wrapper = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(wrapper);
    fireEvent.mouseDown(wrapper);
    expect(wrapper.style.transform).toBe('scale(0.97)');
  });

  it('returns to scale(1) on mouse leave', () => {
    const { container } = render(<HoverButton>Test</HoverButton>);
    const wrapper = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(wrapper);
    fireEvent.mouseLeave(wrapper);
    expect(wrapper.style.transform).toBe('scale(1)');
  });

  it('uses 200ms transition for hover', () => {
    const { container } = render(<HoverButton>Test</HoverButton>);
    const wrapper = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(wrapper);
    expect(wrapper.style.transition).toContain('200ms');
  });

  it('uses 100ms transition for click (active state)', () => {
    const { container } = render(<HoverButton>Test</HoverButton>);
    const wrapper = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(wrapper);
    fireEvent.mouseDown(wrapper);
    expect(wrapper.style.transition).toContain('100ms');
  });

  it('accepts custom hoverScale', () => {
    const { container } = render(<HoverButton hoverScale={1.1}>Test</HoverButton>);
    const wrapper = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(wrapper);
    expect(wrapper.style.transform).toBe('scale(1.1)');
  });

  it('accepts custom clickScale', () => {
    const { container } = render(<HoverButton clickScale={0.9}>Test</HoverButton>);
    const wrapper = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(wrapper);
    fireEvent.mouseDown(wrapper);
    expect(wrapper.style.transform).toBe('scale(0.9)');
  });

  it('applies glow box-shadow on hover when glow=true and variant=primary', () => {
    const { container } = render(<HoverButton glow variant="primary">Test</HoverButton>);
    const wrapper = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(wrapper);
    expect(wrapper.style.boxShadow).toContain('rgba(26,138,214');
  });

  it('does not apply glow when glow=false', () => {
    const { container } = render(<HoverButton glow={false} variant="primary">Test</HoverButton>);
    const wrapper = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(wrapper);
    expect(wrapper.style.boxShadow).toBe('');
  });

  it('does not apply glow on non-primary variant even when glow=true', () => {
    const { container } = render(<HoverButton glow variant="secondary">Test</HoverButton>);
    const wrapper = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(wrapper);
    expect(wrapper.style.boxShadow).toBe('');
  });

  it('passes variant prop to underlying Button', () => {
    render(<HoverButton variant="outline">Outline</HoverButton>);
    const btn = screen.getByRole('button', { name: 'Outline' });
    expect(btn.className).toContain('border');
  });

  it('passes size prop to underlying Button', () => {
    render(<HoverButton size="lg">Large</HoverButton>);
    const btn = screen.getByRole('button', { name: 'Large' });
    expect(btn.className).toContain('px-7');
  });

  it('has transition-shadow duration-200 class on wrapper', () => {
    const { container } = render(<HoverButton>Test</HoverButton>);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('transition-shadow', 'duration-200');
  });
});
