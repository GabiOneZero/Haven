import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { expect, it, vi } from 'vitest';

import { CalendarService, type CalendarEvent, type CalendarSource } from '../../../shared/services/calendar.service';
import { MoodService } from '../../../shared/services/mood.service';
import { CalendarPage } from './calendar.page';

const calendarServiceMock = {
  getConnectionStatus: vi.fn(async () => ({ kind: 'connected' as const, events: [] })),
  getEvents: vi.fn(
    async (
      _timeMin: Date,
      _timeMax?: Date,
      _maxResultsPerSource?: number,
    ): Promise<{ events: CalendarEvent[]; failedSources: CalendarSource[] }> => ({
      events: [],
      failedSources: [],
    }),
  ),
};

describe('CalendarPage', () => {
  let component: CalendarPage;
  let fixture: ComponentFixture<CalendarPage>;

  beforeEach(async () => {
    calendarServiceMock.getConnectionStatus.mockReset().mockResolvedValue({ kind: 'connected', events: [] });
    calendarServiceMock.getEvents.mockReset().mockResolvedValue({ events: [], failedSources: [] });

    await TestBed.configureTestingModule({
      imports: [CalendarPage],
      providers: [
        provideRouter([]),
        { provide: CalendarService, useValue: calendarServiceMock },
        {
          provide: MoodService,
          useValue: {
            getCurrentWorkspaceMoods: async () => [
              { userId: 'user-1', displayName: 'Gabi', mood: null },
              { userId: 'user-2', displayName: 'Aldara', mood: null },
            ],
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('starts on the Calendar view with today selected', () => {
    expect(component.activeView()).toBe('calendar');
    expect(component.selectedDate().toDateString()).toBe(new Date().toDateString());
  });

  it('switches between Calendar and Eventos without changing the selected date', () => {
    const selected = component.selectedDate();
    component.setView('events');
    expect(component.activeView()).toBe('events');
    component.setView('calendar');
    expect(component.activeView()).toBe('calendar');
    expect(component.selectedDate()).toBe(selected);
  });

  it('lists upcoming events in chronological order and excludes past timed events', () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const event = (id: string, start: Date, allDay = false): CalendarEvent => ({
      id,
      calendarId: 'primary',
      eventId: id,
      title: id,
      source: 'personal',
      start,
      end: start,
      allDay,
    });

    component.events.set([
      event('tomorrow', new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 12)),
      event('all-day-today', today, true),
      event('past', new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 12)),
    ]);

    expect(component.upcomingEvents.map(({ id }) => id)).toEqual(['all-day-today', 'tomorrow']);
  });

  it('shows one tag-colored calendar dot per event, capped at five', () => {
    const date = component.selectedDate();
    const colors = ['#112233', '#223344', '#334455', '#445566', '#556677', '#667788'];
    component.events.set(
      colors.map((backgroundColor, index) => {
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8 + index);
        return {
          id: `event-${index}`,
          calendarId: 'shared',
          eventId: `event-${index}`,
          title: `Event ${index}`,
          source: 'shared' as const,
          start,
          end: start,
          allDay: false,
          eventLabel: { id: `label-${index}`, name: `Tag ${index}`, backgroundColor },
        };
      }),
    );

    const day = component.calendarDays.find(
      ({ date: calendarDate }) => calendarDate.toDateString() === date.toDateString(),
    );
    expect(day?.eventColors).toEqual(colors.slice(0, 5));
  });

  it('uses the same owner and Google Calendar tags as Home', () => {
    component.currentUserName.set('Aldara');
    const shared: CalendarEvent = {
      id: 'shared',
      calendarId: 'shared',
      eventId: 'shared',
      title: 'Evento compartido',
      source: 'shared',
      start: new Date(),
      end: new Date(),
      allDay: false,
      eventLabel: { id: 'together', name: 'Juntos', backgroundColor: '#80AA4A' },
    };
    const personal = { ...shared, id: 'personal', source: 'personal' as const };

    expect(component.getEventTagLabel(shared)).toBe('Juntos');
    expect(component.getEventTagStyles(shared).badgeBg).toBe('#80AA4A');
    expect(component.getEventTagStyles(shared).badgeText).toBe('#FFFFFF');
    expect(component.getEventTagLabel(personal)).toBe('Aldara');
    expect(component.getEventTagStyles(personal).badgeBg).toBe('var(--haven-event-badge-purple-bg)');
  });

  it('refreshes calendar data and completes the pull-to-refresh indicator', async () => {
    const complete = vi.fn();
    const callsBeforeRefresh = calendarServiceMock.getConnectionStatus.mock.calls.length;

    await component.handleRefresh({ complete });

    expect(calendarServiceMock.getConnectionStatus.mock.calls.length).toBe(callsBeforeRefresh + 1);
    expect(complete).toHaveBeenCalledOnce();
  });

  it('completes the pull-to-refresh indicator when calendar refresh fails', async () => {
    const complete = vi.fn();
    calendarServiceMock.getConnectionStatus.mockRejectedValueOnce(new Error('Calendar unavailable'));

    await component.handleRefresh({ complete });

    expect(component.connectionError()).toBe('Calendar unavailable');
    expect(component.loading()).toBe(false);
    expect(complete).toHaveBeenCalledOnce();
  });
});
