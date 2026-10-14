import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNativePlatform } from '../utils/platform';

export async function impactLight(): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Ignore when the plugin is unavailable.
  }
}

export async function notifySuccess(): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    // Ignore when the plugin is unavailable.
  }
}

export async function notifyError(): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch {
    // Ignore when the plugin is unavailable.
  }
}
