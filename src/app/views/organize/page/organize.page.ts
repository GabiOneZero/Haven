import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular';

import { ExploreContainerComponent } from '../../../explore-container/explore-container.component';

@Component({
  selector: 'app-organize',
  templateUrl: 'organize.page.html',
  styleUrls: ['organize.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, ExploreContainerComponent],
})
export class OrganizePage {
  constructor() {}
}
