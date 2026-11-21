import { CommonModule } from '@angular/common';
import type { OnInit } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { IonContent } from '@ionic/angular';

import { HeaderComponent } from '../../../shared/header/header.component';
import { CalendarService } from '../../../shared/services/calendar.service';
import { MoodService, type WorkspaceMemberMood } from '../../../shared/services/mood.service';
import { DailyQuestionCardComponent } from '../components/daily-question-card/daily-question-card.component';
import type { DayEvent } from '../components/day-schedule-card/day-schedule-card.component';
import { DayScheduleCardComponent } from '../components/day-schedule-card/day-schedule-card.component';
import { DecisionCardComponent } from '../components/decision-card/decision-card.component';
import { MoodCardComponent, type MoodData } from '../components/mood-card/mood-card.component';
import { ShoppingCardComponent } from '../components/shopping-card/shopping-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    HeaderComponent,
    DayScheduleCardComponent,
    MoodCardComponent,
    DailyQuestionCardComponent,
    ShoppingCardComponent,
    DecisionCardComponent,
  ],
  templateUrl: './home.page.html',
})
export class HomePage implements OnInit {
  currentDate: Date = new Date();

  private readonly calendarService = inject(CalendarService);
  private moodService = inject(MoodService);

  events: DayEvent[] = [];
  moods = signal<[MoodData, MoodData] | null>(null);
  moodsLoading = signal(true);
  moodsError = signal<string | null>(null);
  scheduleLoading = signal(true);
  scheduleError = signal<string | null>(null);
  calendarConnected = signal(false);
  calendarNeedsReauthorization = signal(false);
  calendarMessage = signal<string | null>(null);
  currentUserName = signal('');
  hoy: string = '';

  async ngOnInit(): Promise<void> {
    this.hoy = this.getFormattedDate();
    await Promise.all([this.loadMoods(), this.loadSchedule()]);
    this.scheduleLoading.set(false);
  }

  private async loadMoods(): Promise<void> {
    try {
      const workspaceMoods = await this.moodService.getCurrentWorkspaceMoods();
      this.moods.set([this.toMoodData(workspaceMoods[0], 0), this.toMoodData(workspaceMoods[1], 1)]);
      this.currentUserName.set(workspaceMoods[0].displayName.trim());
    } catch (error) {
      console.error('Error fetching workspace moods:', error);
      this.moodsError.set('No se pudieron cargar los estados de ánimo.');
    } finally {
      this.moodsLoading.set(false);
    }
  }

  private async loadSchedule(): Promise<void> {
    try {
      const status = await this.calendarService.getConnectionStatus();
      this.calendarConnected.set(status.kind === 'connected');
      this.calendarNeedsReauthorization.set(status.kind === 'incomplete');

      if (status.kind !== 'connected') {
        this.calendarMessage.set(status.message ?? 'Conecta Google Calendar para ver tus eventos.');
        return;
      }

      const todayStart = new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth(),
        this.currentDate.getDate(),
      );
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      const results = await Promise.allSettled([
        this.calendarService.getEvents(todayStart, tomorrowStart),
        this.calendarService.getEvents(tomorrowStart, undefined, 3),
      ]);

      const successfulResults = results.filter((result) => result.status === 'fulfilled').map((result) => result.value);
      this.events = successfulResults.flatMap((result) => result.events);
      const failedSources = [...new Set(successfulResults.flatMap((result) => result.failedSources))];
      const requestErrors = results
        .filter((result) => result.status === 'rejected')
        .map((result) =>
          result.reason instanceof Error ? result.reason.message : 'Error desconocido consultando Google Calendar.',
        );
      if (failedSources.length > 0) {
        requestErrors.push(`No se pudieron cargar todos los eventos de Google Calendar (${failedSources.join(', ')}).`);
      }
      if (requestErrors.length > 0) {
        this.scheduleError.set(requestErrors.join(' '));
      }
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      this.scheduleError.set(error instanceof Error ? error.message : 'No se pudieron cargar los eventos.');
    }
  }

  getFormattedDate(): string {
    return this.currentDate
      .toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
      .replace(/^./, (letra) => letra.toUpperCase());
  }

  private toMoodData(memberMood: WorkspaceMemberMood, position: 0 | 1): MoodData {
    const name = memberMood.displayName.trim() || 'Usuario';
    const palette =
      position === 0
        ? { bgColor: memberMood.bgColor, moodColor: memberMood.color }
        : { bgColor: memberMood.bgColor, moodColor: memberMood.color };

    return {
      id: memberMood.userId,
      name,
      mood: memberMood.mood?.trim() || 'Sin mood',
      ...palette,
      initials: name.charAt(0).toUpperCase(),
      bgColor: palette.bgColor || '#CCCCCC',
      moodColor: palette.moodColor || '#000000',
    };
  }
}
