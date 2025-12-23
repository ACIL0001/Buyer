import axios from 'axios';
import { authStore } from '@/contexts/authStore';

import app, { API_BASE_URL } from '@/config';

// Get configuration from environment or use defaults
// Get configuration from environment or use defaults
let apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL;

// Defensive check: If we are on the production domain but the API URL is localhost, force production API
if (typeof window !== 'undefined' &&
    (window.location.hostname === 'mazadclick.vercel.app' || window.location.hostname === 'www.mazadclick.com') &&
    (apiBaseUrl.includes('localhost') || apiBaseUrl.includes('api.mazad.click'))) {
    apiBaseUrl = 'https://mazadclick-server.onrender.com';
    console.warn('Forcing production API URL due to environment mismatch or invalid domain');
}

const config = {
    baseURL: apiBaseUrl,
    apiKey: process.env.NEXT_PUBLIC_API_KEY || app.apiKey,
    timeout: app.timeout,
};

const instance = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request interceptor
instance.interceptors.request.use(
    (axiosConfig) => {
        const state = authStore.getState();
        const { auth, isLogged } = state;

        // Handle FormData
        if (axiosConfig.data instanceof FormData) {
            delete axiosConfig.headers['Content-Type'];
        }

        // Add API key
        if (config.apiKey) {
            axiosConfig.headers['x-access-key'] = config.apiKey;
        }

        // Public endpoints
        const publicEndpoints = [
            { path: '/auth/signin', methods: ['POST'] },
            { path: '/auth/signup', methods: ['POST'] },
            { path: '/auth/refresh', methods: ['PUT'] },
        ];

        const pathname = axiosConfig.url || '';
        const method = axiosConfig.method?.toUpperCase();
        const isPublicEndpoint = publicEndpoints.some((endpoint) =>
            pathname.includes(endpoint.path) &&
            endpoint.methods.includes(method || 'GET')
        );

        // Add authorization token
        if (!isPublicEndpoint && isLogged && auth?.tokens?.accessToken) {
            axiosConfig.headers.Authorization = `Bearer ${auth.tokens.accessToken}`;
        }

        // Set language header
        if ((auth?.user as any)?.preference?.language) {
            axiosConfig.headers['accept-language'] = (auth.user as any).preference.language;
        }

        return axiosConfig;
    },
    (error) => {
        return Promise.reject(error);
    }
);

const response = (res: any) => res.data;

export const requests = {
    get: (url: string, axiosConfig?: any) => instance.get(url, axiosConfig).then(response),
    post: (url: string, body: any, returnFullResponse = false, axiosConfig?: any) =>
        returnFullResponse ? instance.post(url, body, axiosConfig) : instance.post(url, body, axiosConfig).then(response),
    put: (url: string, body: any, axiosConfig?: any) => instance.put(url, body, axiosConfig).then(response),
    delete: (url: string, axiosConfig?: any) => instance.delete(url, axiosConfig).then(response),
};

export { instance };
