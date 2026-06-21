export interface AppConfig {
  apiUrl: string,
  captchaSiteKey: string,
  appName: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

export const config: AppConfig = {
  apiUrl: import.meta.env.VITE_API_URL,
  captchaSiteKey: import.meta.env.VITE_CAPTCHA_SITE_KEY,
  appName: import.meta.env.VITE_APP_NAME,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

if(!config.captchaSiteKey){
  console.error('VITE_CAPTCHA_SITE_KEY не настроен');
}