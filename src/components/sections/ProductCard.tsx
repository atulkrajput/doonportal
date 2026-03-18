'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

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
    <Link href={href} className="block">
      <motion.div
        className="h-full rounded-2xl bg-white p-6 shadow-card"
        whileHover={{
          scale: 1.03,
          boxShadow: '0 4px 8px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.12)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
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
          Learn more →
        </span>
      </motion.div>
    </Link>
  );
}
