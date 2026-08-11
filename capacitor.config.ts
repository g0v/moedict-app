import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.audreyt.dict.moe',
  appName: '萌典',
  webDir: 'dist',
  server: {
    // Use the built-in Capacitor web server (no external URL)
    androidScheme: 'https',
    iosScheme: 'https',
  },
  android: {
    // targetSdk 36 makes edge-to-edge mandatory. With no theme opt-out,
    // 'auto' installs system-bar margins on API 35+ (see CapacitorWebView).
    adjustMarginsForEdgeToEdge: 'auto',
  },
  plugins: {
    StatusBar: {
      // Non-overlay bar + Capacitor edge-to-edge margins keep the WebView
      // below the status bar on Android 15/16.
      overlaysWebView: false,
      // 'LIGHT' = light-appearance bar (white bg + dark icons); 'DARK' would invert.
      style: 'LIGHT',
      backgroundColor: '#FFFFFF',
    },
  },
};

export default config;
