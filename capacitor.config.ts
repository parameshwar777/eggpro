import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.eggpro.app',
  appName: 'EggPro',
  webDir: 'dist',
  android: {
    allowMixedContent: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  },
  // For development hot reload, uncomment below:
  // server: {
  //   url: 'https://643b08b6-2f0e-44d0-b2dc-832a82133adb.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
};

export default config;
