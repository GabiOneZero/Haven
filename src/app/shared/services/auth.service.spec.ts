import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { Session } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service';
import { SecureAuthStorageService } from './secure-auth-storage.service';
import { SupabaseService } from './supabase.service';

describe('AuthService', () => {
  let service: AuthService;
  let authStateChange: ((event: string, session: Session | null) => void) | undefined;
  let auth: {
    getSession: ReturnType<typeof vi.fn>;
    onAuthStateChange: ReturnType<typeof vi.fn>;
    signInWithPassword: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
    startAutoRefresh: ReturnType<typeof vi.fn>;
    stopAutoRefresh: ReturnType<typeof vi.fn>;
  };
  let secureStorage: {
    failure: ReturnType<typeof signal<Error | null>>;
    initialize: ReturnType<typeof vi.fn>;
    throwIfUnavailable: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authStateChange = undefined;
    auth = {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn((callback) => {
        authStateChange = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      startAutoRefresh: vi.fn().mockResolvedValue(undefined),
      stopAutoRefresh: vi.fn().mockResolvedValue(undefined),
    };
    secureStorage = {
      failure: signal<Error | null>(null),
      initialize: vi.fn().mockResolvedValue(undefined),
      throwIfUnavailable: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideRouter([]),
        { provide: SupabaseService, useValue: { client: { auth } } },
        { provide: SecureAuthStorageService, useValue: secureStorage },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('restores a persisted session before exposing the authenticated state', async () => {
    const restoredSession = {
      access_token: 'access-token',
      expires_at: 1,
      expires_in: 3600,
      refresh_token: 'refresh-token',
      token_type: 'bearer',
      user: {},
    } as Session;
    auth.getSession.mockResolvedValue({ data: { session: restoredSession }, error: null });

    await service.initialize();

    expect(secureStorage.initialize).toHaveBeenCalledOnce();
    expect(auth.getSession).toHaveBeenCalledOnce();
    expect(service.session()).toBe(restoredSession);
    expect(service.status()).toBe('authenticated');
  });

  it('signs out only the current device', async () => {
    auth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'access-token',
          expires_at: 1,
          expires_in: 3600,
          refresh_token: 'refresh-token',
          token_type: 'bearer',
          user: {},
        } as Session,
      },
      error: null,
    });

    await service.signOut();

    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('blocks initialization and exposes an explicit storage error', async () => {
    secureStorage.initialize.mockImplementation(async () => {
      secureStorage.failure.set(new Error('Keystore unavailable'));
      throw new Error('Keystore unavailable');
    });

    await service.initialize();

    expect(service.status()).toBe('error');
    expect(service.errorMessage()).toContain('No se pudo acceder al almacenamiento de sesión');
    expect(auth.getSession).not.toHaveBeenCalled();
  });

  it('redirects an authenticated user to login when Supabase signs them out', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const restoredSession = {
      access_token: 'access-token',
      expires_at: 1,
      expires_in: 3600,
      refresh_token: 'refresh-token',
      token_type: 'bearer',
      user: {},
    } as Session;
    auth.getSession.mockResolvedValue({ data: { session: restoredSession }, error: null });

    await service.initialize();
    authStateChange?.('SIGNED_OUT', null);

    expect(navigateSpy).toHaveBeenCalledWith('/login', { replaceUrl: true });
    expect(service.status()).toBe('unauthenticated');
  });
});
