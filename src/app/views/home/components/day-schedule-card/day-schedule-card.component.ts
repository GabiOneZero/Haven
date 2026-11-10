/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { NgStyle } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonCard, IonChip, IonItem, IonLabel, IonList } from '@ionic/angular';

import { IconComponent } from '../../../../shared/components/icon/icon.component';

export interface DayEvent {
  id: string;
  title: string;
  date: string;
  startHour: string;
  endHour: string;
  person: string;
  accentColor: 'green' | 'purple' | 'orange';
}

const EVENT_ACCENT_COLORS = {
  green: {
    line: 'var(--haven-event-line-green)',
    badgeBg: 'var(--haven-event-badge-green-bg)',
    badgeText: 'var(--haven-event-badge-green-text)',
  },
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

@Component({
  selector: 'app-day-schedule-card',
  standalone: true,
  imports: [IonCard, IonList, IonItem, IonLabel, IonChip, NgStyle, RouterLink, IconComponent],
  templateUrl: './day-schedule-card.component.html',
})
export class DayScheduleCardComponent {
  @Input() date: string = '';
  @Input() events: DayEvent[] = [];

  get todayEvents(): DayEvent[] {
    const today = this.toDateKey(new Date());

    return this.events
      .filter((event) => event.date === today)
      .sort((first, second) => first.startHour.localeCompare(second.startHour));
  }

  get upcomingEvents(): DayEvent[] {
    const today = new Date();
    const todayKey = this.toDateKey(today);
    const lastUpcomingDate = new Date(today);
    lastUpcomingDate.setDate(lastUpcomingDate.getDate() + 7);
    const lastUpcomingDateKey = this.toDateKey(lastUpcomingDate);

    return this.events
      .filter((event) => event.date > todayKey && event.date <= lastUpcomingDateKey)
      .sort(
        (first, second) => first.date.localeCompare(second.date) || first.startHour.localeCompare(second.startHour),
      );
  }

  get hasNoEventsTodayOrUpcoming(): boolean {
    return this.todayEvents.length === 0 && this.upcomingEvents.length === 0;
  }

  getAccentStyles(accent: DayEvent['accentColor']) {
    return EVENT_ACCENT_COLORS[accent] ?? EVENT_ACCENT_COLORS.green;
  }

  formatEventDate(dateKey: string): string {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12);
    const formattedDate = date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

    return formattedDate.charAt(0).toLocaleUpperCase('es-ES') + formattedDate.slice(1).replace('.', '');
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
