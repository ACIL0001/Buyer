import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'mazad.app',
  appName: 'Mazad Click',
  webDir: 'www',
    "server": {
    "url": "https://mazadclick.vercel.app//mobile",
    "cleartext": false
  }
};

export default config;
