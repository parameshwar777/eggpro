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
    },
    GoogleAuth: {
      scopes: ["profile", "email"],
      // Web OAuth client ID (used to mint the id_token)
      serverClientId: "417484278904-t3ls8666bg39cha1cip8p0is64ccmua5.apps.googleusercontent.com",
      // Android OAuth client ID (package name + SHA-1 restricted)
      androidClientId: "417484278904-seliop9r1alchip6bp08ksn09tgel53l.apps.googleusercontent.com",
      forceCodeForRefreshToken: true,
    }
  },
  // For development hot reload, uncomment below:
  // server: {
  //   url: 'https://643b08b6-2f0e-44d0-b2dc-832a82133adb.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
};

export default config;
