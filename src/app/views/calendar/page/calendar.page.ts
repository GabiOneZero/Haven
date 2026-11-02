import { Component, inject, OnInit } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { ExploreContainerComponent } from '../../../explore-container/explore-container.component';
import { HeaderComponent } from '../../../shared/header/header.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [IonContent, HeaderComponent, ExploreContainerComponent],
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
})
export class CalendarPage implements OnInit {
  ngOnInit() {}
}
