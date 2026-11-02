import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular';

import { ExploreContainerComponent } from '../../../explore-container/explore-container.component';

@Component({
  selector: 'app-us',
  templateUrl: 'us.page.html',
  styleUrls: ['us.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, ExploreContainerComponent],
})
export class USPage {
  constructor() {}
}
