'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle' | 'glass';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconRight,
  fullWidth = false,
  children,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const sizeClasses = {
    xs: 'h-8 px-3 text-xs',
    sm: 'h-9 px-4 text-sm',
    md: 'h-10 px-5 text-sm',
    lg: 'h-11 px-6 text-sm',
  };

  const variantClasses = {
    primary:
      'text-white bg-primary border border-primary hover:bg-primary-active active:bg-primary-strong transition-colors duration-150',
    secondary:
      'bg-white text-ink border border-hairline hover:bg-canvas-soft hover:border-hairline-strong active:bg-canvas transition-colors duration-150',
    ghost:
      'text-ink-body hover:bg-canvas-soft hover:text-ink transition-colors duration-150',
    danger:
      'bg-danger text-white border border-danger hover:bg-danger-strong active:bg-danger-strong transition-colors duration-150',
    subtle:
      'bg-primary-subtle text-primary border border-primary-border hover:bg-primary/10 transition-colors duration-150',
    glass:
      'bg-white/60 text-ink border border-white/60 backdrop-blur-sm hover:bg-white/80 hover:border-hairline transition-colors duration-150',
  };

  const baseClasses =
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-center outline-none select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
      {!loading && icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
}
