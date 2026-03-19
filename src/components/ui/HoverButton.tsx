'use client';

import { useState, useEffect } from 'react';
import Button, { type ButtonProps } from '@/components/ui/Button';

export interface HoverButtonProps extends Omit<ButtonProps, never> {
  hoverScale?: number;
  clickScale?: number;
  glow?: boolean;
}

export default function HoverButton({
  hoverScale = 1.03,
  clickScale = 0.97,
  glow = false,
  variant = 'primary',
  className = '',
  ...buttonProps
}: HoverButtonProps) {
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
  const scale = isActive ? clickScale : effectiveHover ? hoverScale : 1;

  const glowStyle =
    glow && variant === 'primary' && effectiveHover
      ? '0 0 20px rgba(26,138,214,0.15), 0 0 40px rgba(26,138,214,0.08)'
      : undefined;

  const wrapperStyle: React.CSSProperties = {
    display: 'inline-block',
    transform: `scale(${scale})`,
    transition: isActive
      ? 'transform 100ms ease-out'
      : 'transform 200ms ease-out',
    boxShadow: glowStyle,
    borderRadius: 'inherit',
  };

  return (
    <div
      style={wrapperStyle}
      className={`transition-shadow duration-200`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsActive(false);
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
    >
      <Button variant={variant} className={className} {...buttonProps} />
    </div>
  );
}
