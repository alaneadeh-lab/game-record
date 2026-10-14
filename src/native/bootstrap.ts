import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

/**
 * Wire Capacitor plugins once the web view is ready.
 * Safe to call on web — it becomes a no-op outside native shells.
 */
export async function bootstrapNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  document.documentElement.classList.add('native-app');
  document.documentElement.classList.add(`platform-${Capacitor.getPlatform()}`);

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#14532d' });
    }
  } catch (error) {
    console.warn('StatusBar plugin unavailable:', error);
  }

  try {
    await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
  } catch {
    // Keyboard resize mode is optional across platforms/plugin versions.
  }

  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
      return;
    }
    CapApp.exitApp();
  });

  try {
    await SplashScreen.hide();
  } catch (error) {
    console.warn('SplashScreen hide failed:', error);
  }
}
