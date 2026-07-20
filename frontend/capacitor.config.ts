import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sera.app',
  appName: 'Sera',
  webDir: 'out',
  server: {
    // Allow mixed content (HTTP WebSocket from HTTPS-like WebView)
    androidScheme: 'http',
    // Allow navigation to the backend for WebSocket connections
    allowNavigation: ['192.168.*', '10.0.2.2', 'localhost'],
  },
};

export default config;

