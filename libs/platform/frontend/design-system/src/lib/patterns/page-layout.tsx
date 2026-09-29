import type { HTMLAttributes } from 'react';
import { cn } from 'cn';

interface PageLayoutProps extends HTMLAttributes<HTMLDivElement> {
  readonly width?: 'default' | 'wide' | 'full';
}

function PageLayout({ className, width = 'wide', ...props }: PageLayoutProps) {
  return (
    <div
      data-slot="page-layout"
      data-width={width}
      className={cn(
        'mx-auto flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:gap-8 lg:px-8 lg:py-8',
        width === 'default' && 'max-w-6xl',
        width === 'wide' && 'max-w-[1600px]',
        width === 'full' && 'max-w-none',
        className,
      )}
      {...props}
    />
  );
}

function PageLayoutHeader({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <header
      data-slot="page-layout-header"
      className={cn('flex flex-col justify-between gap-4 lg:flex-row lg:items-end', className)}
      {...props}
    />
  );
}

function PageLayoutHeading({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="page-layout-heading"
      className={cn('min-w-0 max-w-4xl', className)}
      {...props}
    />
  );
}

function PageLayoutEyebrow({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="page-layout-eyebrow"
      className={cn(
        'mb-2 text-xs font-semibold tracking-[0.16em] text-primary uppercase',
        className,
      )}
      {...props}
    />
  );
}

function PageLayoutTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      data-slot="page-layout-title"
      className={cn('text-2xl font-semibold tracking-tight text-foreground sm:text-3xl', className)}
      {...props}
    />
  );
}

function PageLayoutDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="page-layout-description"
      className={cn(
        'mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base',
        className,
      )}
      {...props}
    />
  );
}

function PageLayoutActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="page-layout-actions"
      className={cn('flex shrink-0 flex-wrap items-center gap-2', className)}
      {...props}
    />
  );
}

function PageLayoutBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="page-layout-body" className={cn('min-w-0', className)} {...props} />;
}

export {
  PageLayout,
  PageLayoutActions,
  PageLayoutBody,
  PageLayoutDescription,
  PageLayoutEyebrow,
  PageLayoutHeader,
  PageLayoutHeading,
  PageLayoutTitle,
  type PageLayoutProps,
};
