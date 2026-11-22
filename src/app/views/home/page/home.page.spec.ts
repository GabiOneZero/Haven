import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, beforeEach, it, expect, vi } from 'vitest';

import { CalendarService, type CalendarEvent, type CalendarSource } from '../../../shared/services/calendar.service';
import { ListsService } from '../../../shared/services/lists.service';
import { MoodService } from '../../../shared/services/mood.service';

import { HomePage } from './home.page';

const calendarServiceMock = {
  getConnectionStatus: vi.fn(async () => ({ kind: 'connected' as const, events: [] })),
  getEvents: vi.fn(
    async (_timeMin: Date, _timeMax?: Date): Promise<{ events: CalendarEvent[]; failedSources: CalendarSource[] }> => ({
      events: [],
      failedSources: [],
    }),
  ),
};

const moodServiceMock = {
  getCurrentWorkspaceMoods: vi.fn(async () => [
    { userId: 'user-1', displayName: 'Gabi', mood: 'Con energía' },
    { userId: 'user-2', displayName: 'Aldara', mood: 'En calma' },
  ]),
};

const listsServiceMock = {
  load: vi.fn(async () => undefined),
  getShoppingSummary: vi.fn(() => ({ unchecked: 2, checked: 1 })),
};

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async () => {
    const now = new Date();
    const eventStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13);
    calendarServiceMock.getConnectionStatus.mockResolvedValue({ kind: 'connected', events: [] });
    calendarServiceMock.getEvents.mockReset().mockImplementation(async (_timeMin, timeMax) => ({
      events: timeMax
        ? [
            {
              id: 'personal-event',
              calendarId: 'primary',
              eventId: 'personal-event',
              title: 'Evento personal real',
              source: 'personal' as const,
              start: eventStart,
              end: new Date(eventStart.getTime() + 60 * 60 * 1000),
              allDay: false,
              eventLabelId: 'aldara-label',
              eventLabel: { id: 'aldara-label', name: 'Aldara', backgroundColor: '#A871B2' },
            },
          ]
        : [],
      failedSources: [],
    }));
    moodServiceMock.getCurrentWorkspaceMoods.mockReset().mockResolvedValue([
      { userId: 'user-1', displayName: 'Gabi', mood: 'Con energía' },
      { userId: 'user-2', displayName: 'Aldara', mood: 'En calma' },
    ]);
    listsServiceMock.load.mockReset().mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: CalendarService,
          useValue: calendarServiceMock,
        },
        {
          provide: MoodService,
          useValue: moodServiceMock,
        },
        {
          provide: ListsService,
          useValue: listsServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the latest moods returned by the service', async () => {
    await vi.waitFor(() => expect(component.homeLoading()).toBe(false));
    expect(component.moods()).not.toBeNull();
    fixture.detectChanges();
    const renderedPage = fixture.nativeElement as HTMLElement;

    expect(renderedPage.textContent).toContain('Con energía');
    expect(renderedPage.textContent).toContain('En calma');
  });

  it('loads today events and tags personal events only with the current user', async () => {
    await vi.waitFor(() => expect(component.homeLoading()).toBe(false));
    fixture.detectChanges();

    const schedule = (fixture.nativeElement as HTMLElement).querySelector('app-day-schedule-card');

    expect(schedule?.textContent).toContain('Evento personal real');
    expect(schedule?.textContent).toContain('Gabi');
    expect(schedule?.textContent).not.toContain('Aldara');
    expect(calendarServiceMock.getEvents).toHaveBeenNthCalledWith(2, expect.any(Date), undefined, 3);
  });

  it('loads shopping data before showing the home content', async () => {
    await vi.waitFor(() => expect(component.homeLoading()).toBe(false));
    fixture.detectChanges();

    expect(listsServiceMock.load).toHaveBeenCalledOnce();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-skeleton-home')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('2 productos pendientes');
  });

  it('shows the home skeleton until the initial data requests finish', async () => {
    let resolveMoods!: (moods: Awaited<ReturnType<typeof moodServiceMock.getCurrentWorkspaceMoods>>) => void;
    moodServiceMock.getCurrentWorkspaceMoods.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveMoods = resolve;
        }),
    );

    fixture.destroy();
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const loadingPage = fixture.nativeElement as HTMLElement;
    expect(loadingPage.querySelector('app-skeleton-home [aria-busy="true"]')).not.toBeNull();
    expect(loadingPage.querySelector('app-day-schedule-card')).toBeNull();
    expect(component.homeLoading()).toBe(true);

    resolveMoods([
      { userId: 'user-1', displayName: 'Gabi', mood: 'Con energía' },
      { userId: 'user-2', displayName: 'Aldara', mood: 'En calma' },
    ]);
    await vi.waitFor(() => expect(component.homeLoading()).toBe(false));
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('app-skeleton-home')).toBeNull();
    expect(component.homeLoading()).toBe(false);
  });

  it('refreshes moods and events and completes the pull-to-refresh indicator', async () => {
    const complete = vi.fn();
    const callsBeforeRefresh = {
      moods: moodServiceMock.getCurrentWorkspaceMoods.mock.calls.length,
      events: calendarServiceMock.getEvents.mock.calls.length,
    };

    await component.handleRefresh({ complete });

    expect(moodServiceMock.getCurrentWorkspaceMoods.mock.calls.length).toBe(callsBeforeRefresh.moods + 1);
    expect(calendarServiceMock.getEvents.mock.calls.length).toBeGreaterThan(callsBeforeRefresh.events);
    expect(complete).toHaveBeenCalledOnce();
  });

  it('completes the pull-to-refresh indicator when loading moods fails', async () => {
    const complete = vi.fn();
    moodServiceMock.getCurrentWorkspaceMoods.mockRejectedValueOnce(new Error('Mood service unavailable'));

    await component.handleRefresh({ complete });

    expect(component.moodsError()).toBe('No se pudieron cargar los estados de ánimo.');
    expect(complete).toHaveBeenCalledOnce();
  });
});
