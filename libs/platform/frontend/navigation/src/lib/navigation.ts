export type PlatformNavigationIcon = 'overview' | 'rules' | 'audit' | 'status';

export interface PlatformNavigationItem {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly icon: PlatformNavigationIcon;
}

export const platformNavigation = [
  {
    id: 'overview',
    label: 'Overview',
    href: '/',
    icon: 'overview',
  },
  {
    id: 'rules',
    label: 'Rules',
    href: '/rules',
    icon: 'rules',
  },
  {
    id: 'audit',
    label: 'Audit',
    href: '/audit',
    icon: 'audit',
  },
  {
    id: 'status',
    label: 'Status',
    href: '/status',
    icon: 'status',
  },
] as const satisfies readonly PlatformNavigationItem[];
