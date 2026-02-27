export interface AppConfig {
  usersApiUrl: string;
  friendsApiUrl: string;
  appName: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

export const config: AppConfig = {
  usersApiUrl: import.meta.env.VITE_USERS_API_URL,
  friendsApiUrl: import.meta.env.VITE_FRIENDS_API_URL,
  appName: import.meta.env.VITE_APP_NAME,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

if (!config.usersApiUrl) {
  console.error('VITE_USERS_API_URL не настроен');
}

if (!config.friendsApiUrl) {
  console.error('VITE_FRIENDS_API_URL не настроен');
}