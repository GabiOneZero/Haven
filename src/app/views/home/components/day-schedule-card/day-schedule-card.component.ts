import { Component, Input } from '@angular/core';
import { IonCard, IonButton, IonList, IonItem, IonLabel, IonChip } from '@ionic/angular';
import { NgStyle } from '@angular/common';
import { HomeIconComponent } from '../../../../shared/icons/home-icon/home-icon.component';

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
  imports: [IonCard, IonButton, IonList, IonItem, IonLabel, IonChip, NgStyle, HomeIconComponent],
  templateUrl: './day-schedule-card.component.html',
  styleUrls: ['./day-schedule-card.component.scss'],
})
export class DayScheduleCardComponent {
  @Input() weekDay: string = '';
  @Input() date: string = '';
  @Input() events: DayEvent[] = [];
  
  homeIconPaths = { calendarSmall: ['M3.33333 2.5H12.5C13.2404 2.5 13.8333 3.09289 13.8333 3.83333V13.8333C13.8333 14.5738 13.2404 15.1667 12.5 15.1667H3.33333C2.5929 15.1667 2 14.5738 2 13.8333V3.83333C2 3.09289 2.5929 2.5 3.33333 2.5Z', 'M2.5 6.66667H13.3333', 'M6.66667 1.66667V4.16667M8.33333 1.66667V4.16667'] };

  getAccentStyles(accent: string) {
    return EVENT_ACCENT_COLORS[accent as keyof typeof EVENT_ACCENT_COLORS] ?? EVENT_ACCENT_COLORS.green;
  }
}