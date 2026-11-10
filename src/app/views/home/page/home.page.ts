/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @angular-eslint/prefer-inject */
import { CommonModule } from '@angular/common';
import type { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular';

import { HeaderComponent } from '../../../shared/header/header.component';
import { SupabaseService } from '../../../shared/services/supabase.service';
import { DailyQuestionCardComponent } from '../components/daily-question-card/daily-question-card.component';
import type { DayEvent } from '../components/day-schedule-card/day-schedule-card.component';
import { DayScheduleCardComponent } from '../components/day-schedule-card/day-schedule-card.component';
import { DecisionCardComponent } from '../components/decision-card/decision-card.component';
import { MoodCardComponent } from '../components/mood-card/mood-card.component';
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
  templateUrl: './home.page.html'
})
export class HomePage implements OnInit {
  currentDate: Date = new Date();

  constructor(private supabaseService: SupabaseService) {}

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

  gabiMood = { id: 'gabi', name: 'Gabi', mood: 'Con energía', bgColor: '#F5C078', moodColor: '#71342F', initials: 'G' };
  aldaraMood = {
    id: 'aldara',
    name: 'Aldara',
    mood: 'En calma',
    bgColor: '#B8A9D9',
    moodColor: '#403872',
    initials: 'A',
  };
  hoy: string = '';

  async ngOnInit() {
    const { data, error } = await this.supabaseService.client.from('moods').select('*');

    if (error) {
      console.error('Error fetching moods:', error);
    } else {
      console.log('Fetched moods:', data);
    }
    this.hoy = this.getFormattedDate();
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
}
