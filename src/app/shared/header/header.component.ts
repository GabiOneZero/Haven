import { Component, Input } from '@angular/core';
import { IonButton } from '@ionic/angular';
import { HomeIconComponent } from '../icons/home-icon/home-icon.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [IonButton, HomeIconComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Input() title: string = '';
  bellPaths = ['M17.5 14.5C17.5 17.5 15 19 12 19C9 19 6.5 17.5 6.5 14.5C6.5 11.5 5 10 5 8.5L5 5C5 3.5 6.5 2 8 2H16C17.5 2 19 3.5 19 5L19 8.5C19 10 17.5 11.5 17.5 14.5Z'];
  flamePaths = ['M12 21C12 21 16 16 16 12C16 9 14 7 12 7C10 7 8 9 8 12C8 16 12 21 12 21Z', 'M12 21C12 21 15 17 15 13'];
}
