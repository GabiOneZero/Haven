import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { Capacitor } from '@capacitor/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SecureAuthStorageService } from './secure-auth-storage.service';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: vi.fn(),
    isNativePlatform: vi.fn(),
  },
}));

vi.mock('@aparajita/capacitor-secure-storage', () => ({
  SecureStorage: {
    getItem: vi.fn(),
    removeItem: vi.fn(),
    setItem: vi.fn(),
    setKeyPrefix: vi.fn(),
  },
}));

describe('SecureAuthStorageService', () => {
  let service: SecureAuthStorageService;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    vi.mocked(Capacitor.getPlatform).mockReturnValue('android');
    vi.mocked(SecureStorage.getItem).mockResolvedValue(null);
    vi.mocked(SecureStorage.setItem).mockResolvedValue();
    vi.mocked(SecureStorage.removeItem).mockResolvedValue();
    vi.mocked(SecureStorage.setKeyPrefix).mockResolvedValue();
    service = new SecureAuthStorageService();
  });

  it('uses the encrypted Android storage and initializes its own key prefix', async () => {
    await service.setItem('auth-token', 'session');
    await service.getItem('auth-token');
    await service.removeItem('auth-token');

    expect(SecureStorage.setKeyPrefix).toHaveBeenCalledOnce();
    expect(SecureStorage.setKeyPrefix).toHaveBeenCalledWith('haven-auth');
    expect(SecureStorage.setItem).toHaveBeenCalledWith('auth-token', 'session');
    expect(SecureStorage.getItem).toHaveBeenCalledWith('auth-token');
    expect(SecureStorage.removeItem).toHaveBeenCalledWith('auth-token');
  });

  it('uses persistent browser storage on the web', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    vi.mocked(Capacitor.getPlatform).mockReturnValue('web');

    await service.setItem('auth-token', 'session');

    expect(await service.getItem('auth-token')).toBe('session');

    await service.removeItem('auth-token');

    expect(await service.getItem('auth-token')).toBeNull();
    expect(SecureStorage.setKeyPrefix).not.toHaveBeenCalled();
  });

  it('rejects unsupported platforms without using the plugin storage', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    vi.mocked(Capacitor.getPlatform).mockReturnValue('ios');

    await expect(service.getItem('auth-token')).rejects.toThrow(
      'El almacenamiento de sesión solo está disponible en Android y navegador web.',
    );
    expect(SecureStorage.getItem).not.toHaveBeenCalled();
    expect(service.failure()).toBeInstanceOf(Error);
  });

  it('surfaces secure-storage failures', async () => {
    vi.mocked(SecureStorage.getItem).mockRejectedValue(new Error('Keystore unavailable'));

    await expect(service.getItem('auth-token')).rejects.toThrow('Keystore unavailable');
    expect(() => service.throwIfUnavailable()).toThrow('No se pudo acceder al almacenamiento seguro de la sesión.');
  });
});
