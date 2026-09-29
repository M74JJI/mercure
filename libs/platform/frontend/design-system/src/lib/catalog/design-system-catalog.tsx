'use client';

import {
  CheckIcon,
  ChevronRightIcon,
  CircleHelpIcon,
  ClipboardCheckIcon,
  CopyIcon,
  DatabaseIcon,
  FileTextIcon,
  InboxIcon,
  InfoIcon,
  MoreHorizontalIcon,
  SearchIcon,
  SendIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TerminalIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { toast } from 'sonner';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { AspectRatio } from '../ui/aspect-ratio';
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '../ui/attachment';
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
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from '../ui/button-group';
import { Bubble, BubbleContent, BubbleGroup } from '../ui/bubble';
import { Calendar } from '../ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../ui/carousel';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { Checkbox } from '../ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '../ui/combobox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '../ui/command';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '../ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { DirectionProvider } from '../ui/direction';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../ui/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../ui/empty';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '../ui/field';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card';
import { Input } from '../ui/input';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '../ui/input-group';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '../ui/input-otp';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '../ui/item';
import { Kbd, KbdGroup } from '../ui/kbd';
import { Label } from '../ui/label';
import { Marker, MarkerContent, MarkerIcon } from '../ui/marker';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarShortcut,
  MenubarTrigger,
} from '../ui/menubar';
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from '../ui/message';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '../ui/message-scroller';
import { NativeSelect, NativeSelectOption } from '../ui/native-select';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '../ui/navigation-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../ui/pagination';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Progress } from '../ui/progress';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '../ui/sidebar';
import { Skeleton } from '../ui/skeleton';
import { Slider } from '../ui/slider';
import { Spinner } from '../ui/spinner';
import { Switch } from '../ui/switch';
import { Toaster } from '../ui/sonner';
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

