import { Component, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton } from '@ionic/angular';

import { DayScheduleCardComponent } from '../components/day-schedule-card/day-schedule-card.component';
import { MoodCardComponent } from '../components/mood-card/mood-card.component';
import { DailyQuestionCardComponent } from '../components/daily-question-card/daily-question-card.component';
import { ShoppingCardComponent } from '../components/shopping-card/shopping-card.component';
import { DecisionCardComponent } from '../components/decision-card/decision-card.component';
import { HomeIconComponent } from '../../../shared/icons/home-icon/home-icon.component';
import { HomeIconPaths } from '../../../shared/constants/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    DayScheduleCardComponent,
    MoodCardComponent,
    DailyQuestionCardComponent,
    ShoppingCardComponent,
    DecisionCardComponent,
    HomeIconComponent,
  ],
})
export class HomePage implements OnInit {
  greeting: string = '';
  currentDate: Date = new Date();

  homeIconPaths = HomeIconPaths;

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

  private updateGreeting() {
    const hour = this.currentDate.getHours();
    if (hour < 12) {
      this.greeting = 'Buenos días';
    } else if (hour < 20) {
      this.greeting = 'Buenas tardes';
    } else {
      this.greeting = 'Buenas noches';
    }
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
