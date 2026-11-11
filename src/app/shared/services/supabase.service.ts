import { inject, Injectable } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

import { environment } from '../../../environments/environment';

import { SecureAuthStorageService } from './secure-auth-storage.service';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private readonly authStorage = inject(SecureAuthStorageService);
  private supabase?: SupabaseClient;

  get client(): SupabaseClient {
    this.supabase ??= createClient(environment.supabaseUrl, environment.supabasePublishableKey, {
      auth: {
        storage: this.authStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });

    return this.supabase;
  }
}
