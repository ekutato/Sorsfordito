import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'hu.nexai.sorsfordito',
  appName: 'Sorsfordító',
  webDir: 'out',
  android: {
    // WebRTC (többjátékos mód) és a heti adatok https-en jönnek
    allowMixedContent: false,
  },
  plugins: {
    // Android 15+ edge-to-edge: a biztonsági sávok CSS-változóként is megjönnek
    SystemBars: { insetsHandling: 'css' },
  },
};

export default config;
