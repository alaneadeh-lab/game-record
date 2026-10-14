import { Capacitor } from '@capacitor/core';

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export function getPlatform(): 'ios' | 'android' | 'web' {
  const platform = Capacitor.getPlatform();
  if (platform === 'ios' || platform === 'android') {
    return platform;
  }
  return 'web';
}
