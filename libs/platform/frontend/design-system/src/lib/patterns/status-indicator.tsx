import type { HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

const statusIndicatorVariants = cva('inline-flex w-fit items-center gap-2 text-sm font-medium', {
  variants: {
    tone: {
      neutral: 'text-muted-foreground',
      positive: 'text-emerald-600 dark:text-emerald-400',
      warning: 'text-amber-600 dark:text-amber-400',
      critical: 'text-destructive',
      info: 'text-sky-600 dark:text-sky-400',
    },
    size: { sm: 'text-xs', default: 'text-sm', lg: 'text-base' },
  },
  defaultVariants: { tone: 'neutral', size: 'default' },
});

interface StatusIndicatorProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof statusIndicatorVariants> {
  readonly children: ReactNode;
  readonly pulse?: boolean;
}

function StatusIndicator({
  children,
  className,
  pulse = false,
  size,
  tone = 'neutral',
  ...props
}: StatusIndicatorProps) {
  return (
    <span
      data-slot="status-indicator"
      className={cn(statusIndicatorVariants({ tone, size }), className)}
      {...props}
    >
      <span className="relative flex size-2 shrink-0">
        {pulse ? (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-40" />
        ) : null}
        <span className="relative inline-flex size-2 rounded-full bg-current" />
      </span>
      {children}
    </span>
  );
}

export { StatusIndicator, statusIndicatorVariants, type StatusIndicatorProps };
