import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from 'cn';

function Timeline({ className, ...props }: HTMLAttributes<HTMLOListElement>) {
  return (
    <ol
      data-slot="timeline"
      className={cn('relative ml-2 border-l border-border', className)}
      {...props}
    />
  );
}

interface TimelineItemProps extends HTMLAttributes<HTMLLIElement> {
  readonly icon?: ReactNode;
  readonly tone?: 'neutral' | 'positive' | 'warning' | 'critical' | 'info';
}

const dotTones = {
  neutral: 'border-border bg-muted text-muted-foreground',
  positive: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-500',
  warning: 'border-amber-500/40 bg-amber-500/15 text-amber-500',
  critical: 'border-destructive/40 bg-destructive/15 text-destructive',
  info: 'border-sky-500/40 bg-sky-500/15 text-sky-500',
} as const;

function TimelineItem({
  children,
  className,
  icon,
  tone = 'neutral',
  ...props
}: TimelineItemProps) {
  return (
    <li
      data-slot="timeline-item"
      className={cn('relative pb-6 pl-7 last:pb-0', className)}
      {...props}
    >
      <span
        className={cn(
          'absolute -left-3.5 top-0 flex size-7 items-center justify-center rounded-full border-4 border-background [&_svg]:size-3',
          dotTones[tone],
        )}
      >
        {icon ?? <span className="size-1.5 rounded-full bg-current" />}
      </span>
      {children}
    </li>
  );
}

function TimelineTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      data-slot="timeline-title"
      className={cn('text-sm font-semibold text-foreground', className)}
      {...props}
    />
  );
}

function TimelineDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="timeline-description"
      className={cn('mt-1 text-sm leading-5 text-muted-foreground', className)}
      {...props}
    />
  );
}

function TimelineTime({ className, ...props }: HTMLAttributes<HTMLTimeElement>) {
  return (
    <time
      data-slot="timeline-time"
      className={cn('mt-1 block text-xs text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Timeline,
  TimelineDescription,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
  type TimelineItemProps,
};
