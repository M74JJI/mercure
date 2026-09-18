export type PlatformNavigationIcon = 'overview' | 'rules';

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
] as const satisfies readonly PlatformNavigationItem[];
