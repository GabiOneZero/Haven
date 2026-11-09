/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @angular-eslint/prefer-inject */
import { CommonModule } from '@angular/common';
import type { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular';

import { IconComponent } from '../../../shared/components/icon/icon.component';
import { HeaderComponent } from '../../../shared/header/header.component';
import { SupabaseService } from '../../../shared/services/supabase.service';
import { DailyQuestionCardComponent } from '../components/daily-question-card/daily-question-card.component';
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
    IconComponent,
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  currentDate: Date = new Date();

  constructor(private supabaseService: SupabaseService) {}

  events = [
    { id: '1', title: 'Paseo y vermut al sol', startHour: '12:00', endHour: '13:30', person: 'Juntos', accentColor: 'green' as const },
    { id: '2', title: 'Comida con amigos', startHour: '13:30', endHour: '15:00', person: 'Aldara', accentColor: 'purple' as const },
    { id: '3', title: 'Clase de cerámica juntos', startHour: '19:00', endHour: '20:30', person: 'Juntos', accentColor: 'orange' as const },
  ];

  gabiMood = { id: 'gabi', name: 'Gabi', mood: 'Con energía', bgColor: '#F5C078', moodColor: '#71342F', initials: 'G' };
  aldaraMood = { id: 'aldara', name: 'Aldara', mood: 'En calma', bgColor: '#B8A9D9', moodColor: '#403872', initials: 'A' };
  hoy: string = '';

  get showMoodsHeart(): boolean {
    return this.gabiMood.mood === this.aldaraMood.mood;
  }

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
  .replace(/^./, letra => letra.toUpperCase());
  }
}
