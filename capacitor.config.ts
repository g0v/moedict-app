import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.audreyt.dict.moe',
  appName: '萌典',
  webDir: 'dist',
  server: {
    // Use the built-in Capacitor web server (no external URL)
    androidScheme: 'https',
  },
};

export default config;
