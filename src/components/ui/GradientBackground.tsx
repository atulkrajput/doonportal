export interface GradientBackgroundProps {
  children: React.ReactNode;
  colors?: string[];
  animated?: boolean;
  className?: string;
}

const defaultColors = ['from-brand-600', 'via-brand-500', 'to-accent-500'];

export default function GradientBackground({
  children,
  colors = defaultColors,
  animated = false,
  className = '',
}: GradientBackgroundProps) {
  const gradientClasses = `bg-gradient-to-br ${colors.join(' ')}`;
  const animationClass = animated ? 'animate-gradient' : '';

  return (
    <div
      className={`relative ${gradientClasses} ${animationClass} ${className}`}
    >
      {children}
    </div>
  );
}
