'use client';

import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  hover?: boolean;
  className?: string;
}

export default function Card({ children, hover = false, className = '' }: CardProps) {
  const base = 'rounded-2xl bg-white shadow-card p-6';

  if (hover) {
    return (
      <motion.div
        className={`${base} ${className}`}
        whileHover={{ scale: 1.02, boxShadow: '0 4px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.1)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={`${base} ${className}`}>{children}</div>;
}
