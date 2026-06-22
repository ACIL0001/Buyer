export const DEV_SERVER_URL = 'http://127.0.0.1:3000';
// export const DEV_SERVER_URL = 'http://127.0.0.1:3000';
export const PROD_SERVER_URL = 'https://mazadclick-server.onrender.com';

export const isProductionEnvironment = process.env.NODE_ENV === 'production';
export const resolvedServerUrl = isProductionEnvironment ? PROD_SERVER_URL : DEV_SERVER_URL;
const resolvedServerUrlWithSlash = resolvedServerUrl.endsWith('/')
  ? resolvedServerUrl
  : `${resolvedServerUrl}/`;

const app = {
  name: 'MazadClick',
  pole: 'NotEasy',
  timeout: 15000,
  domain: 'www.mazadclick.com',
  // route: 'https://api.easyeats.dz/static/',
  // baseURL: 'https://api.easyeats.dz/v1/',
  // socket: 'wss://api.easyeats.dz/',

  // socket: 'http://localhost:3000/',
  // route: "http://localhost:3000",
  // baseURL: "http://localhost:3000/",

  // socket: 'https://mazadclick-server.onrender.com/',
  socket: `${resolvedServerUrlWithSlash}`,
  // route: "https://mazadclick-server.onrender.com",
  route: resolvedServerUrl,
  // baseURL: "https://mazadclick-server.onrender.com/",
  baseURL: resolvedServerUrlWithSlash,

  // Frontend URLs - Dynamic based on environment
  frontendUrl: (typeof window !== 'undefined' && window.location.hostname.includes('localhost')) 
    ? `${window.location.protocol}//${window.location.host}`
    : (process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://mazadclick.vercel.app/'),
  frontendPort: process.env.NODE_ENV === 'development' ? ':3001' : '',

  // Seller Application URL - Dynamic based on environment
  sellerUrl:  'https://dashbord.seller.mazad.click/',
  // sellerUrl:  'https://dashbord.seller.mazad.click',

  apiKey: process.env.NEXT_PUBLIC_API_KEY || '',
};

// Warn in development if API key is missing
if (typeof window !== 'undefined' && !app.apiKey && process.env.NODE_ENV === 'development') {
  console.warn('⚠️ NEXT_PUBLIC_API_KEY is not set. API requests may fail. Set it in your .env.local file.');
}

export const API_BASE_URL = app.baseURL;

// Helper function to get the full frontend URL
export const getFrontendUrl = (): string => {
  // Check if we are in a browser environment and strictly on localhost
  if (typeof window !== 'undefined' && window.location.hostname.includes('localhost')) {
    return `${window.location.protocol}//${window.location.host}`;
  }
  
  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:3001`;
  }
  return app.frontendUrl;
};

// Helper function to get frontend URL for redirects
export const getFrontendBaseUrl = (): string => {
  return getFrontendUrl();
};

// Helper function to get the seller URL
export const getSellerUrl = (): string => {
  return app.sellerUrl;
};

export default app;
