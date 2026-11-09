import { describe, expect, it } from 'vitest';

import { DayScheduleCardComponent } from './day-schedule-card.component';
import type { DayEvent } from './day-schedule-card.component';

function getDateKey(daysFromToday: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function createEvent(id: string, date: string, startHour: string): DayEvent {
  return {
    id,
    title: `Event ${id}`,
    date,
    startHour,
    endHour: '13:00',
    person: 'Juntos',
    accentColor: 'green',
  };
}

describe('DayScheduleCardComponent', () => {
  it('separates today events from events in the next seven days', () => {
    const component = new DayScheduleCardComponent();
    component.events = [
      createEvent('today-late', getDateKey(0), '18:00'),
      createEvent('tomorrow', getDateKey(1), '09:00'),
      createEvent('today-early', getDateKey(0), '08:00'),
      createEvent('next-week', getDateKey(7), '10:00'),
      createEvent('outside-range', getDateKey(8), '10:00'),
    ];

    expect(component.todayEvents.map((event) => event.id)).toEqual(['today-early', 'today-late']);
    expect(component.upcomingEvents.map((event) => event.id)).toEqual(['tomorrow', 'next-week']);
    expect(component.hasNoEventsTodayOrUpcoming).toBe(false);
  });

  it('sorts upcoming events by date and start time', () => {
    const component = new DayScheduleCardComponent();
    component.events = [
      createEvent('later-tomorrow', getDateKey(1), '14:00'),
      createEvent('early-tomorrow', getDateKey(1), '09:00'),
      createEvent('day-after', getDateKey(2), '08:00'),
    ];

    expect(component.upcomingEvents.map((event) => event.id)).toEqual([
      'early-tomorrow',
      'later-tomorrow',
      'day-after',
    ]);
  });

  it('shows the empty state when there are no events today or in the next week', () => {
    const component = new DayScheduleCardComponent();
    component.events = [createEvent('past', getDateKey(-1), '10:00')];

    expect(component.hasNoEventsTodayOrUpcoming).toBe(true);
  });
});
