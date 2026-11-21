import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

import type { GoogleCalendarOAuthResult } from './calendar.service';

const ANDROID_OAUTH_SCHEME = 'com.ionic.haven:';
const ANDROID_OAUTH_HOST = 'calendar';
const ANDROID_OAUTH_PATH = '/oauth-return';

export function parseGoogleCalendarOAuthReturn(value: string): GoogleCalendarOAuthResult | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (
    url.protocol !== ANDROID_OAUTH_SCHEME ||
    url.hostname !== ANDROID_OAUTH_HOST ||
    url.pathname !== ANDROID_OAUTH_PATH ||
    url.searchParams.has('code') ||
    url.searchParams.has('state')
  ) {
    return null;
  }

  const result = url.searchParams.get('result');
  return result === 'connected' || result === 'cancelled' || result === 'error' ? result : null;
}

@Injectable({ providedIn: 'root' })
export class GoogleCalendarOAuthReturnService {
  private readonly router = inject(Router);
  private initialization?: Promise<void>;
  private lastHandledUrl: string | null = null;

  initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      return Promise.resolve();
    }

    this.initialization ??= this.initializeAndroidListeners();
    return this.initialization;
  }

  private async initializeAndroidListeners(): Promise<void> {
    await App.addListener('appUrlOpen', ({ url }) => {
      void this.handleUrl(url).catch((error: unknown) => {
        console.error('No se pudo procesar el enlace de retorno de Google Calendar.', error);
      });
    });

    const launch = await App.getLaunchUrl();
    if (launch?.url) {
      await this.handleUrl(launch.url);
    }
  }

  private async handleUrl(value: string): Promise<void> {
    const result = parseGoogleCalendarOAuthReturn(value);
    if (!result || this.lastHandledUrl === value) {
      return;
    }
    this.lastHandledUrl = value;

    try {
      await Browser.close();
    } catch (error) {
      console.warn('No se pudo cerrar el navegador tras volver de Google Calendar.', error);
    }

    await this.router.navigateByUrl(`/tabs/calendar?googleCalendarOAuth=${result}`, {
      replaceUrl: true,
    });
  }
}
