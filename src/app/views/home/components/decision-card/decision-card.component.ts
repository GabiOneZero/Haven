import { Component } from '@angular/core';
import { IonCard } from '@ionic/angular';

import { IconComponent } from '../../../../shared/components/icon/icon.component';


@Component({
  selector: 'app-decision-card',
  standalone: true,
  imports: [IonCard, IconComponent],
  templateUrl: './decision-card.component.html',
  styleUrls: ['./decision-card.component.scss'],
})
export class DecisionCardComponent {
}