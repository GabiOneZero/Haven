import { Component, OnInit } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { HeaderComponent } from '../../../shared/header/header.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [IonContent, HeaderComponent],
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
})
export class CalendarPage implements OnInit {
  ngOnInit() {}
}
