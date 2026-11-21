import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, type OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { IonContent } from '@ionic/angular';
import { HeaderComponent } from '../../../shared/header/header.component';
import {
  CalendarService,
  type CalendarEvent,
  type CalendarSource,
  type GoogleCalendarOAuthResult,
} from '../../../shared/services/calendar.service';

export type CalendarFilter = 'Personal' | 'Compartido' | 'Ambos';

interface CalendarDay {
  date: Date;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasEvents: boolean;
  eventSources: CalendarSource[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, IonContent, HeaderComponent],
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
})
export class CalendarPage implements OnInit {
  private readonly calendarService = inject(CalendarService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly filter = signal<CalendarFilter>('Ambos');
  readonly loading = signal(false);
  readonly connectionError = signal<string | null>(null);
  readonly connectionStatus = signal<'connected' | 'disconnected' | 'incomplete'>('disconnected');
  readonly month = signal(this.startOfMonth(new Date()));
  readonly selectedDate = signal(this.startOfDay(new Date()));
  readonly events = signal<CalendarEvent[]>([]);

  readonly filters: CalendarFilter[] = ['Personal', 'Compartido', 'Ambos'];
  readonly weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const result = params.get('googleCalendarOAuth');
      if (this.isOAuthReturnResult(result)) {
        void this.handleOAuthReturn(result).catch((error: unknown) => {
          this.connectionError.set(
            error instanceof Error ? error.message : 'No se pudo completar la conexión con Google Calendar.',
          );
          console.error('No se pudo procesar el retorno OAuth de Google Calendar.', error);
        });
      }
    });

    if (!this.isOAuthReturnResult(this.route.snapshot.queryParamMap.get('googleCalendarOAuth'))) {
      void this.refresh();
    }
  }

  async ionViewWillEnter(): Promise<void> {
    if (!this.isOAuthReturnResult(this.route.snapshot.queryParamMap.get('googleCalendarOAuth'))) {
      await this.refresh();
    }
  }

  get monthLabel(): string {
    const label = this.month()
      .toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
    return label;
  }

  get selectedDateLabel(): string {
    return this.selectedDate()
      .toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  get selectedEvents(): CalendarEvent[] {
    const dateKey = this.toDateKey(this.selectedDate());
    return this.events()
      .filter((event) => this.toDateKey(event.start) === dateKey)
      .filter(
        (event) =>
          this.filter() === 'Ambos' ||
          (this.filter() === 'Personal' && event.source === 'personal') ||
          (this.filter() === 'Compartido' && event.source === 'shared'),
      )
      .sort(
        (first, second) =>
          Number(second.allDay) - Number(first.allDay) || first.start.getTime() - second.start.getTime(),
      );
  }

  get calendarDays(): CalendarDay[] {
    const month = this.month();
    const gridStart = this.startOfCalendarGrid(month);
    const days: CalendarDay[] = [];

    for (let index = 0; index < 42; index++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const dateKey = this.toDateKey(date);
      const dayEvents = this.events().filter((event) => this.toDateKey(event.start) === dateKey);
      const filteredEvents = dayEvents.filter((event) => this.eventMatchesFilter(event));
      const eventSources = [...new Set(filteredEvents.map((event) => event.source))];

      days.push({
        date,
        inCurrentMonth: date.getMonth() === month.getMonth(),
        isToday: dateKey === this.toDateKey(new Date()),
        isSelected: dateKey === this.toDateKey(this.selectedDate()),
        hasEvents: eventSources.length > 0,
        eventSources,
      });
    }

    return days;
  }

  setFilter(filter: CalendarFilter): void {
    this.filter.set(filter);
  }

  selectDay(day: CalendarDay): void {
    this.selectedDate.set(this.startOfDay(day.date));
  }

  previousMonth(): void {
    this.moveMonth(-1);
  }

  nextMonth(): void {
    this.moveMonth(1);
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    this.connectionError.set(null);

    try {
      const status = await this.calendarService.getConnectionStatus();
      this.connectionStatus.set(status.kind);
      if (status.kind === 'connected') {
        const start = this.startOfCalendarGrid(this.month());
        const end = new Date(start);
        end.setDate(start.getDate() + 42);
        const result = await this.calendarService.getEvents(start, end);
        this.events.set(result.events);
      } else {
        this.events.set(status.events);
      }
    } catch (error) {
      this.connectionStatus.set('disconnected');
      this.connectionError.set(error instanceof Error ? error.message : 'No se pudo actualizar Google Calendar.');
    } finally {
      this.loading.set(false);
    }
  }

  async connectGoogle(): Promise<void> {
    if (this.connectionStatus() === 'connected') {
      await this.refresh();
      return;
    }

    try {
      const platform = Capacitor.getPlatform() === 'android' ? 'android' : 'web';
      const authorizationUrl = await this.calendarService.startGoogleConnection(platform);
      if (platform === 'android') {
        await Browser.open({ url: authorizationUrl });
        return;
      }
      window.location.assign(authorizationUrl);
    } catch (error) {
      this.connectionError.set(error instanceof Error ? error.message : 'No se pudo iniciar la conexión con Google.');
    }
  }

  private async handleOAuthReturn(result: GoogleCalendarOAuthResult): Promise<void> {
    await this.refresh();
    if (result === 'cancelled') {
      this.connectionError.set('Se canceló la conexión con Google Calendar.');
    } else if (result === 'error') {
      this.connectionError.set('No se pudo completar la conexión con Google Calendar. Inténtalo de nuevo.');
    }

    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { googleCalendarOAuth: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private isOAuthReturnResult(value: string | null): value is GoogleCalendarOAuthResult {
    return value === 'connected' || value === 'cancelled' || value === 'error';
  }

  formatEventTime(event: CalendarEvent): string {
    if (event.allDay) {
      return 'Todo el día';
    }
    return event.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  private eventMatchesFilter(event: CalendarEvent): boolean {
    return (
      this.filter() === 'Ambos' ||
      (this.filter() === 'Personal' && event.source === 'personal') ||
      (this.filter() === 'Compartido' && event.source === 'shared')
    );
  }

  private moveMonth(offset: number): void {
    const current = this.month();
    const next = new Date(current.getFullYear(), current.getMonth() + offset, 1);
    this.month.set(next);

    const selected = this.selectedDate();
    const movedSelection = new Date(next.getFullYear(), next.getMonth(), Math.min(selected.getDate(), 28));
    this.selectedDate.set(this.startOfDay(movedSelection));
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private startOfCalendarGrid(month: Date): Date {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const mondayOffset = (first.getDay() + 6) % 7;
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - mondayOffset);
    return gridStart;
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
