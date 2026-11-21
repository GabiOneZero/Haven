/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { NgStyle } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonCard, IonItem, IonLabel, IonList } from '@ionic/angular';

import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { TagComponent } from '../../../../shared/components/tag/tag.component';
import type { CalendarEvent, CalendarEventLabel } from '../../../../shared/services/calendar.service';

export type DayEvent = CalendarEvent;

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

@Component({
  selector: 'app-day-schedule-card',
  standalone: true,
  imports: [IonCard, IonList, IonItem, IonLabel, NgStyle, RouterLink, IconComponent, TagComponent],
  templateUrl: './day-schedule-card.component.html',
})
export class DayScheduleCardComponent {
  @Input() date: string = '';
  @Input() events: DayEvent[] = [];
  @Input() loading = false;
  @Input() connected = true;
  @Input() reauthorizationRequired = false;
  @Input() connectionMessage: string | null = null;
  @Input() error: string | null = null;
  @Input() currentUserName = '';

  get todayEvents(): DayEvent[] {
    const today = this.toDateKey(new Date());

    return this.events
      .filter((event) => this.toDateKey(event.start) === today)
      .sort(
        (first, second) =>
          Number(second.allDay) - Number(first.allDay) || first.start.getTime() - second.start.getTime(),
      );
  }

  get upcomingEvents(): DayEvent[] {
    const todayKey = this.toDateKey(new Date());

    return this.events
      .filter((event) => this.toDateKey(event.start) > todayKey)
      .sort((first, second) => first.start.getTime() - second.start.getTime())
      .slice(0, 3);
  }

  get hasNoEventsTodayOrUpcoming(): boolean {
    return this.todayEvents.length === 0 && this.upcomingEvents.length === 0;
  }

  getCategoryLabel(label?: CalendarEventLabel): string {
    return label?.name?.trim() || 'Untagged';
  }

  getCategoryStyles(label?: CalendarEventLabel) {
    const color = label?.backgroundColor;
    if (!color || !/^#[\da-f]{6}$/i.test(color)) {
      return UNTAGGED_STYLES;
    }

    return { line: color, badgeBg: color, badgeText: this.getContrastText(color) };
  }

  getEventTagLabel(event: DayEvent): string {
    if (event.source === 'personal') {
      return this.currentUserName.trim() || 'Untagged';
    }

    return this.getCategoryLabel(event.eventLabel);
  }

  getEventTagStyles(event: DayEvent) {
    if (event.source === 'personal') {
      return this.getOwnerStyles();
    }

    const label = this.getCategoryLabel(event.eventLabel);
    if (label.toLocaleLowerCase('es-ES') === 'gabi') {
      return EVENT_OWNER_STYLES.orange;
    }

    return this.getCategoryStyles(event.eventLabel);
  }

  getEventLineColor(event: DayEvent): string {
    return this.getEventTagStyles(event).line;
  }

  getOwnerStyles() {
    return this.currentUserName.trim().toLocaleLowerCase('es-ES') === 'aldara'
      ? EVENT_OWNER_STYLES.purple
      : EVENT_OWNER_STYLES.orange;
  }

  formatEventTime(event: DayEvent): string {
    if (event.allDay) {
      return 'Todo el día';
    }

    return `${this.formatTime(event.start)}-${this.formatTime(event.end)}`;
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

  getDateKey(date: Date): string {
    return this.toDateKey(date);
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  private getContrastText(color: string): string {
    const red = Number.parseInt(color.slice(1, 3), 16);
    const green = Number.parseInt(color.slice(3, 5), 16);
    const blue = Number.parseInt(color.slice(5, 7), 16);
    const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

    return brightness > 150 ? '#171716' : '#FFFFFF';
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
