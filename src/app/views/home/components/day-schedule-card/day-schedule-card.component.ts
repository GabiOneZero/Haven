/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { NgStyle } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonCard, IonItem, IonLabel, IonList } from '@ionic/angular';

import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { TagComponent } from '../../../../shared/components/tag/tag.component';
import {
  getCategoryLabel as resolveCategoryLabel,
  getCategoryStyles as resolveCategoryStyles,
  getEventLineColor as resolveEventLineColor,
  getEventTagLabel as resolveEventTagLabel,
  getEventTagStyles as resolveEventTagStyles,
  getOwnerStyles as resolveOwnerStyles,
} from '../../../../shared/components/tag/event-tag.utils';
import type { CalendarEvent, CalendarEventLabel } from '../../../../shared/services/calendar.service';

export type DayEvent = CalendarEvent;

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
    return resolveCategoryLabel(label);
  }

  getCategoryStyles(label?: CalendarEventLabel) {
    return resolveCategoryStyles(label);
  }

  getEventTagLabel(event: DayEvent): string {
    return resolveEventTagLabel(event, this.currentUserName);
  }

  getEventTagStyles(event: DayEvent) {
    return resolveEventTagStyles(event, this.currentUserName);
  }

  getEventLineColor(event: DayEvent): string {
    return resolveEventLineColor(event, this.currentUserName);
  }

  getOwnerStyles() {
    return resolveOwnerStyles(this.currentUserName);
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

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
