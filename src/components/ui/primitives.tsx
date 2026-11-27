import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-10 sm:h-9 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-base sm:text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'flex min-h-[84px] w-full rounded-lg border border-input bg-background px-3 py-2 text-base sm:text-sm shadow-sm transition-colors placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('text-xs font-medium leading-none text-foreground/80 peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)}
      {...props}
    />
  ),
);
Label.displayName = 'Label';

export function Badge({
  className,
  variant = 'secondary',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'secondary' | 'outline' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        variant === 'default' && 'bg-primary text-primary-foreground',
        variant === 'secondary' && 'bg-secondary text-secondary-foreground',
        variant === 'outline' && 'border border-border text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-xl border border-border bg-card text-card-foreground shadow-soft', className)} {...props} />;
}
