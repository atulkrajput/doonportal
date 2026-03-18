interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-body-sm font-medium text-brand-700 ${className}`}
    >
      {children}
    </span>
  );
}
