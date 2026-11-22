import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [IonContent],
  templateUrl: './event-form.component.html',
})
export class EventFormComponent {
  private readonly router = inject(Router);

  goBack(): void {
    void this.router.navigateByUrl('/tabs/calendar');
  }
}
