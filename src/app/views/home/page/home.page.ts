import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { IonContent } from '@ionic/angular';

import { HeaderComponent } from '../../../shared/header/header.component';
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

  private moodService = inject(MoodService);

  events: DayEvent[] = [
    {
      id: '1',
      title: 'Paseo y vermut al sol',
      date: this.getDateKey(1),
      startHour: '12:00',
      endHour: '13:30',
      person: 'Juntos',
      accentColor: 'green',
    },
    {
      id: '2',
      title: 'Comida con amigos',
      date: this.getDateKey(2),
      startHour: '13:30',
      endHour: '15:00',
      person: 'Aldara',
      accentColor: 'purple',
    },
    {
      id: '3',
      title: 'Clase de cerámica juntos',
      date: this.getDateKey(3),
      startHour: '19:00',
      endHour: '20:30',
      person: 'Juntos',
      accentColor: 'orange',
    },
  ];

  moods = signal<[MoodData, MoodData] | null>(null);
  moodsLoading = signal(true);
  moodsError = signal<string | null>(null);
  hoy: string = '';

  async ngOnInit(): Promise<void> {
    this.hoy = this.getFormattedDate();

    try {
      const workspaceMoods = await this.moodService.getCurrentWorkspaceMoods();
      this.moods.set([this.toMoodData(workspaceMoods[0], 0), this.toMoodData(workspaceMoods[1], 1)]);
    } catch (error) {
      console.error('Error fetching workspace moods:', error);
      this.moodsError.set('No se pudieron cargar los estados de ánimo.');
    } finally {
      this.moodsLoading.set(false);
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

  private getDateKey(daysFromToday: number): string {
    const date = new Date(this.currentDate);
    date.setDate(date.getDate() + daysFromToday);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private toMoodData(memberMood: WorkspaceMemberMood, position: 0 | 1): MoodData {
    const name = memberMood.displayName.trim() || 'Usuario';
    const palette =
      position === 0 ? { bgColor: '#F5C078', moodColor: '#71342F' } : { bgColor: '#B8A9D9', moodColor: '#403872' };

    return {
      id: memberMood.userId,
      name,
      mood: memberMood.mood?.trim() || 'Sin mood',
      ...palette,
      initials: name.charAt(0).toUpperCase(),
    };
  }
}
