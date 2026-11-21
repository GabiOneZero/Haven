import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, beforeEach, it, expect, vi } from 'vitest';

import { CalendarService, type CalendarEvent, type CalendarSource } from '../../../shared/services/calendar.service';
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

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: CalendarService,
          useValue: calendarServiceMock,
        },
        {
          provide: MoodService,
          useValue: {
            getCurrentWorkspaceMoods: async () => [
              {
                userId: 'user-1',
                displayName: 'Gabi',
                mood: 'Con energía',
              },
              {
                userId: 'user-2',
                displayName: 'Aldara',
                mood: 'En calma',
              },
            ],
          },
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
    await vi.waitFor(() => expect(component.moodsLoading()).toBe(false));
    expect(component.moods()).not.toBeNull();
    fixture.detectChanges();
    const renderedPage = fixture.nativeElement as HTMLElement;

    expect(renderedPage.textContent).toContain('Con energía');
    expect(renderedPage.textContent).toContain('En calma');
  });

  it('loads today events and tags personal events only with the current user', () => {
    const schedule = (fixture.nativeElement as HTMLElement).querySelector('app-day-schedule-card');

    expect(schedule?.textContent).toContain('Evento personal real');
    expect(schedule?.textContent).toContain('Gabi');
    expect(schedule?.textContent).not.toContain('Aldara');
    expect(calendarServiceMock.getEvents).toHaveBeenNthCalledWith(2, expect.any(Date), undefined, 3);
  });
});
