import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Light tactile feedback for taps.
 * Progressive enhancement: silently no-ops on the web and on devices without a
 * vibration motor, so callers never need to guard it.
 */
export async function hapticTap(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Haptics are decorative; a failure here must never interrupt the flow.
  }
}
