'use client';

import {
  CheckIcon,
  ChevronRightIcon,
  CircleHelpIcon,
  ClipboardCheckIcon,
  CopyIcon,
  DatabaseIcon,
  InfoIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TerminalIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Progress } from '../ui/progress';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Skeleton } from '../ui/skeleton';
import { Slider } from '../ui/slider';
import { Spinner } from '../ui/spinner';
import { Switch } from '../ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { Toggle } from '../ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

import styles from './design-system-catalog.module.css';

type Category =
  | 'Actions'
  | 'AI surfaces'
  | 'Data display'
  | 'Feedback'
  | 'Forms'
  | 'Layout'
  | 'Navigation'
  | 'Overlays';

interface CatalogEntry {
  readonly id: string;
  readonly name: string;
  readonly exportName: string;
  readonly category: Category;
  readonly description: string;
  readonly variants: readonly string[];
  readonly sizes: readonly string[];
  readonly states: readonly string[];
}

const GROUPS: Readonly<Record<Category, readonly string[]>> = {
  Actions: ['button', 'button-group', 'toggle', 'toggle-group'],
  Forms: [
    'checkbox',
    'combobox',
    'field',
    'form',
    'input',
    'input-group',
    'input-otp',
    'label',
    'native-select',
    'radio-group',
    'select',
    'slider',
    'switch',
    'textarea',
  ],
  Feedback: ['alert', 'empty', 'progress', 'skeleton', 'sonner', 'spinner'],
  Navigation: [
    'breadcrumb',
    'command',
    'dropdown-menu',
    'menubar',
    'navigation-menu',
    'pagination',
    'sidebar',
    'tabs',
  ],
  'Data display': [
    'accordion',
    'aspect-ratio',
    'attachment',
    'avatar',
    'badge',
    'calendar',
    'card',
    'carousel',
    'chart',
    'item',
    'kbd',
    'marker',
    'table',
  ],
  Overlays: [
    'alert-dialog',
    'context-menu',
    'dialog',
    'drawer',
    'hover-card',
    'popover',
    'sheet',
    'tooltip',
  ],
  Layout: ['collapsible', 'direction', 'resizable', 'scroll-area', 'separator'],
  'AI surfaces': ['bubble', 'message', 'message-scroller'],
};

const EXPORT_NAMES: Readonly<Record<string, string>> = {
  'alert-dialog': 'AlertDialog',
  'aspect-ratio': 'AspectRatio',
  'button-group': 'ButtonGroup',
  'context-menu': 'ContextMenu',
  'dropdown-menu': 'DropdownMenu',
  'hover-card': 'HoverCard',
  'input-group': 'InputGroup',
  'input-otp': 'InputOTP',
  'message-scroller': 'MessageScroller',
  'native-select': 'NativeSelect',
  'navigation-menu': 'NavigationMenu',
  'radio-group': 'RadioGroup',
  'scroll-area': 'ScrollArea',
  'toggle-group': 'ToggleGroup',
};

const DESCRIPTIONS: Readonly<Record<string, string>> = {
  accordion: 'Progressively disclose related content while preserving a compact page hierarchy.',
  alert: 'Communicate important system information with semantic emphasis and optional actions.',
  'alert-dialog': 'Request explicit confirmation before a consequential or destructive operation.',
  attachment: 'Represent a file, upload, or evidence artifact in analyst workflows.',
  badge: 'Apply a compact status, role, severity, or classification label.',
  button: 'Trigger a user action with consistent hierarchy, sizing, loading, and disabled states.',
  chart: 'Compose accessible Recharts visualizations using the Mercure theme contract.',
  combobox: 'Search and select from a large option set with keyboard navigation.',
  dialog: 'Present focused tasks without navigating away from the current workspace.',
  field: 'Compose labels, controls, descriptions, validation, and grouped form structure.',
  form: 'Connect React Hook Form validation to accessible shadcn field primitives.',
  input: 'Capture a single line of text, search criteria, identifiers, or numeric values.',
  message: 'Display structured analyst or assistant messages with composable content regions.',
  select: 'Choose one value from a controlled list using an accessible popover.',
  sidebar: 'Build collapsible application navigation with desktop and mobile behavior.',
  sonner: 'Publish transient success, warning, error, and progress notifications.',
  table: 'Present dense operational records with clear row and column relationships.',
  tabs: 'Switch between related views without losing the page context.',
  tooltip: 'Provide short supplementary labels for icon-only or unfamiliar controls.',
};

