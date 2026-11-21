import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';

import { GoogleCalendarOAuthReturnService } from './shared/services/google-calendar-oauth-return.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private readonly googleCalendarOAuthReturn = inject(GoogleCalendarOAuthReturnService);

  constructor() {
    void this.googleCalendarOAuthReturn.initialize().catch((error: unknown) => {
      console.error('No se pudo inicializar el retorno OAuth de Google Calendar.', error);
    });
  }
}
