'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  ariaLabel?: string;
  className?: string;
}

const variantStyles: Record<string, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
  secondary:
    'bg-brand-100 text-brand-700 hover:bg-brand-200 active:bg-brand-300',
  outline:
    'border border-brand-300 text-brand-700 hover:bg-brand-50 active:bg-brand-100',
  ghost:
    'bg-transparent text-brand-600 hover:bg-brand-50 active:bg-brand-100',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  disabled = false,
  type = 'button',
  ariaLabel,
  className = '',
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [canHover, setCanHover] = useState(true);

  useEffect(() => {
    // Detect if the device supports hover (non-touch)
    const mq = window.matchMedia('(hover: hover)');
    setCanHover(mq.matches);
    const handler = (e: MediaQueryListEvent) => setCanHover(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // On touch devices, skip scale/glow hover effects to prevent stuck states
  const effectiveHover = canHover && isHovered;
  const scale = isActive ? 0.97 : effectiveHover ? 1.03 : 1;

  const glowStyle =
    variant === 'primary' && effectiveHover
      ? '0 0 20px rgba(26,138,214,0.15), 0 0 40px rgba(26,138,214,0.08)'
      : undefined;

  const interactionStyle: React.CSSProperties = {
    transform: `scale(${scale})`,
    transition: isActive
      ? 'transform 100ms ease-out, box-shadow 200ms ease-out'
      : 'transform 200ms ease-out, box-shadow 200ms ease-out',
    boxShadow: glowStyle,
  };

  const base =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

  const classes = `${base} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim();

  const hoverHandlers = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => {
      setIsHovered(false);
      setIsActive(false);
    },
    onMouseDown: () => setIsActive(true),
    onMouseUp: () => setIsActive(false),
  };

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        aria-label={ariaLabel}
        style={interactionStyle}
        {...hoverHandlers}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      aria-label={ariaLabel}
      style={interactionStyle}
      {...hoverHandlers}
    >
      {children}
    </button>
  );
}
