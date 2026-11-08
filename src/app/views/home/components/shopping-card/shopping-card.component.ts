import { Component } from '@angular/core';
import { IonCard, IonCardContent } from '@ionic/angular';

import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-shopping-card',
  standalone: true,
  imports: [IonCard, IonCardContent, IconComponent],
  templateUrl: './shopping-card.component.html',
  styleUrls: ['./shopping-card.component.scss'],
})
export class ShoppingCardComponent {
}