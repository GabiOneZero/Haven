import { describe, expect, it } from 'vitest';

import { DayScheduleCardComponent } from './day-schedule-card.component';
import type { DayEvent } from './day-schedule-card.component';

function getEventDate(daysFromToday: number, hour: number): Date {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + daysFromToday, hour);
}

function createEvent(id: string, daysFromToday: number, hour: number): DayEvent {
  const start = getEventDate(daysFromToday, hour);

  return {
    id,
    calendarId: 'calendar',
    eventId: id,
    title: `Event ${id}`,
    source: 'shared',
    start,
    end: new Date(start.getTime() + 60 * 60 * 1000),
    allDay: false,
  };
}

describe('DayScheduleCardComponent', () => {
  it('separates and sorts today events, and limits upcoming events to the next three regardless of date', () => {
    const component = new DayScheduleCardComponent();
    component.events = [
      createEvent('today-late', 0, 18),
      createEvent('tomorrow', 1, 9),
      createEvent('today-early', 0, 8),
      createEvent('next-week', 7, 10),
      createEvent('far-future-1', 60, 10),
      createEvent('far-future-2', 100, 10),
      createEvent('far-future-3', 365, 10),
      createEvent('outside-limit', 500, 10),
      createEvent('past', -1, 10),
    ];

    expect(component.todayEvents.map((event) => event.id)).toEqual(['today-early', 'today-late']);
    expect(component.upcomingEvents.map((event) => event.id)).toEqual(['tomorrow', 'next-week', 'far-future-1']);
    expect(component.hasNoEventsTodayOrUpcoming).toBe(false);
  });

  it('sorts upcoming events by date and start time', () => {
    const component = new DayScheduleCardComponent();
    component.events = [
      createEvent('later-tomorrow', 1, 14),
      createEvent('early-tomorrow', 1, 9),
      createEvent('day-after', 2, 8),
    ];

    expect(component.upcomingEvents.map((event) => event.id)).toEqual([
      'early-tomorrow',
      'later-tomorrow',
      'day-after',
    ]);
  });

  it('shows the empty state when there are no events today or upcoming', () => {
    const component = new DayScheduleCardComponent();
    component.events = [createEvent('past', -1, 10)];

    expect(component.hasNoEventsTodayOrUpcoming).toBe(true);
  });

  it('uses the Google Calendar label name and color, and falls back to Untagged without a label', () => {
    const component = new DayScheduleCardComponent();
    const label = { id: 'label-id', name: 'Juntos', backgroundColor: '#80AA4A' };

    expect(component.getCategoryLabel(label)).toBe('Juntos');
    expect(component.getCategoryStyles(label).line).toBe('#80AA4A');
    expect(component.getCategoryStyles(label).badgeBg).toBe('#80AA4A');
    expect(component.getCategoryStyles(label).badgeText).toBe('#FFFFFF');
    expect(component.getCategoryLabel(undefined)).toBe('Untagged');
    expect(component.getCategoryStyles(undefined).badgeBg).toBe('#E5E7EB');
  });

  it('uses the owner for personal events and the Google label for shared events', () => {
    const component = new DayScheduleCardComponent();
    component.currentUserName = 'Gabi';

    const personal = createEvent('personal', 1, 10);
    personal.source = 'personal';
    expect(component.getEventTagLabel(personal)).toBe('Gabi');

    const shared = createEvent('shared', 1, 10);
    shared.eventLabel = { id: 'label-id', name: 'Juntos', backgroundColor: '#80AA4A' };
    expect(component.getEventTagLabel(shared)).toBe('Juntos');
    expect(component.getEventTagStyles(shared).badgeBg).toBe('#80AA4A');
    expect(component.getEventTagLabel(createEvent('untagged', 1, 10))).toBe('Untagged');
  });

  it('uses the light orange style for every Gabi tag', () => {
    const component = new DayScheduleCardComponent();
    component.currentUserName = 'Gabi';

    const personal = createEvent('personal', 1, 10);
    personal.source = 'personal';
    expect(component.getEventTagStyles(personal)).toEqual({
      line: 'var(--haven-event-line-orange)',
      badgeBg: 'var(--haven-event-badge-orange-bg)',
      badgeText: 'var(--haven-event-badge-orange-text)',
    });

    const shared = createEvent('shared-gabi', 1, 10);
    shared.eventLabel = { id: 'gabi-label', name: 'Gabi', backgroundColor: '#A871B2' };
    expect(component.getEventTagStyles(shared)).toEqual({
      line: 'var(--haven-event-line-orange)',
      badgeBg: 'var(--haven-event-badge-orange-bg)',
      badgeText: 'var(--haven-event-badge-orange-text)',
    });
    expect(component.getEventLineColor(shared)).toBe('var(--haven-event-line-orange)');

    const otherShared = createEvent('shared-other', 1, 10);
    otherShared.eventLabel = { id: 'other-label', name: 'Juntos', backgroundColor: '#80AA4A' };
    expect(component.getEventLineColor(otherShared)).toBe('#80AA4A');
  });
});
