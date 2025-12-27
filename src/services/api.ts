import axios from 'axios';
import { authStore } from '@/contexts/authStore';

// Get configuration from environment or use defaults
const config = {
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://mazadclick-server.onrender.com',
    apiKey: process.env.NEXT_PUBLIC_API_KEY || '64d2e8b7c3a9f1e5d8b2a4c6e9f0d3a5',
    timeout: 15000,
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
