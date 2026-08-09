/** Whether the `?debug` flag is present in the current URL. */
export function isDebugEnabled(): boolean {
  return new URLSearchParams(window.location.search).has('debug');
}

const sectionLabels: Record<string, string> = {
  '/': 'Home',
  '/writing': 'Writing',
  '/xyz': 'Components',
};

export type RouteCrumb = { label: string; href: string | null };

/** Breadcrumb segments for a path; only ancestor segments get an `href`. */
export function getRouteCrumbs(path: string): RouteCrumb[] {
  const normalized = path.replace(/\/$/, '') || '/';

  if (normalized === '/') {
    return [{ label: sectionLabels['/'], href: null }];
  }

  const segments = normalized.split('/').filter(Boolean);
  return segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label =
      index === 0
        ? (sectionLabels[href] ?? capitalize(segment))
        : capitalize(segment);
    const isLast = index === segments.length - 1;
    return { label, href: isLast ? null : href };
  });
}

export function getRouteLabel(path: string): string {
  return getRouteCrumbs(path)
    .map((c) => c.label)
    .join(' / ');
}

function capitalize(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
