import { Injectable, signal } from '@angular/core';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { Capacitor } from '@capacitor/core';
import type { SupportedStorage } from '@supabase/supabase-js';

const STORAGE_PREFIX = 'haven-auth';

@Injectable({ providedIn: 'root' })
export class SecureAuthStorageService implements SupportedStorage {
  readonly failure = signal<Error | null>(null);

  private initialization?: Promise<void>;

  async initialize(): Promise<void> {
    this.initialization ??= this.initializeSecureStorage();

    try {
      await this.initialization;
    } catch (error) {
      this.recordFailure(error);
      throw error;
    }
  }

  async getItem(key: string): Promise<string | null> {
    return this.runStorageOperation(async () =>
      this.usesBrowserStorage ? localStorage.getItem(this.getBrowserKey(key)) : SecureStorage.getItem(key),
    );
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.runStorageOperation(async () => {
      if (this.usesBrowserStorage) {
        localStorage.setItem(this.getBrowserKey(key), value);
      } else {
        await SecureStorage.setItem(key, value);
      }
    });
  }

  async removeItem(key: string): Promise<void> {
    await this.runStorageOperation(async () => {
      if (this.usesBrowserStorage) {
        localStorage.removeItem(this.getBrowserKey(key));
      } else {
        await SecureStorage.removeItem(key);
      }
    });
  }

  throwIfUnavailable(): void {
    const failure = this.failure();

    if (failure) {
      throw new Error('No se pudo acceder al almacenamiento seguro de la sesión.', { cause: failure });
    }
  }

  private async initializeSecureStorage(): Promise<void> {
    if (this.usesBrowserStorage) {
      const testKey = `${STORAGE_PREFIX}:availability-check`;
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return;
    }

    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      throw new Error('El almacenamiento de sesión solo está disponible en Android y navegador web.');
    }

    await SecureStorage.setKeyPrefix(STORAGE_PREFIX);
  }

  private get usesBrowserStorage(): boolean {
    return !Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'web';
  }

  private getBrowserKey(key: string): string {
    return `${STORAGE_PREFIX}:${key}`;
  }

  private async runStorageOperation<T>(operation: () => Promise<T>): Promise<T> {
    try {
      await this.initialize();
      return await operation();
    } catch (error) {
      this.recordFailure(error);
      throw error;
    }
  }

  private recordFailure(error: unknown): void {
    this.failure.set(
      error instanceof Error ? error : new Error('Falló una operación del almacenamiento seguro.', { cause: error }),
    );
  }
}
