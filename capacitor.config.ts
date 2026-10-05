import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'hu.nexai.sorsfordito',
  appName: 'Sorsfordító',
  webDir: 'out',
  android: {
    // WebRTC (többjátékos mód) és a heti adatok https-en jönnek
    allowMixedContent: false,
  },
};

export default config;
