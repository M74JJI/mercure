import type { HTMLAttributes } from 'react';
import { cn } from 'cn';

function Toolbar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="toolbar"
      data-slot="toolbar"
      className={cn(
        'flex min-w-0 flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
      {...props}
    />
  );
}

function ToolbarGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="toolbar-group"
      className={cn('flex min-w-0 flex-wrap items-center gap-2', className)}
      {...props}
    />
  );
}

function ToolbarLabel({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot="toolbar-label"
      className={cn(
        'mr-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase',
        className,
      )}
      {...props}
    />
  );
}

export { Toolbar, ToolbarGroup, ToolbarLabel };
