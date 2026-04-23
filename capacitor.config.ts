import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.audreyt.dict.moe',
  appName: '萌典',
  webDir: 'dist',
  server: {
    // Use the built-in Capacitor web server (no external URL)
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      // Android 15 enforces edge-to-edge; overlaysWebView=false requires
      // windowOptOutEdgeToEdgeEnforcement=true in AppTheme (android/app/src/main/res/values/styles.xml).
      overlaysWebView: false,
      // 'LIGHT' = light-appearance bar (white bg + dark icons); 'DARK' would invert.
      style: 'LIGHT',
      backgroundColor: '#FFFFFF',
    },
  },
};

export default config;
