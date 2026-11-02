import { Component } from '@angular/core';
import { IonCard, IonCardContent } from '@ionic/angular';
import { HomeIconComponent } from '../../../../shared/icons/home-icon/home-icon.component';

@Component({
  selector: 'app-shopping-card',
  standalone: true,
  imports: [IonCard, IonCardContent, HomeIconComponent],
  templateUrl: './shopping-card.component.html',
  styleUrls: ['./shopping-card.component.scss'],
})
export class ShoppingCardComponent {
  homeIconPaths = {
    cart: ['M3.33333 3.33333H5.83333L8.33333 10.8333H16.6667L14.1667 4.16667H5.83333', 'M6.66667 15C6.66667 15.7404 7.25977 16.3333 8 16.3333C8.74044 16.3333 9.33333 15.7404 9.33333 15', 'M12.5 15C12.5 15.7404 13.0929 16.3333 13.8333 16.3333C14.5738 16.3333 15.1667 15.7404 15.1667 15']
  };
}