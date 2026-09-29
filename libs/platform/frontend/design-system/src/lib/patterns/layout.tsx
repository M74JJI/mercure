import type { HTMLAttributes } from 'react';
import { cn } from 'cn';

type Gap = 'none' | 'xs' | 'sm' | 'default' | 'lg' | 'xl';

const gaps: Record<Gap, string> = {
  none: 'gap-0',
  xs: 'gap-1.5',
  sm: 'gap-2',
  default: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

interface StackProps extends HTMLAttributes<HTMLDivElement> {
  readonly gap?: Gap;
}

function Stack({ className, gap = 'default', ...props }: StackProps) {
  return (
    <div
      data-slot="stack"
      className={cn('flex min-w-0 flex-col', gaps[gap], className)}
      {...props}
    />
  );
}

interface InlineProps extends HTMLAttributes<HTMLDivElement> {
  readonly align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch';
  readonly gap?: Gap;
  readonly justify?: 'start' | 'center' | 'end' | 'between';
  readonly wrap?: boolean;
}

function Inline({
  align = 'center',
  className,
  gap = 'default',
  justify = 'start',
  wrap = true,
  ...props
}: InlineProps) {
  return (
    <div
      data-slot="inline"
      className={cn(
        'flex min-w-0',
        gaps[gap],
        wrap && 'flex-wrap',
        align === 'start' && 'items-start',
        align === 'center' && 'items-center',
        align === 'end' && 'items-end',
        align === 'baseline' && 'items-baseline',
        align === 'stretch' && 'items-stretch',
        justify === 'start' && 'justify-start',
        justify === 'center' && 'justify-center',
        justify === 'end' && 'justify-end',
        justify === 'between' && 'justify-between',
        className,
      )}
      {...props}
    />
  );
}

interface ResponsiveGridProps extends HTMLAttributes<HTMLDivElement> {
  readonly columns?: 1 | 2 | 3 | 4 | 6;
  readonly gap?: Gap;
}

const columns = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
  6: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-6',
} as const;

function ResponsiveGrid({
  className,
  columns: columnCount = 3,
  gap = 'default',
  ...props
}: ResponsiveGridProps) {
  return (
    <div
      data-slot="responsive-grid"
      className={cn('grid min-w-0', columns[columnCount], gaps[gap], className)}
      {...props}
    />
  );
}

interface SplitLayoutProps extends HTMLAttributes<HTMLDivElement> {
  readonly aside?: 'narrow' | 'default' | 'wide';
  readonly reverse?: boolean;
}

function SplitLayout({
  aside = 'default',
  className,
  reverse = false,
  ...props
}: SplitLayoutProps) {
  return (
    <div
      data-slot="split-layout"
      data-reverse={reverse || undefined}
      className={cn(
        'grid min-w-0 grid-cols-1 gap-6 lg:items-start',
        aside === 'narrow' && 'lg:grid-cols-[minmax(0,1fr)_18rem]',
        aside === 'default' && 'lg:grid-cols-[minmax(0,1fr)_22rem]',
        aside === 'wide' && 'lg:grid-cols-[minmax(0,1fr)_28rem]',
        reverse && 'lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1',
        className,
      )}
      {...props}
    />
  );
}

export {
  Inline,
  ResponsiveGrid,
  SplitLayout,
  Stack,
  type InlineProps,
  type ResponsiveGridProps,
  type SplitLayoutProps,
  type StackProps,
};
