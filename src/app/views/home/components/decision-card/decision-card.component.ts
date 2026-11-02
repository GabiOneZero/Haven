import { Component } from '@angular/core';
import { IonCard } from '@ionic/angular';
import { HomeIconComponent } from '../../../../shared/icons/home-icon/home-icon.component';


@Component({
  selector: 'app-decision-card',
  standalone: true,
  imports: [IonCard, HomeIconComponent],
  templateUrl: './decision-card.component.html',
  styleUrls: ['./decision-card.component.scss'],
})
export class DecisionCardComponent {
  homeIconPaths = {
    arrowRight: ['M5 10H15', 'M10 5L15 10L10 15'],
    dice: ['M3.33333 2.5H12.5C13.4404 2.5 14.1667 3.22631 14.1667 4.16667V12.5C14.1667 13.4404 13.4404 14.1667 12.5 14.1667H3.33333C2.3929 14.1667 1.66667 13.4404 1.66667 12.5V4.16667C1.66667 3.22631 2.3929 2.5 3.33333 2.5Z', 'M7.5 7.5H7.50833']
  };
}