function titleCase(value: string): string {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function optionsFor(id: string): Pick<CatalogEntry, 'variants' | 'sizes' | 'states'> {
  if (id === 'button') {
    return {
      variants: ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'],
      sizes: ['xs', 'sm', 'default', 'lg', 'icon'],
      states: ['default', 'hover', 'focus-visible', 'disabled', 'loading'],
    };
  }
  if (id === 'badge') {
    return {
      variants: ['default', 'secondary', 'outline', 'destructive'],
      sizes: ['default'],
      states: ['default', 'with icon', 'removable'],
    };
  }
  if (id === 'alert') {
    return {
      variants: ['default', 'destructive'],
      sizes: ['default'],
      states: ['informational', 'warning', 'error', 'success'],
    };
  }
  if (id === 'toggle' || id === 'toggle-group') {
    return {
      variants: ['default', 'outline'],
      sizes: ['sm', 'default', 'lg'],
      states: ['off', 'on', 'disabled'],
    };
  }
  if (['sheet', 'drawer'].includes(id)) {
    return {
      variants: ['left', 'right', 'top', 'bottom'],
      sizes: ['content', 'sm', 'lg'],
      states: ['closed', 'open'],
    };
  }
  if (['input', 'textarea', 'select', 'combobox', 'native-select', 'input-otp'].includes(id)) {
    return {
      variants: ['default', 'invalid'],
      sizes: ['default', 'compact'],
      states: ['empty', 'filled', 'focus-visible', 'disabled', 'read-only'],
    };
  }
  if (['dialog', 'alert-dialog', 'popover', 'tooltip', 'hover-card', 'context-menu'].includes(id)) {
    return {
      variants: ['default'],
      sizes: ['content', 'sm', 'lg'],
      states: ['closed', 'open', 'keyboard focus'],
    };
  }
  if (['checkbox', 'radio-group', 'switch', 'slider'].includes(id)) {
    return {
      variants: ['default'],
      sizes: ['default'],
      states: ['unchecked', 'checked', 'indeterminate', 'disabled', 'invalid'],
    };
  }
  return {
    variants: ['default'],
    sizes: ['default'],
    states: ['default', 'interactive', 'disabled'],
  };
}

const COMPONENTS: readonly CatalogEntry[] = Object.entries(GROUPS).flatMap(([category, ids]) =>
  ids.map((id) => {
    const options = optionsFor(id);
    return {
      id,
      name: titleCase(id),
      exportName: EXPORT_NAMES[id] ?? titleCase(id).replaceAll(' ', ''),
      category: category as Category,
      description:
        DESCRIPTIONS[id] ??
        `A production-ready ${titleCase(id).toLowerCase()} primitive for consistent Mercure interfaces.`,
      ...options,
    };
  }),
);

function findComponent(id: string): CatalogEntry {
  const component =
    COMPONENTS.find((entry) => entry.id === id) ??
    COMPONENTS.find((entry) => entry.id === 'button');
  if (component === undefined) {
    throw new Error('The design-system catalog must define a default component.');
  }
  return component;
}

type ButtonVariant = NonNullable<React.ComponentProps<typeof Button>['variant']>;
type ButtonSize = NonNullable<React.ComponentProps<typeof Button>['size']>;
type BadgeVariant = NonNullable<React.ComponentProps<typeof Badge>['variant']>;
type AlertVariant = NonNullable<React.ComponentProps<typeof Alert>['variant']>;
type ToggleVariant = NonNullable<React.ComponentProps<typeof Toggle>['variant']>;
type ToggleSize = NonNullable<React.ComponentProps<typeof Toggle>['size']>;

function GenericSpecimen({ entry }: { readonly entry: CatalogEntry }) {
  return (
    <div className={styles.genericSpecimen}>
      <span className={styles.genericIcon}>
        <SparklesIcon />
      </span>
      <div>
        <strong>{entry.name}</strong>
        <p>{entry.description}</p>
      </div>
      <Badge variant="outline">Installed</Badge>
    </div>
  );
}

function ComponentSpecimen({
  entry,
  size,
  variant,
}: {
  readonly entry: CatalogEntry;
  readonly size: string;
  readonly variant: string;
}) {
  switch (entry.id) {
    case 'button':
      return (
        <Button variant={variant as ButtonVariant} size={size as ButtonSize}>
          <ShieldCheckIcon /> Authorize action
        </Button>
      );
    case 'badge':
      return <Badge variant={variant as BadgeVariant}>Operational</Badge>;
    case 'alert':
      return (
        <Alert variant={variant as AlertVariant} className={styles.specimenAlert}>
          <InfoIcon />
          <AlertTitle>Telemetry pipeline healthy</AlertTitle>
          <AlertDescription>All events were processed inside the target SLO.</AlertDescription>
        </Alert>
      );
    case 'avatar':
      return (
        <Avatar className="size-12">
          <AvatarFallback>MH</AvatarFallback>
        </Avatar>
      );
    case 'breadcrumb':
      return (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Platform</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Design system</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
    case 'card':
      return (
        <Card className={styles.sampleCard}>
          <CardHeader>
            <CardTitle>Detection coverage</CardTitle>
            <CardDescription>Current protected surface</CardDescription>
          </CardHeader>
          <CardContent>
            <strong className={styles.metric}>98.7%</strong>
          </CardContent>
        </Card>
      );
    case 'checkbox':
      return (
        <div className={styles.controlRow}>
          <Checkbox id="sample-checkbox" defaultChecked />
          <Label htmlFor="sample-checkbox">Include resolved events</Label>
        </div>
      );
    case 'input':
      return (
        <Input
          className={styles.controlWidth}
          placeholder="Search components…"
          aria-invalid={variant === 'invalid'}
        />
      );
    case 'textarea':
      return (
        <Textarea
          className={styles.controlWidth}
          placeholder="Add investigation notes…"
          aria-invalid={variant === 'invalid'}
        />
      );
    case 'select':
      return (
        <Select defaultValue="critical">
          <SelectTrigger className={styles.controlWidth}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
          </SelectContent>
        </Select>
      );
    case 'radio-group':
      return (
        <RadioGroup defaultValue="live" className={styles.radioGroup}>
          <div className={styles.controlRow}>
            <RadioGroupItem id="live" value="live" />
            <Label htmlFor="live">Live</Label>
          </div>
          <div className={styles.controlRow}>
            <RadioGroupItem id="staged" value="staged" />
            <Label htmlFor="staged">Staged</Label>
          </div>
        </RadioGroup>
      );
    case 'switch':
      return (
        <div className={styles.controlRow}>
          <Switch id="sample-switch" defaultChecked />
          <Label htmlFor="sample-switch">Automatic refresh</Label>
        </div>
      );
    case 'slider':
      return <Slider className={styles.controlWidth} defaultValue={[68]} max={100} step={1} />;
    case 'progress':
      return (
        <div className={styles.controlStack}>
          <Progress value={72} />
          <span>72% complete</span>
        </div>
      );
    case 'skeleton':
      return (
        <div className={styles.skeletonStack}>
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-20 w-72" />
        </div>
      );
    case 'spinner':
      return (
        <div className={styles.controlRow}>
          <Spinner /> Loading telemetry
        </div>
      );
    case 'separator':
      return (
        <div className={styles.separatorSample}>
          <span>Environment</span>
          <Separator />
          <span>Production</span>
        </div>
      );
    case 'tabs':
      return (
        <Tabs defaultValue="overview" className={styles.tabsSample}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">Healthy services and current security posture.</TabsContent>
          <TabsContent value="events">No unresolved critical events.</TabsContent>
        </Tabs>
      );
    case 'accordion':
      return (
        <Accordion type="single" collapsible className={styles.controlWidth}>
          <AccordionItem value="architecture">
            <AccordionTrigger>Architecture guidance</AccordionTrigger>
            <AccordionContent>
              Keep capability code inside its owning module boundary.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="security">
            <AccordionTrigger>Security guidance</AccordionTrigger>
            <AccordionContent>Enforce authorization at the API boundary.</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    case 'dialog':
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create workspace</DialogTitle>
              <DialogDescription>
                Configure a focused task without leaving the current page.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );
    case 'popover':
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Open popover</Button>
          </PopoverTrigger>
          <PopoverContent>Compact supporting controls belong here.</PopoverContent>
        </Popover>
      );
    case 'tooltip':
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="outline">
                <CircleHelpIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View component guidance</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    case 'table':
      return (
        <Table className={styles.tableSample}>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Latency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>API</TableCell>
              <TableCell>
                <Badge>Healthy</Badge>
              </TableCell>
              <TableCell>42 ms</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Identity</TableCell>
              <TableCell>
                <Badge variant="secondary">Stable</Badge>
              </TableCell>
              <TableCell>86 ms</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
    case 'toggle':
      return (
        <Toggle
          variant={variant as ToggleVariant}
          size={size as ToggleSize}
          aria-label="Toggle terminal view"
        >
          <TerminalIcon /> Terminal
        </Toggle>
      );
    case 'toggle-group':
      return (
        <ToggleGroup
          type="single"
          variant={variant as ToggleVariant}
          size={size as ToggleSize}
          defaultValue="grid"
        >
          <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
          <ToggleGroupItem value="list">List</ToggleGroupItem>
        </ToggleGroup>
      );
    default:
      return <GenericSpecimen entry={entry} />;
  }
}

function usageFor(entry: CatalogEntry, variant: string, size: string): string {
  const options = [
    entry.variants.length > 1 ? `variant="${variant}"` : '',
    entry.sizes.length > 1 ? `size="${size}"` : '',
  ]
    .filter(Boolean)
    .join(' ');
  return `import { ${entry.exportName} } from '@mercure/platform-frontend-design-system/ui/${entry.id}';\n\nexport function Example() {\n  return <${entry.exportName}${options ? ` ${options}` : ''}>Content</${entry.exportName}>;\n}`;
}

export function DesignSystemCatalog() {
  const [selectedId, setSelectedId] = useState('button');
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'api' | 'usage' | 'accessibility'>(
    'preview',
  );
  const [variant, setVariant] = useState('default');
  const [size, setSize] = useState('default');
  const [copied, setCopied] = useState(false);

  const selected = findComponent(selectedId);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized
      ? COMPONENTS.filter((entry) =>
          `${entry.name} ${entry.category}`.toLowerCase().includes(normalized),
        )
      : COMPONENTS;
  }, [query]);

  function choose(entry: CatalogEntry) {
    setSelectedId(entry.id);
    setVariant(entry.variants[0] ?? 'default');
    setSize(entry.sizes[0] ?? 'default');
    setActiveTab('preview');
  }

  async function copyUsage() {
    await navigator.clipboard.writeText(usageFor(selected, variant, size));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className={styles.catalog}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            <SparklesIcon /> Platform foundation
          </span>
          <h1>Mercure design system</h1>
          <p>
            One production-ready component language for every security module. Inspect behavior,
            select variants, review props, and copy the exact package import.
          </p>
        </div>
        <div className={styles.heroStats}>
          <div>
            <strong>61</strong>
            <span>components</span>
          </div>
          <div>
            <strong>8</strong>
            <span>families</span>
          </div>
          <div>
            <strong>AA</strong>
            <span>accessibility target</span>
          </div>
        </div>
      </section>

      <div className={styles.workspace}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div>
              <span>Component library</span>
              <strong>{filtered.length} available</strong>
            </div>
            <label className={styles.search}>
              <SearchIcon />
              <span className={styles.srOnly}>Search components</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search…"
              />
            </label>
          </div>
          <nav aria-label="Design system components" className={styles.componentNav}>
            {(Object.keys(GROUPS) as Category[]).map((category) => {
              const entries = filtered.filter((entry) => entry.category === category);
              if (entries.length === 0) return null;
              return (
                <div key={category} className={styles.category}>
                  <div className={styles.categoryTitle}>
                    <span>{category}</span>
                    <small>{entries.length}</small>
                  </div>
                  {entries.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => choose(entry)}
                      data-active={entry.id === selected.id || undefined}
                    >
                      <span>{entry.name}</span>
                      <ChevronRightIcon />
                    </button>
                  ))}
                </div>
              );
            })}
          </nav>
        </aside>

        <main className={styles.detail}>
          <header className={styles.componentHeader}>
            <div>
              <span className={styles.categoryPill}>{selected.category}</span>
              <h2>{selected.name}</h2>
              <p>{selected.description}</p>
            </div>
            <div className={styles.importPath}>
              <span>Import</span>
              <code>@mercure/platform-frontend-design-system/ui/{selected.id}</code>
            </div>
          </header>

          <div className={styles.tabBar} role="tablist" aria-label="Component documentation">
            {(['preview', 'api', 'usage', 'accessibility'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              >
                {titleCase(tab)}
              </button>
            ))}
          </div>

          {activeTab === 'preview' ? (
            <div className={styles.previewContent}>
              <section className={styles.previewPanel}>
                <div className={styles.previewToolbar}>
                  <div>
                    <span>Live preview</span>
                    <small>Interactive production component</small>
                  </div>
                  <div className={styles.controls}>
                    <label>
                      Variant
                      <select value={variant} onChange={(event) => setVariant(event.target.value)}>
                        {selected.variants.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Size
                      <select value={size} onChange={(event) => setSize(event.target.value)}>
                        {selected.sizes.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
                <div className={styles.stage}>
                  <div className={styles.stageGrid} />
                  <ComponentSpecimen entry={selected} variant={variant} size={size} />
                </div>
              </section>

              <section className={styles.matrixSection}>
                <div className={styles.sectionHeading}>
                  <div>
                    <span>Variant matrix</span>
                    <h3>Every supported visual option</h3>
                  </div>
                  <Badge variant="outline">
                    {selected.variants.length} variants · {selected.sizes.length} sizes
                  </Badge>
                </div>
                <div className={styles.variantGrid}>
                  {selected.variants.flatMap((variantOption) =>
                    selected.sizes.map((sizeOption) => (
                      <article
                        key={`${variantOption}-${sizeOption}`}
                        className={styles.variantCard}
                      >
                        <div>
                          <strong>{variantOption}</strong>
                          <span>{sizeOption}</span>
                        </div>
                        <div className={styles.variantSpecimen}>
                          <ComponentSpecimen
                            entry={selected}
                            variant={variantOption}
                            size={sizeOption}
                          />
                        </div>
                      </article>
                    )),
                  )}
                </div>
              </section>
            </div>
          ) : null}

          {activeTab === 'api' ? (
            <section className={styles.docSection}>
              <div className={styles.sectionHeading}>
                <div>
                  <span>Component contract</span>
                  <h3>Props and accepted values</h3>
                </div>
              </div>
              <div className={styles.apiTable} role="table">
                <div role="row" className={styles.apiHeader}>
                  <span>Prop</span>
                  <span>Type / values</span>
                  <span>Default</span>
                  <span>Purpose</span>
                </div>
                <div role="row">
                  <code>variant</code>
                  <span>{selected.variants.map((item) => `“${item}”`).join(' | ')}</span>
                  <span>{selected.variants[0]}</span>
                  <span>Visual hierarchy and semantic emphasis.</span>
                </div>
                <div role="row">
                  <code>size</code>
                  <span>{selected.sizes.map((item) => `“${item}”`).join(' | ')}</span>
                  <span>{selected.sizes[0]}</span>
                  <span>Density and target dimensions.</span>
                </div>
                <div role="row">
                  <code>className</code>
                  <span>string</span>
                  <span>—</span>
                  <span>Scoped layout adjustment; do not replace core states.</span>
                </div>
                <div role="row">
                  <code>children</code>
                  <span>ReactNode</span>
                  <span>—</span>
                  <span>Accessible visible content or composed primitives.</span>
                </div>
                <div role="row">
                  <code>disabled</code>
                  <span>boolean</span>
                  <span>false</span>
                  <span>Blocks interaction and exposes disabled semantics.</span>
                </div>
              </div>
              <div className={styles.stateList}>
                <h4>Supported states</h4>
                {selected.states.map((state) => (
                  <span key={state}>
                    <CheckIcon />
                    {state}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === 'usage' ? (
            <section className={styles.docSection}>
              <div className={styles.sectionHeading}>
                <div>
                  <span>Implementation</span>
                  <h3>Import and compose by component name</h3>
                </div>
                <Button variant="outline" size="sm" onClick={copyUsage}>
                  {copied ? <ClipboardCheckIcon /> : <CopyIcon />}
                  {copied ? 'Copied' : 'Copy code'}
                </Button>
              </div>
              <pre className={styles.codeBlock}>
                <code>{usageFor(selected, variant, size)}</code>
              </pre>
              <div className={styles.guidanceGrid}>
                <article>
                  <DatabaseIcon />
                  <div>
                    <strong>Import from the package</strong>
                    <p>
                      Use the exported subpath. Never reach into the library’s source folders from a
                      feature module.
                    </p>
                  </div>
                </article>
                <article>
                  <ShieldCheckIcon />
                  <div>
                    <strong>Preserve semantics</strong>
                    <p>
                      Choose variants by meaning: destructive for dangerous actions, secondary for
                      lower emphasis.
                    </p>
                  </div>
                </article>
                <article>
                  <TerminalIcon />
                  <div>
                    <strong>Compose primitives</strong>
                    <p>
                      Complex components expose named parts so feature code controls content without
                      restyling internals.
                    </p>
                  </div>
                </article>
              </div>
            </section>
          ) : null}

          {activeTab === 'accessibility' ? (
            <section className={styles.docSection}>
              <div className={styles.sectionHeading}>
                <div>
                  <span>Accessibility contract</span>
                  <h3>Required implementation behavior</h3>
                </div>
                <Badge>
                  <ShieldCheckIcon /> WCAG 2.2 AA target
                </Badge>
              </div>
              <div className={styles.accessibilityList}>
                <article>
                  <span>01</span>
                  <div>
                    <strong>Use the semantic primitive</strong>
                    <p>
                      Keep the rendered element and ARIA contract supplied by the component. Use{' '}
                      <code>asChild</code> only when the child preserves the same behavior.
                    </p>
                  </div>
                </article>
                <article>
                  <span>02</span>
                  <div>
                    <strong>Supply an accessible name</strong>
                    <p>
                      Icon-only controls require a visible label, <code>aria-label</code>, or an
                      associated tooltip. Form controls require a label.
                    </p>
                  </div>
                </article>
                <article>
                  <span>03</span>
                  <div>
                    <strong>Keep keyboard behavior intact</strong>
                    <p>
                      Do not intercept Escape, Enter, Space, arrow keys, focus trapping, or roving
                      tab index implemented by the primitive.
                    </p>
                  </div>
                </article>
                <article>
                  <span>04</span>
                  <div>
                    <strong>Expose status changes</strong>
                    <p>
                      Validation, loading, completion, and errors must use text and semantics in
                      addition to color.
                    </p>
                  </div>
                </article>
              </div>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
