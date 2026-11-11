import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

import { SecureAuthStorageService } from './secure-auth-storage.service';
import { SupabaseService } from './supabase.service';

export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated' | 'error';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly supabaseService = inject(SupabaseService);
  private readonly secureStorage = inject(SecureAuthStorageService);

  private readonly authStatus = signal<AuthStatus>('initializing');
  private readonly sessionValue = signal<Session | null>(null);
  private readonly initializationMessage = signal<string | null>(null);

  readonly status = computed<AuthStatus>(() => (this.secureStorage.failure() ? 'error' : this.authStatus()));
  readonly session = this.sessionValue.asReadonly();
  readonly errorMessage = computed(() =>
    this.secureStorage.failure()
      ? Capacitor.getPlatform() === 'web'
        ? 'No se pudo acceder al almacenamiento de sesión del navegador.'
        : 'No se pudo acceder al almacenamiento seguro de la sesión.'
      : this.initializationMessage(),
  );

  private initialization?: Promise<void>;

  initialize(): Promise<void> {
    this.initialization ??= this.initializeSession();
    return this.initialization;
  }

  async signInWithPassword(email: string, password: string): Promise<void> {
    await this.initialize();

    if (this.status() !== 'unauthenticated') {
      throw new Error(this.errorMessage() ?? 'No se puede iniciar sesión en este momento.');
    }

    const { error } = await this.supabaseService.client.auth.signInWithPassword({ email, password });

    if (error) {
      throw error;
    }
  }

  async signOut(): Promise<void> {
    await this.initialize();

    if (this.status() !== 'authenticated') {
      throw new Error(this.errorMessage() ?? 'No hay una sesión activa que cerrar.');
    }

    const { error } = await this.supabaseService.client.auth.signOut({ scope: 'local' });

    if (error) {
      throw error;
    }
  }

  private async initializeSession(): Promise<void> {
    try {
      await this.secureStorage.initialize();
      const { data, error } = await this.supabaseService.client.auth.getSession();
      this.secureStorage.throwIfUnavailable();

      if (error) {
        throw error;
      }

      this.setSession(data.session);
      this.supabaseService.client.auth.onAuthStateChange((event, session) => {
        this.handleAuthStateChange(event, session);
      });

      await this.configureNativeTokenRefresh();
    } catch (error) {
      this.initializationMessage.set(
        error instanceof Error ? error.message : 'No se pudo restaurar la sesión. Inténtalo de nuevo más tarde.',
      );
      this.authStatus.set('error');
    }
  }

  private handleAuthStateChange(event: AuthChangeEvent, session: Session | null): void {
    const hadSession = this.sessionValue() !== null;
    this.setSession(session);

    if (event === 'SIGNED_OUT' && hadSession) {
      void this.router.navigateByUrl('/login', { replaceUrl: true }).catch((error: unknown) => {
        console.error('No se pudo volver al login después de cerrar la sesión.', error);
      });
    }
  }

  private setSession(session: Session | null): void {
    this.sessionValue.set(session);
    this.authStatus.set(session ? 'authenticated' : 'unauthenticated');
  }

  private async configureNativeTokenRefresh(): Promise<void> {
    if (Capacitor.getPlatform() !== 'android') {
      return;
    }

    const client = this.supabaseService.client;
    await App.addListener('appStateChange', ({ isActive }) => {
      const refresh = isActive ? client.auth.startAutoRefresh() : client.auth.stopAutoRefresh();
      void refresh.catch((error: unknown) => {
        console.error('No se pudo actualizar el ciclo de renovación de la sesión.', error);
      });
    });

    const { isActive } = await App.getState();
    if (isActive) {
      await client.auth.startAutoRefresh();
    } else {
      await client.auth.stopAutoRefresh();
    }
  }
}
