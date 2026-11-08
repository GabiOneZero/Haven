import { Component } from '@angular/core';
import { IonCard, IonCardContent } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-daily-question-card',
  standalone: true,
  imports: [IonCard, IonCardContent, IconComponent, CommonModule],
  templateUrl: './daily-question-card.component.html',
  styleUrls: ['./daily-question-card.component.scss'],
})
export class DailyQuestionCardComponent {
}