export interface AppConfig {
  apiUrl: string,
  liveServerUrl: string,
  captchaSiteKey: string,
  appName: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

export const config: AppConfig = {
  apiUrl: import.meta.env.VITE_API_URL,
  liveServerUrl: import.meta.env.VITE_LIVE_SERVER_URL,
  captchaSiteKey: import.meta.env.VITE_CAPTCHA_SITE_KEY,
  appName: import.meta.env.VITE_APP_NAME,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

if(!config.captchaSiteKey){
  console.error('VITE_CAPTCHA_SITE_KEY не настроен');
}