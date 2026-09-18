export type PlatformNavigationIcon = 'overview';

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
] as const satisfies readonly PlatformNavigationItem[];
