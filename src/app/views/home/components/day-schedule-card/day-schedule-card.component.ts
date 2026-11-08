/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { NgStyle } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonButton, IonCard, IonChip, IonItem, IonLabel, IonList } from '@ionic/angular';

import { IconComponent } from '../../../../shared/components/icon/icon.component';

export interface DayEvent {
  id: string;
  title: string;
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
  imports: [IonCard, IonButton, IonList, IonItem, IonLabel, IonChip, NgStyle, IconComponent],
  templateUrl: './day-schedule-card.component.html',
  styleUrls: ['./day-schedule-card.component.scss'],
})
export class DayScheduleCardComponent {
  @Input() date: string = '';
  @Input() events: DayEvent[] = [];
  @Input() weekDay: string = '';

  getAccentStyles(accent: DayEvent['accentColor']) {
    return EVENT_ACCENT_COLORS[accent] ?? EVENT_ACCENT_COLORS.green;
  }
}