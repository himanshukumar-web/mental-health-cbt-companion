import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.sera.app',
  appName: 'Sera',
  webDir: 'out',
  plugins: {
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true,
    },
  },
  server: {
    // Allow mixed content (HTTP WebSocket from HTTPS-like WebView)
    androidScheme: 'http',
    // Allow navigation to production backend, Supabase, Vercel, and local endpoints
    allowNavigation: [
      "https://mental-health-cbt-companion.onrender.com",
      "wss://mental-health-cbt-companion.onrender.com",
      "*.onrender.com",
      "*.supabase.co",
      "*.vercel.app",
      "192.168.*",
      "10.0.2.2",
      "localhost"
    ],
  },
};

export default config;

