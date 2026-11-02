import { Component, OnInit } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { ExploreContainerComponent } from '../../../explore-container/explore-container.component';
import { HeaderComponent } from '../../../shared/header/header.component';

@Component({
  selector: 'app-organize',
  standalone: true,
  imports: [IonContent, HeaderComponent, ExploreContainerComponent],
  templateUrl: './organize.page.html',
  styleUrls: ['./organize.page.scss'],
})
export class OrganizePage implements OnInit {
  ngOnInit() {}
}
