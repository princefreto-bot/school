import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dghubschool.app',
  appName: 'DGhubSchool',
  webDir: 'dist',
  server: {
    cleartext: true
  }
};

export default config;
