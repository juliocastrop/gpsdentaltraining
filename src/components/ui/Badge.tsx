import type { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'gold' | 'blue' | 'navy' | 'success' | 'warning' | 'danger' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  className?: string;
}

export default function Badge({
  variant = 'gold',
  size = 'md',
  children,
  className = '',
}: BadgeProps) {
  const variants = {
    gold: 'bg-gps-gold text-gps-navy-dark',
    blue: 'bg-gps-blue text-white',
    navy: 'bg-gps-navy text-white',
    success: 'bg-gps-success text-white',
    warning: 'bg-gps-warning text-gps-navy-dark',
    danger: 'bg-gps-danger text-white',
    gray: 'bg-gray-200 text-gray-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
}
