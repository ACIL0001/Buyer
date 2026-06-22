import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import app from '@/config';
import { getCsrfToken, isProtectedPath } from '@/utils/csrf';
import { authStore } from '@/contexts/authStore';

interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

interface ApiResponse<T = any> {
  data?: T;
  user?: T;
  message?: string;
  success: boolean;
  requiresPhoneVerification?: boolean;
  tokens?: any;
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
  [key: string]: any; // Allow for additional fields
}

// Enhanced token retrieval function
const getTokenFromStorage = (): string | null => {
  try {
    if (typeof window === 'undefined') return null;

    // Use authStore directly to get the token from memory, 
    // avoiding the need to decrypt the VaultService payload synchronously
    const state = authStore.getState();
    const token = state.auth?.tokens?.accessToken || null;
    
    // Debug token retrieval
    if (!token && state.isLogged) {
      console.warn('⚠️ authStore says isLogged=true but tokens.accessToken is missing!', state.auth);
    }
    
    return token;
  } catch (error) {
    return null;
  }
};

const instance = axios.create({
  baseURL: app.baseURL,
  timeout: app.timeout,
  headers: { 'x-access-key': app.apiKey },
  withCredentials: true,
});


// Add request interceptor to automatically attach auth token
instance.interceptors.request.use(
  (config) => {
    const token = getTokenFromStorage();

    // Only attach token for non-auth endpoints
    const isAuthEndpoint = config.url?.includes('auth/signin') ||
      config.url?.includes('auth/signup') ||
      config.url?.includes('auth/refresh') ||
      config.url?.includes('auth/reset-password');

    // Define explicitly public GET endpoints that don't need auth
    const publicGetEndpoints = ['category', 'tenders', 'direct-sale', 'auctions'];
    const isPublicGet = config.method?.toLowerCase() === 'get' && publicGetEndpoints.some(ep => config.url?.includes(ep));

    if (token && !isAuthEndpoint && !isPublicGet) {
      config.headers = config.headers || {};
      // Ensure proper Bearer format
      const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      config.headers.Authorization = authHeader;
    }

    // CSRF Protection
    const isMutatingRequest = config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase());
    if (isMutatingRequest || (config.url && isProtectedPath(config.url))) {
      config.headers = config.headers || {};
      config.headers['X-CSRF-Token'] = getCsrfToken();
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Only redirect if this is NOT a login/signup request or guest message request
      const isLoginRequest = originalRequest.url?.includes('auth/signin') || originalRequest.url?.includes('auth/signup');
      const isGuestMessageRequest = originalRequest.url?.includes('message/guest-message');

      if (!isLoginRequest && !isGuestMessageRequest) {
        
        // Try token refresh flow
        try {
          const { AuthAPI } = await import('@/app/api/auth');
          // Browser will automatically attach the HttpOnly refresh_token cookie
          const res = await AuthAPI.refresh();
          
          if (res.success && res.accessToken) {
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${res.accessToken}`;
              
              // We also need to update the session storage with the new accessToken
              const authDataStr = window.sessionStorage.getItem('auth');
              if (authDataStr) {
                 const authData = JSON.parse(authDataStr);
                 if (!authData.tokens) authData.tokens = {};
                 authData.tokens.accessToken = res.accessToken;
                 // Note: we no longer store refreshToken in sessionStorage
                 window.sessionStorage.setItem('auth', JSON.stringify(authData));
              }

              return instance(originalRequest);
          }
        } catch (refreshError) {
             // Refresh failed, proceed to logout
        }
        
        // Clear auth data on 401 (only for non-login and non-guest requests)
        if (typeof window !== 'undefined') {
          // Import and clear vault
          try {
            const { VaultService } = await import('@/services/vault');
            await VaultService.clear();
          } catch (e) {
            authStore.getState().logout();
          }

          // Try to get authStore and logout
          try {
            authStore.getState().logout();
          } catch (e) {}

          // Redirect to login if not already there
          if (window.location.pathname !== '/auth/login' && window.location.pathname !== '/auth/signin') {
            window.location.href = '/auth/login';
          }
        }
      } else if (isGuestMessageRequest) {
        console.log('🔒 Guest message request got 401 - this should not happen, but not redirecting');
      }
    }

    return Promise.reject(error);
  }
);

// Enhanced response handler that properly handles different API response structures
const responseBody = (res: AxiosResponse): ApiResponse => {
  const responseData = res.data;

  console.log('🔍 Processing response:', {
    status: res.status,
    dataType: typeof responseData,
    isArray: Array.isArray(responseData),
    hasSuccess: 'success' in (responseData || {}),
    hasData: 'data' in (responseData || {}),
    keys: responseData && typeof responseData === 'object' ? Object.keys(responseData) : []
  });

  // Handle different response structures
  if (responseData && typeof responseData === 'object') {

    // Case 1: Standard API wrapper with success and data fields
    if ('success' in responseData && 'data' in responseData) {
      console.log('✅ Standard API response format detected');
      return responseData as ApiResponse;
    }

    // Case 2: Response has success but data is at root level
    if ('success' in responseData && !('data' in responseData)) {
      console.log('✅ API response with success flag, keeping original structure');
      // For responses that already have the correct structure (like subscription plans),
      // return as-is instead of moving to data field
      return responseData as ApiResponse;
    }

    // Case 3: Direct array response (common for list endpoints)
    if (Array.isArray(responseData)) {
      console.log('✅ Direct array response detected');
      return {
        data: responseData,
        success: true,
        message: 'Request successful'
      } as ApiResponse;
    }

    // Case 4: Object response without wrapper (treat as data)
    if (!('success' in responseData) && !Array.isArray(responseData)) {
      console.log('✅ Direct object response, wrapping in API format');
      return {
        data: responseData,
        success: res.status >= 200 && res.status < 300,
        message: responseData.message || 'Request successful'
      } as ApiResponse;
    }

    // Case 5: Response with data field but no success field
    if ('data' in responseData && !('success' in responseData)) {
      console.log('✅ Response has data field, adding success flag');
      return {
        ...responseData,
        success: res.status >= 200 && res.status < 300,
      } as ApiResponse;
    }
  }

  // Fallback: wrap primitive responses
  console.log('🔄 Fallback: wrapping primitive response');
  return {
    data: responseData,
    success: res.status >= 200 && res.status < 300,
    message: 'Request successful'
  } as ApiResponse;
};

// Export the axios instance
export { instance };

// Network-level failures (backend not running, DNS failures, CORS, offline) surface in
// axios as errors without a `.response`. These are typically transient during development
// — logging them via console.error triggers the Next.js dev error overlay and blocks the
// page. Downgrade them to warn; surface real HTTP errors (4xx/5xx) as error.
const logRequestFailure = (method: string, url: string, error: any) => {
  const detail = error.response?.data || error.message;
  if (!error.response) {
    console.warn(`⚠️ ${method} request network failure:`, url, detail);
  } else {
    console.error(`❌ ${method} request failed:`, url, detail);
  }
};

// Enhanced requests object with better error handling and logging
export const requests = {
  get: <T = any>(url: string, config = {}): Promise<ApiResponse<T>> => {
    console.log('🌐 GET request to:', url);
    return instance.get(url, config)
      .then(responseBody)
      .catch(error => {
        logRequestFailure('GET', url, error);
        throw error;
      });
  },

  post: <T = any>(url: string, body: {}, config = {}, returnFullResponse = false): Promise<ApiResponse<T> | AxiosResponse> => {
    console.log('🌐 POST request to:', url);
    const request = instance.post(url, body, config);
    const isChatEndpoint = url === 'chat' || url === 'chats' || url.includes('chat/');

    if (returnFullResponse) {
      return request.catch(error => {
        if (!isChatEndpoint) {
          logRequestFailure('POST', url, error);
        }
        throw error;
      });
    }

    return request
      .then(responseBody)
      .catch(error => {
        if (!isChatEndpoint) {
          logRequestFailure('POST', url, error);
        }
        throw error;
      });
  },

  postFormData: <T = any>(url: string, formData: FormData, config: AxiosRequestConfig = {} as AxiosRequestConfig): Promise<ApiResponse<T>> => {
    console.log('🌐 POST FormData request to:', url);
    if (!formData) {
      throw new Error('FormData is required for postFormData');
    }

    return instance.post(url, formData, {
      ...(config || {}),
      headers: {
        'Content-Type': 'multipart/form-data',
        ...((config && (config as any).headers) ? (config as any).headers : {})
      }
    })
      .then(responseBody)
      .catch(error => {
        logRequestFailure('POST FormData', url, error);
        throw error;
      });
  },

  put: <T = any>(url: string, body: {}, config = {}): Promise<ApiResponse<T>> => {
    console.log('🌐 PUT request to:', url);
    return instance.put(url, body, config)
      .then(responseBody)
      .catch(error => {
        logRequestFailure('PUT', url, error);
        throw error;
      });
  },

  patch: <T = any>(url: string, body: {}, config = {}): Promise<ApiResponse<T>> => {
    console.log('🌐 PATCH request to:', url);
    return instance.patch(url, body, config)
      .then(responseBody)
      .catch(error => {
        logRequestFailure('PATCH', url, error);
        throw error;
      });
  },

  delete: <T = any>(url: string, config = {}): Promise<ApiResponse<T>> => {
    console.log('🌐 DELETE request to:', url);
    return instance.delete(url, config)
      .then(responseBody)
      .catch(error => {
        logRequestFailure('DELETE', url, error);
        throw error;
      });
  },
};
