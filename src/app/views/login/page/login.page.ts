import type { OnInit } from '@angular/core';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';

import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonContent, ReactiveFormsModule],
  templateUrl: './login.page.html',
})
export class LoginPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  readonly isSubmitting = signal(false);
  readonly formMessage = signal('');
  readonly authUnavailable = computed(() => this.auth.status() === 'error');

  async ngOnInit(): Promise<void> {
    await this.auth.initialize();

    if (this.auth.status() === 'error') {
      this.formMessage.set(this.auth.errorMessage() ?? 'No se pudo restaurar la sesión. Inténtalo de nuevo más tarde.');
    }
  }

  async onSubmit(): Promise<void> {
    if (this.isSubmitting()) {
      return;
    }

    this.form.controls.email.setValue(this.form.controls.email.value.trim());
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.formMessage.set('Introduce un correo electrónico válido y tu contraseña.');
      return;
    }

    this.isSubmitting.set(true);
    this.formMessage.set('');

    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.signInWithPassword(email.trim(), password);
      await this.router.navigateByUrl('/tabs/home', { replaceUrl: true });
    } catch (error) {
      this.formMessage.set(this.getSignInErrorMessage(error));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private getSignInErrorMessage(error: unknown): string {
    if (this.auth.status() === 'error') {
      return this.auth.errorMessage() ?? 'No se pudo restaurar la sesión. Inténtalo de nuevo más tarde.';
    }

    if (error instanceof AuthRetryableFetchError || error instanceof TypeError) {
      return 'No se pudo conectar. Comprueba tu conexión e inténtalo de nuevo.';
    }

    if (error instanceof AuthApiError) {
      if (['invalid_credentials', 'user_not_found', 'email_not_confirmed'].includes(error.code ?? '')) {
        return 'Correo o contraseña incorrectos.';
      }

      if (error.status >= 500) {
        return 'El servicio de acceso no está disponible. Inténtalo de nuevo más tarde.';
      }
    }

    return 'No se pudo iniciar sesión. Inténtalo de nuevo.';
  }
}
