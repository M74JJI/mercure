import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

const sectionVariants = cva('rounded-xl border', {
  variants: {
    tone: {
      default: 'border-border bg-card text-card-foreground shadow-sm',
      muted: 'border-border/70 bg-muted/30 text-foreground',
      transparent: 'border-transparent bg-transparent text-foreground',
      elevated: 'border-border bg-card text-card-foreground shadow-lg shadow-black/10',
    },
    padding: {
      none: '',
      sm: 'p-3 sm:p-4',
      default: 'p-4 sm:p-5',
      lg: 'p-5 sm:p-6 lg:p-8',
    },
  },
  defaultVariants: { tone: 'default', padding: 'default' },
});

interface SectionProps extends HTMLAttributes<HTMLElement>, VariantProps<typeof sectionVariants> {}

function Section({ className, tone, padding, ...props }: SectionProps) {
  return (
    <section
      data-slot="section"
      data-tone={tone}
      className={cn(sectionVariants({ tone, padding }), className)}
      {...props}
    />
  );
}

function SectionHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="section-header"
      className={cn(
        'mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start',
        className,
      )}
      {...props}
    />
  );
}

function SectionTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      data-slot="section-title"
      className={cn('text-base font-semibold text-foreground', className)}
      {...props}
    />
  );
}

function SectionDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="section-description"
      className={cn('mt-1 text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

function SectionActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="section-actions"
      className={cn('flex shrink-0 items-center gap-2', className)}
      {...props}
    />
  );
}

function SectionContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="section-content" className={cn('min-w-0', className)} {...props} />;
}

export {
  Section,
  SectionActions,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle,
  sectionVariants,
};
