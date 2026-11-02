import { Component, OnInit } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { ExploreContainerComponent } from '../../../explore-container/explore-container.component';
import { HeaderComponent } from '../../../shared/header/header.component';

@Component({
  selector: 'app-us',
  standalone: true,
  imports: [IonContent, HeaderComponent, ExploreContainerComponent],
  templateUrl: './us.page.html',
  styleUrls: ['./us.page.scss'],
})
export class USPage implements OnInit {
  ngOnInit() {}
}
