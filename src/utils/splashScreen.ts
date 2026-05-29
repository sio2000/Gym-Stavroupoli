import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

/** Dismiss native splash — retries until Capacitor bridge is ready */
export function dismissSplashScreen(): void {
  if (!Capacitor.isNativePlatform()) return;

  const hide = () => {
    void SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {});
  };

  hide();
  requestAnimationFrame(hide);
  window.setTimeout(hide, 50);
  window.setTimeout(hide, 250);
  window.setTimeout(hide, 1000);
  window.setTimeout(hide, 2500);
}
