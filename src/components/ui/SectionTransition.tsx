export interface SectionTransitionProps {
  variant?: 'wave' | 'gradient-fade' | 'soft-color';
  fromColor?: string;
  toColor?: string;
  className?: string;
}

function WaveDivider({ fromColor, toColor, className }: Omit<SectionTransitionProps, 'variant'>) {
  return (
    <div aria-hidden="true" className={`relative w-full overflow-hidden ${className ?? ''}`}>
      <svg
        viewBox="0 0 1440 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block w-full h-[60px] md:h-[80px]"
        preserveAspectRatio="none"
      >
        <path
          d="M0 40C240 80 480 0 720 40C960 80 1200 0 1440 40V80H0V40Z"
          className={fromColor ?? 'fill-brand-100'}
        />
        <path
          d="M0 56C240 80 480 32 720 56C960 80 1200 32 1440 56V80H0V56Z"
          className={toColor ?? 'fill-brand-50'}
        />
      </svg>
    </div>
  );
}

function GradientFade({ fromColor, toColor, className }: Omit<SectionTransitionProps, 'variant'>) {
  const from = fromColor ?? 'from-brand-50';
  const to = toColor ?? 'to-white';

  return (
    <div
      aria-hidden="true"
      className={`w-full h-24 md:h-32 bg-gradient-to-b ${from} ${to} ${className ?? ''}`}
    />
  );
}

function SoftColor({ fromColor, toColor, className }: Omit<SectionTransitionProps, 'variant'>) {
  const from = fromColor ?? 'from-brand-50';
  const to = toColor ?? 'to-brand-100';

  return (
    <div
      aria-hidden="true"
      className={`w-full h-8 md:h-12 bg-gradient-to-b ${from} via-accent-50 ${to} ${className ?? ''}`}
    />
  );
}

export default function SectionTransition({
  variant = 'gradient-fade',
  fromColor,
  toColor,
  className,
}: SectionTransitionProps) {
  switch (variant) {
    case 'wave':
      return <WaveDivider fromColor={fromColor} toColor={toColor} className={className} />;
    case 'soft-color':
      return <SoftColor fromColor={fromColor} toColor={toColor} className={className} />;
    case 'gradient-fade':
    default:
      return <GradientFade fromColor={fromColor} toColor={toColor} className={className} />;
  }
}
