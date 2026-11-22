import type { CalendarEvent, CalendarEventLabel } from '../../services/calendar.service';

export interface EventTagStyles {
  line: string;
  badgeBg: string;
  badgeText: string;
}

const EVENT_OWNER_STYLES = {
  purple: {
    line: 'var(--haven-event-line-purple)',
    badgeBg: 'var(--haven-event-badge-purple-bg)',
    badgeText: 'var(--haven-event-badge-purple-text)',
  },
  orange: {
    line: 'var(--haven-event-line-orange)',
    badgeBg: 'var(--haven-event-badge-orange-bg)',
    badgeText: 'var(--haven-event-badge-orange-text)',
  },
} as const;

const UNTAGGED_STYLES = {
  line: '#9CA3AF',
  badgeBg: '#E5E7EB',
  badgeText: '#374151',
} as const;

export function getCategoryLabel(label?: CalendarEventLabel): string {
  return label?.name?.trim() || 'Untagged';
}

export function getCategoryStyles(label?: CalendarEventLabel): EventTagStyles {
  const color = label?.backgroundColor;
  if (!color || !/^#[\da-f]{6}$/i.test(color)) {
    return UNTAGGED_STYLES;
  }

  return { line: color, badgeBg: color, badgeText: getContrastText(color) };
}

export function getEventTagLabel(event: CalendarEvent, currentUserName: string): string {
  if (event.source === 'personal') {
    return currentUserName.trim() || 'Untagged';
  }

  return getCategoryLabel(event.eventLabel);
}

export function getEventTagStyles(event: CalendarEvent, currentUserName: string): EventTagStyles {
  if (event.source === 'personal') {
    return getOwnerStyles(currentUserName);
  }

  if (getCategoryLabel(event.eventLabel).toLocaleLowerCase('es-ES') === 'gabi') {
    return EVENT_OWNER_STYLES.orange;
  }

  return getCategoryStyles(event.eventLabel);
}

export function getEventLineColor(event: CalendarEvent, currentUserName: string): string {
  return getEventTagStyles(event, currentUserName).line;
}

export function getOwnerStyles(currentUserName: string): EventTagStyles {
  return currentUserName.trim().toLocaleLowerCase('es-ES') === 'aldara'
    ? EVENT_OWNER_STYLES.purple
    : EVENT_OWNER_STYLES.orange;
}

function getContrastText(color: string): string {
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

  return brightness > 150 ? '#171716' : '#FFFFFF';
}
