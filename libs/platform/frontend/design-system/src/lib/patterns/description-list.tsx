import type { HTMLAttributes } from 'react';
import { cn } from 'cn';

function DescriptionList({ className, ...props }: HTMLAttributes<HTMLDListElement>) {
  return (
    <dl
      data-slot="description-list"
      className={cn('grid min-w-0 grid-cols-1 gap-x-6 sm:grid-cols-2', className)}
      {...props}
    />
  );
}

function DescriptionItem({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="description-item"
      className={cn('border-b border-border/70 py-3 last:border-b-0', className)}
      {...props}
    />
  );
}

function DescriptionTerm({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <dt
      data-slot="description-term"
      className={cn('text-xs font-medium text-muted-foreground', className)}
      {...props}
    />
  );
}

function DescriptionDetails({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <dd
      data-slot="description-details"
      className={cn('mt-1 break-words text-sm font-medium text-foreground', className)}
      {...props}
    />
  );
}

export { DescriptionDetails, DescriptionItem, DescriptionList, DescriptionTerm };
