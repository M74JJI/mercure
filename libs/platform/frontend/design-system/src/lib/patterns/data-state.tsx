import type { HTMLAttributes, ReactNode } from 'react';
import { AlertTriangleIcon, InboxIcon, LoaderCircleIcon } from 'lucide-react';
import { cn } from 'cn';

interface DataStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly action?: ReactNode;
  readonly description?: ReactNode;
  readonly icon?: ReactNode;
  readonly title: ReactNode;
  readonly variant?: 'empty' | 'loading' | 'error';
}

function DataState({
  action,
  className,
  description,
  icon,
  title,
  variant = 'empty',
  ...props
}: DataStateProps) {
  const defaultIcon =
    variant === 'loading' ? (
      <LoaderCircleIcon className="animate-spin" />
    ) : variant === 'error' ? (
      <AlertTriangleIcon />
    ) : (
      <InboxIcon />
    );
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'loading' ? 'polite' : undefined}
      data-slot="data-state"
      data-variant={variant}
      className={cn(
        'flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center',
        variant === 'error' && 'border-destructive/35 bg-destructive/5',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'mb-3 flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-5',
          variant === 'error' && 'bg-destructive/10 text-destructive',
        )}
      >
        {icon ?? defaultIcon}
      </span>
      <strong className="text-sm font-semibold text-foreground">{title}</strong>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export { DataState, type DataStateProps };
