import Link from 'next/link';
import AnimatedCard from '@/components/ui/AnimatedCard';

interface ProductCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  features?: string[];
}

export default function ProductCard({
  title,
  description,
  icon,
  href,
  features,
}: ProductCardProps) {
  return (
    <Link href={href} className="group block">
      <AnimatedCard hover className="h-full">
        <div className="text-4xl">{icon}</div>
        <h3 className="mt-4 text-xl font-semibold text-neutral-900">{title}</h3>
        <p className="mt-2 text-neutral-600">{description}</p>

        {features && features.length > 0 && (
          <ul className="mt-4 space-y-1">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-neutral-500">
                <span className="text-brand-500">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        )}

        <span className="mt-4 inline-block text-sm font-medium text-brand-600">
          Learn more{' '}
          <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
        </span>
      </AnimatedCard>
    </Link>
  );
}
