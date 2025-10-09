import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export const initCapacitor = async () => {
  // Έλεγχος αν τρέχουμε σε native platform
  if (Capacitor.isNativePlatform()) {
    try {
      // Ρύθμιση Status Bar
      await StatusBar.setStyle({ style: Style.Light });
      
      if (Capacitor.getPlatform() === 'android') {
        await StatusBar.setBackgroundColor({ color: '#000000' });
      }

      // Απόκρυψη Splash Screen
      await SplashScreen.hide();

      // Listener για back button (Android)
      if (Capacitor.getPlatform() === 'android') {
        App.addListener('backButton', ({ canGoBack }) => {
          if (!canGoBack) {
            App.exitApp();
          } else {
            window.history.back();
          }
        });
      }

      console.log('Capacitor initialized successfully');
    } catch (error) {
      console.error('Error initializing Capacitor:', error);
    }
  }
};

// Get platform info
export const getPlatformInfo = () => {
  return {
    isNative: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform(),
    isAndroid: Capacitor.getPlatform() === 'android',
    isIOS: Capacitor.getPlatform() === 'ios',
    isWeb: Capacitor.getPlatform() === 'web',
  };
};

