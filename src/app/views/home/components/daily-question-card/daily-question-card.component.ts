import { Component } from '@angular/core';
import { IonCard, IonCardContent } from '@ionic/angular';
import { HomeIconComponent } from '../../../../shared/icons/home-icon/home-icon.component';

@Component({
  selector: 'app-daily-question-card',
  standalone: true,
  imports: [IonCard, IonCardContent, HomeIconComponent],
  templateUrl: './daily-question-card.component.html',
  styleUrls: ['./daily-question-card.component.scss'],
})
export class DailyQuestionCardComponent {
  homeIconPaths = {
    sparkle: ['M10 1L11.5 8.5L19 10L11.5 11.5L10 19L8.5 11.5L1 10L8.5 8.5L10 1Z'],
    arrowRight: ['M5 10H15', 'M10 5L15 10L10 15']
  };
}