import React from 'react';
import { cn } from '../../lib/utils';

export interface StatusBadgeProps {
  status: 'draft' | 'sent' | 'paid';
  isOverdue?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, isOverdue, className }) => {
  if (isOverdue && status === 'sent') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/80',
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        Overdue
      </span>
    );
  }

  const styles = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    sent: 'bg-blue-50 text-blue-700 border-blue-200',
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const dots = {
    draft: 'bg-slate-400',
    sent: 'bg-blue-500',
    paid: 'bg-emerald-500',
  };

  const labels = {
    draft: 'Draft',
    sent: 'Sent',
    paid: 'Paid',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        styles[status],
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dots[status])} />
      {labels[status]}
    </span>
  );
};
