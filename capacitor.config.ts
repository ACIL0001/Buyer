import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mazadclick.buyer',
  appName: 'MazadClick',
  webDir: 'www',
  server: {
    url: 'https://mazadclick.vercel.app',
    cleartext: false,
    androidScheme: 'https',
    iosScheme: 'https'
  },
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
    overrideUserAgent: 'MazadClickApp/1.0.0 Android'
  },
  ios: {
    scheme: 'mazadclick',
    contentInset: 'always'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#FFFFFF",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    LocalNotifications: {
      smallIcon: "ic_notification",
      iconColor: "#FF0000",
      sound: "beep.wav"
    }
  }
};

export default config;