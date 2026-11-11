import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthApiError } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../shared/services/auth.service';

import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let auth: {
    errorMessage: ReturnType<typeof vi.fn>;
    initialize: ReturnType<typeof vi.fn>;
    signInWithPassword: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
  };
  let navigateByUrl: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    auth = {
      errorMessage: vi.fn().mockReturnValue(null),
      initialize: vi.fn().mockResolvedValue(undefined),
      signInWithPassword: vi.fn().mockResolvedValue(undefined),
      status: vi.fn().mockReturnValue('unauthenticated'),
    };
    navigateByUrl = vi.fn().mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: { navigateByUrl } },
      ],
    }).compileComponents();
  });

  it('submits the credentials and navigates to Home after success', async () => {
    const fixture = TestBed.createComponent(LoginPage);
    const component = fixture.componentInstance;
    await component.ngOnInit();
    component.form.setValue({ email: ' user@example.com ', password: 'secret' });

    await component.onSubmit();

    expect(auth.signInWithPassword).toHaveBeenCalledWith('user@example.com', 'secret');
    expect(navigateByUrl).toHaveBeenCalledWith('/tabs/home', { replaceUrl: true });
  });

  it('does not submit invalid or duplicate requests', async () => {
    const fixture = TestBed.createComponent(LoginPage);
    const component = fixture.componentInstance;
    await component.ngOnInit();

    await component.onSubmit();

    expect(auth.signInWithPassword).not.toHaveBeenCalled();
    expect(component.formMessage()).toContain('correo electrónico válido');

    component.form.setValue({ email: 'user@example.com', password: 'secret' });
    component.isSubmitting.set(true);
    await component.onSubmit();

    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('keeps the submit button enabled when authentication is available', async () => {
    const fixture = TestBed.createComponent(LoginPage);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    const submitButton: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');

    expect(submitButton.disabled).toBe(false);
  });

  it('shows a safe message for incorrect credentials', async () => {
    const fixture = TestBed.createComponent(LoginPage);
    const component = fixture.componentInstance;
    await component.ngOnInit();
    component.form.setValue({ email: 'user@example.com', password: 'wrong-password' });
    auth.signInWithPassword.mockRejectedValue(
      new AuthApiError('Invalid login credentials', 400, 'invalid_credentials'),
    );

    await component.onSubmit();

    expect(component.formMessage()).toBe('Correo o contraseña incorrectos.');
  });
});
