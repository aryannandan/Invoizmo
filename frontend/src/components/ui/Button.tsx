import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer';

    const variants = {
      primary:
        'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900 shadow-sm border border-slate-900 hover:border-slate-800',
      secondary:
        'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 shadow-subtle focus:ring-slate-400',
      outline:
        'border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-brand-500',
      ghost:
        'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 focus:ring-slate-400',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-600 shadow-sm border border-rose-600',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5',
      md: 'text-sm px-3.5 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : icon}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
