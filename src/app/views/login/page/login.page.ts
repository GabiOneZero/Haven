import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonContent],
  templateUrl: './login.page.html'
})
export class LoginPage {
  formMessage = '';

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.formMessage = 'La conexión del acceso se añadirá en una siguiente fase.';
  }
}