function FormSpecimen() {
  const form = useForm<{ query: string }>({ defaultValues: { query: '' } });

  return (
    <Form {...form}>
      <form className={styles.controlStack} onSubmit={form.handleSubmit(() => undefined)}>
        <FormField
          control={form.control}
          name="query"
          rules={{ required: 'Search value is required.' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Investigation query</FormLabel>
              <FormControl>
                <Input placeholder="event.dataset:security" {...field} />
              </FormControl>
              <FormDescription>Lucene syntax supported.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="sm">
          Validate query
        </Button>
      </form>
    </Form>
  );
}

const CHART_DATA = [
  { hour: '08:00', events: 42 },
  { hour: '10:00', events: 68 },
  { hour: '12:00', events: 51 },
  { hour: '14:00', events: 87 },
] as const;

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
    case 'button-group':
      return (
        <ButtonGroup>
          <Button variant="outline">Acknowledge</Button>
          <ButtonGroupSeparator />
          <ButtonGroupText>3 alerts</ButtonGroupText>
          <ButtonGroupSeparator />
          <Button variant="outline" size="icon" aria-label="More actions">
            <MoreHorizontalIcon />
          </Button>
        </ButtonGroup>
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
    case 'empty':
      return (
        <Empty className={styles.controlWidth}>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <InboxIcon />
            </EmptyMedia>
            <EmptyTitle>No open findings</EmptyTitle>
            <EmptyDescription>New findings appear here after collection.</EmptyDescription>
          </EmptyHeader>
        </Empty>
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
    case 'command':
      return (
        <Command className={styles.controlWidth}>
          <CommandInput placeholder="Jump to…" />
          <CommandList>
            <CommandEmpty>No command found.</CommandEmpty>
            <CommandGroup heading="Platform">
              <CommandItem>
                <ShieldCheckIcon /> Security status <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <DatabaseIcon /> Audit events <CommandShortcut>⌘A</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );
    case 'dropdown-menu':
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Case actions</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Assign analyst</DropdownMenuItem>
            <DropdownMenuItem>Export evidence</DropdownMenuItem>
            <DropdownMenuItem variant="destructive">Close incident</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    case 'menubar':
      return (
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Case</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                New investigation <MenubarShortcut>⌘N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>Export timeline</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Focus mode</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );
    case 'navigation-menu':
      return (
        <NavigationMenu viewport={false}>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="#">Overview</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Operations</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuLink href="#">Audit trail</NavigationMenuLink>
                <NavigationMenuLink href="#">System status</NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
    case 'pagination':
      return (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
    case 'sidebar':
      return (
        <SidebarProvider className="min-h-0 w-72 rounded-lg border bg-sidebar p-2">
          <SidebarGroup>
            <SidebarGroupLabel>Security operations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive>
                    <ShieldCheckIcon /> <span>Overview</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>12</SidebarMenuBadge>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <DatabaseIcon /> <span>Audit trail</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarProvider>
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
    case 'combobox':
      return (
        <Combobox items={['Critical', 'High', 'Medium', 'Low']} defaultValue="High">
          <ComboboxInput className={styles.controlWidth} placeholder="Select severity…" />
          <ComboboxContent>
            <ComboboxList>
              {['Critical', 'High', 'Medium', 'Low'].map((item) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      );
    case 'field':
      return (
        <FieldGroup className={styles.controlWidth}>
          <Field>
            <FieldLabel htmlFor="field-indicator">Indicator</FieldLabel>
            <Input id="field-indicator" placeholder="198.51.100.42" />
            <FieldDescription>IPv4, domain, URL, or file hash.</FieldDescription>
          </Field>
        </FieldGroup>
      );
    case 'form':
      return <FormSpecimen />;
    case 'input':
      return (
        <Input
          className={styles.controlWidth}
          placeholder="Search components…"
          aria-invalid={variant === 'invalid'}
        />
      );
    case 'input-group':
      return (
        <InputGroup className={styles.controlWidth}>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput placeholder="Search telemetry…" />
          <InputGroupAddon align="inline-end">
            <InputGroupButton aria-label="Run search">
              <SendIcon />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      );
    case 'input-otp':
      return (
        <InputOTP maxLength={6} defaultValue="724851">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      );
    case 'label':
      return (
        <div className={styles.controlStack}>
          <Label htmlFor="label-control">Case reference</Label>
          <Input id="label-control" defaultValue="INC-2048" />
        </div>
      );
    case 'native-select':
      return (
        <NativeSelect defaultValue="production" aria-label="Environment">
          <NativeSelectOption value="production">Production</NativeSelectOption>
          <NativeSelectOption value="staging">Staging</NativeSelectOption>
          <NativeSelectOption value="development">Development</NativeSelectOption>
        </NativeSelect>
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
    case 'sonner':
      return (
        <>
          <Button
            variant="outline"
            onClick={() =>
              toast.success('Evidence preserved', { description: 'Audit trail updated.' })
            }
          >
            Show notification
          </Button>
          <Toaster position="bottom-right" />
        </>
      );
    case 'separator':
      return (
        <div className={styles.separatorSample}>
          <span>Environment</span>
          <Separator />
          <span>Production</span>
        </div>
      );
    case 'collapsible':
      return (
        <Collapsible className={styles.controlWidth} defaultOpen>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              Advanced evidence <ChevronRightIcon />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 rounded-md border p-3 text-sm text-muted-foreground">
            Correlation ID, source collector, and normalized event metadata.
          </CollapsibleContent>
        </Collapsible>
      );
    case 'direction':
      return (
        <DirectionProvider dir="rtl" direction="rtl">
          <div dir="rtl" className="w-72 rounded-lg border p-4 text-right">
            <strong>اتجاه من اليمين إلى اليسار</strong>
            <p className="mt-1 text-sm text-muted-foreground">محتوى آمن ومتوافق مع اللغات.</p>
          </div>
        </DirectionProvider>
      );
    case 'resizable':
      return (
        <ResizablePanelGroup
          orientation="horizontal"
          className="h-40 w-full max-w-xl rounded-lg border"
        >
          <ResizablePanel defaultSize={45} className="flex items-center justify-center text-sm">
            Event list
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel
            defaultSize={55}
            className="flex items-center justify-center bg-muted/30 text-sm"
          >
            Evidence detail
          </ResizablePanel>
        </ResizablePanelGroup>
      );
    case 'scroll-area':
      return (
        <ScrollArea className="h-40 w-80 rounded-lg border p-3">
          <div className="space-y-2">
            {Array.from({ length: 10 }, (_, index) => (
              <div key={index} className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                Audit event #{2048 + index}
              </div>
            ))}
          </div>
        </ScrollArea>
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
    case 'aspect-ratio':
      return (
        <AspectRatio ratio={16 / 9} className="w-80 overflow-hidden rounded-lg border bg-muted">
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-emerald-950 to-slate-950 text-sm text-emerald-200">
            16:9 investigation canvas
          </div>
        </AspectRatio>
      );
    case 'attachment':
      return (
        <Attachment state="done">
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>incident-timeline.json</AttachmentTitle>
            <AttachmentDescription>184 KB · evidence preserved</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
      );
    case 'calendar':
      return (
        <Calendar mode="single" defaultMonth={new Date(2026, 8)} selected={new Date(2026, 8, 29)} />
      );
    case 'carousel':
      return (
        <Carousel className="w-72" opts={{ loop: true }}>
          <CarouselContent>
            {['Detection', 'Investigation', 'Response'].map((item, index) => (
              <CarouselItem key={item}>
                <Card>
                  <CardContent className="flex h-28 items-center justify-center">
                    <strong>
                      {index + 1}. {item}
                    </strong>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>
      );
    case 'chart':
      return (
        <ChartContainer
          className="h-52 w-full max-w-xl"
          config={{ events: { label: 'Events', color: 'var(--chart-1)' } }}
        >
          <BarChart accessibilityLayer data={CHART_DATA}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="hour" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="events" fill="var(--color-events)" radius={4} />
          </BarChart>
        </ChartContainer>
      );
    case 'item':
      return (
        <Item variant="outline" className={styles.controlWidth}>
          <ItemMedia variant="icon">
            <ShieldCheckIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Identity service</ItemTitle>
            <ItemDescription>OIDC discovery and token validation healthy.</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Badge>Healthy</Badge>
          </ItemActions>
        </Item>
      );
    case 'kbd':
      return (
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <span>+</span>
          <Kbd>K</Kbd>
        </KbdGroup>
      );
    case 'marker':
      return (
        <Marker variant="separator" className={styles.controlWidth}>
          <MarkerIcon>
            <ShieldCheckIcon />
          </MarkerIcon>
          <MarkerContent>Trusted platform boundary</MarkerContent>
        </Marker>
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
    case 'alert-dialog':
      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Revoke token</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke this access token?</AlertDialogTitle>
              <AlertDialogDescription>
                Active sessions using this token will stop immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive">Revoke</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    case 'context-menu':
      return (
        <ContextMenu>
          <ContextMenuTrigger className="flex h-28 w-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Right-click investigation artifact
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Open evidence</ContextMenuItem>
            <ContextMenuItem>
              Copy hash <ContextMenuShortcut>⌘C</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem variant="destructive">Remove</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    case 'drawer':
      return (
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">Open drawer</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Incident summary</DrawerTitle>
              <DrawerDescription>Review evidence before escalation.</DrawerDescription>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      );
    case 'hover-card':
      return (
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="link">@security-platform</Button>
          </HoverCardTrigger>
          <HoverCardContent>
            <strong>Security Platform</strong>
            <p className="mt-1 text-sm text-muted-foreground">
              Owns identity, audit, and shared infrastructure.
            </p>
          </HoverCardContent>
        </HoverCard>
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
    case 'sheet':
      return (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Open side panel</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Detection details</SheetTitle>
              <SheetDescription>Inspect evidence without losing table context.</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
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
    case 'bubble':
      return (
        <BubbleGroup className="w-80">
          <Bubble variant="muted">
            <BubbleContent>Summarize authentication failures from last hour.</BubbleContent>
          </Bubble>
          <Bubble variant="tinted" align="end">
            <BubbleContent>14 failures found across 3 identities.</BubbleContent>
          </Bubble>
        </BubbleGroup>
      );
    case 'message':
      return (
        <Message className="w-96">
          <MessageAvatar>
            <AvatarFallback>AI</AvatarFallback>
          </MessageAvatar>
          <MessageContent>
            <MessageHeader>Mercure Assistant · now</MessageHeader>
            <Bubble variant="muted">
              <BubbleContent>
                Credential abuse pattern detected in identity telemetry.
              </BubbleContent>
            </Bubble>
            <MessageFooter>Sources: Keycloak, API audit trail</MessageFooter>
          </MessageContent>
        </Message>
      );
    case 'message-scroller':
      return (
        <MessageScrollerProvider>
          <MessageScroller className="h-48 w-96 rounded-lg border">
            <MessageScrollerViewport>
              <MessageScrollerContent className="gap-3 p-3">
                {Array.from({ length: 6 }, (_, index) => (
                  <MessageScrollerItem key={index}>
                    <Bubble
                      variant={index % 2 === 0 ? 'muted' : 'tinted'}
                      align={index % 2 === 0 ? 'start' : 'end'}
                    >
                      <BubbleContent>Investigation message {index + 1}</BubbleContent>
                    </Bubble>
                  </MessageScrollerItem>
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>
      );
    default:
      return null;
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
