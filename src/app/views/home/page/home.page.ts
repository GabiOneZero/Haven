import { Component, OnInit } from '@angular/core';
import { DailyQuestionCardComponent } from '../components/daily-question-card/daily-question-card.component';
import { DayScheduleCardComponent } from '../components/day-schedule-card/day-schedule-card.component';
import { DecisionCardComponent } from '../components/decision-card/decision-card.component';
import { MoodCardComponent } from '../components/mood-card/mood-card.component';
import { ShoppingCardComponent } from '../components/shopping-card/shopping-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    DayScheduleCardComponent,
    MoodCardComponent,
    DailyQuestionCardComponent,
    ShoppingCardComponent,
    DecisionCardComponent,
  ],
  template: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  currentDate: Date = new Date();

  events = [
    {
      id: '1',
      title: 'Paseo y vermut al sol',
      startHour: '12:00',
      endHour: '13:30',
      person: 'Juntos',
      accentColor: 'green' as const,
    },
    {
      id: '2',
      title: 'Comida con amigos',
      startHour: '13:30',
      endHour: '15:00',
      person: 'Aldara',
      accentColor: 'purple' as const,
    },
    {
      id: '3',
      title: 'Clase de cerámica juntos',
      startHour: '19:00',
      endHour: '20:30',
      person: 'Juntos',
      accentColor: 'orange' as const,
    },
  ];

  moods = [
    {
      id: 'gabi',
      name: 'Gabi',
      mood: 'Con energía',
      bgColor: 'var(--haven-mood-gabi-bg)',
    },
    {
      id: 'aldara',
      name: 'Aldara',
      mood: 'En calma',
      bgColor: 'var(--haven-mood-aldara-bg)',
    },
  ];

  ngOnInit() {
    this.updateGreeting();
  }

  updateGreeting() {
    const hour = this.currentDate.getHours();
    // Note: The greeting is now handled by AppLayoutComponent
  }

  getFormattedDate(): string {
    return this.currentDate.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
    });
  }

  getWeekDay(): string {
    return this.currentDate.toLocaleDateString('es-ES', { weekday: 'long' }).toUpperCase();
  }
}
