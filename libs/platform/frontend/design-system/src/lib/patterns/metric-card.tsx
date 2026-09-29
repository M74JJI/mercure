import type { HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

const metricCardVariants = cva('rounded-xl border p-4 shadow-sm sm:p-5', {
  variants: {
    tone: {
      neutral: 'border-border bg-card text-card-foreground',
      positive: 'border-emerald-500/25 bg-emerald-500/5 text-card-foreground',
      warning: 'border-amber-500/25 bg-amber-500/5 text-card-foreground',
      critical: 'border-destructive/30 bg-destructive/5 text-card-foreground',
      info: 'border-sky-500/25 bg-sky-500/5 text-card-foreground',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

interface MetricCardProps
  extends HTMLAttributes<HTMLElement>, VariantProps<typeof metricCardVariants> {
  readonly delta?: ReactNode;
  readonly icon?: ReactNode;
  readonly label: ReactNode;
  readonly value: ReactNode;
}

function MetricCard({ className, delta, icon, label, tone, value, ...props }: MetricCardProps) {
  return (
    <article
      data-slot="metric-card"
      className={cn(metricCardVariants({ tone }), className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>{label}</span>
        {icon ? <span className="text-primary [&_svg]:size-4">{icon}</span> : null}
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <strong className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {value}
        </strong>
        {delta ? <span className="text-xs font-medium text-muted-foreground">{delta}</span> : null}
      </div>
    </article>
  );
}

export { MetricCard, metricCardVariants, type MetricCardProps };
