'use client';

import { CheckIcon, CopyIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from 'cn';

import { Button } from '../ui/button';

interface CodeBlockProps {
  readonly className?: string;
  readonly code: string;
  readonly language?: string;
  readonly title?: string;
}

function CodeBlock({ className, code, language = 'text', title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div
      data-slot="code-block"
      className={cn('overflow-hidden rounded-lg border bg-slate-950 text-slate-100', className)}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="min-w-0">
          {title ? <strong className="block truncate text-xs font-medium">{title}</strong> : null}
          <span className="text-[10px] tracking-wider text-slate-400 uppercase">{language}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-slate-300 hover:bg-white/10 hover:text-white"
          onClick={copy}
          aria-label="Copy code"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-6">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export { CodeBlock, type CodeBlockProps };
