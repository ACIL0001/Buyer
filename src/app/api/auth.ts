import Credentials from '@/types/Credentials';
import User from '@/types/User';
import { requests } from './utils';

interface AuthResponse {
  user: User;
  session?: {
    accessToken: string;
    refreshToken: string;
  };
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
  message?: string;
  success: boolean;
  requiresPhoneVerification?: boolean;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export const AuthAPI = {
  signin: async (credentials: Credentials, returnFullResponse: boolean = true): Promise<AuthResponse> => {
    try {
      console.log('🔐 AuthAPI.signin called with:', { login: credentials.login, hasPassword: !!credentials.password });

      const res = await requests.post('auth/signin', credentials, {}, returnFullResponse);
      console.log('🔐 Full axios response:', res);
      console.log('🔐 Response data:', res.data);


      // Since returnFullResponse = true, we get the full axios response
      // The actual data is in res.data
      const responseData = res.data;

      console.log('🔐 AuthAPI.signin response received:', {
        hasUser: !!responseData?.user,
        hasSession: !!responseData?.session,
        hasTokens: !!(responseData?.session?.accessToken || responseData?.session?.access_token || responseData?.accessToken || responseData?.access_token),
        success: responseData?.success
      });

      if (!responseData?.user) {
        console.error('❌ No user found in response data:', responseData);
        throw new Error('Invalid response: no user data found');
      }

      // Normalize the response structure to handle different backend formats
      let normalizedResponse: AuthResponse = {
        user: responseData.user,
        success: responseData.success || true,
        message: responseData.message
      };

      // Handle different token response formats from backend
      if (responseData.session) {
        // Backend returns { data: { session: { access_token, refresh_token }, user } }
        normalizedResponse.session = {
          accessToken: responseData.session.accessToken || responseData.session.access_token,
          refreshToken: responseData.session.refreshToken || responseData.session.refresh_token
        };
        normalizedResponse.accessToken = normalizedResponse.session.accessToken;
        normalizedResponse.refreshToken = normalizedResponse.session.refreshToken;
      } else if (responseData.accessToken || responseData.access_token) {
        // Backend returns { data: { accessToken, refreshToken, user } }
        normalizedResponse.accessToken = responseData.accessToken || responseData.access_token;
        normalizedResponse.refreshToken = responseData.refreshToken || responseData.refresh_token;
        normalizedResponse.session = {
          accessToken: normalizedResponse.accessToken || '',
          refreshToken: normalizedResponse.refreshToken || ''
        };
      }

      console.log('🔐 Normalized signin response:', {
        hasTokens: !!(normalizedResponse.accessToken || normalizedResponse.session?.accessToken),
        tokenPreview: normalizedResponse.accessToken?.substring(0, 20) + '...' || 'N/A'
      });

      return normalizedResponse;
    } catch (error: unknown) {
      console.error('❌ AuthAPI.signin failed:', error);
      throw error;
    }
  },

  signup: async (user: User | FormData): Promise<ApiResponse<User>> => {
    try {
      console.log('🔐 AuthAPI.signup called');

      let res;
      if (user instanceof FormData) {
        res = await requests.postFormData('auth/signup', user);
      } else {
        console.log('🔐 Signup with JSON data:', {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          type: user.type
        });
        res = await requests.post('auth/signup', user);
      }
      console.log('🔐 AuthAPI.signup response:', {
        success: 'success' in res ? res.success : false,
        hasUser: !!('data' in res ? res.data : res),
        requiresPhoneVerification: 'requiresPhoneVerification' in res ? res.requiresPhoneVerification : false,
        message: 'message' in res ? res.message : 'Response received'
      });

      // Ensure we return the correct type
      if ('success' in res) {
        return res as ApiResponse<User>;
      } else {
        // Handle AxiosResponse case
        return {
          success: res.status >= 200 && res.status < 300,
          data: res.data,
          message: 'Request completed'
        } as ApiResponse<User>;
      }
    } catch (error: unknown) {
      console.error('❌ AuthAPI.signup failed:', error);
      throw error;
    }
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    try {
      console.log('🔄 AuthAPI.refresh called with token:', refreshToken ? 'present' : 'missing');

      // Use the correct field name expected by backend
      const res = await requests.post('auth/refresh', { refresh_token: refreshToken });
      console.log('🔄 AuthAPI.refresh response:', {
        success: 'success' in res ? res.success : false,
        hasTokens: !!('accessToken' in res ? res.accessToken : ('access_token' in res ? res.access_token : undefined))
      });

      // Normalize response format
      const normalizedResponse: AuthResponse = {
        user: 'user' in res ? res.user : undefined,
        success: 'success' in res ? res.success : true,
        accessToken: 'accessToken' in res ? res.accessToken : ('access_token' in res ? res.access_token : undefined),
        refreshToken: 'refreshToken' in res ? res.refreshToken : ('refresh_token' in res ? res.refresh_token : undefined),
        message: 'message' in res ? res.message : undefined
      };

      if (normalizedResponse.accessToken) {
        normalizedResponse.session = {
          accessToken: normalizedResponse.accessToken,
          refreshToken: normalizedResponse.refreshToken || ''
        };
      }

      return normalizedResponse;
    } catch (error: unknown) {
      console.error('❌ AuthAPI.refresh failed:', error);
      throw error;
    }
  },

  signout: async (): Promise<ApiResponse<null>> => {
    try {
      console.log('🚪 AuthAPI.signout called');
      const res = await requests.delete('auth/signout');
      console.log('🚪 AuthAPI.signout response:', res);
      // Normalize to ApiResponse<null>
      if ('success' in res) {
        return {
          success: res.success,
          data: null,
          message: 'message' in res ? (res as any).message : undefined,
        } as ApiResponse<null>;
      }
      // Axios-like response shape fallback
      return {
        success: (res as any)?.status >= 200 && (res as any)?.status < 300,
        data: null,
        message: (res as any)?.data?.message ?? 'Request completed',
      } as ApiResponse<null>;
    } catch (error: any) {
      console.error('❌ AuthAPI.signout failed:', error);
      throw error;
    }
  },

  // Reset password
  resetPassword: async (data: { phone: string; code: string; newPassword: string }): Promise<ApiResponse<{ message: string }>> => {
    try {
      console.log('🔑 AuthAPI.resetPassword called for phone:', data.phone);
      const res = await requests.post('auth/reset-password/confirm', data);
      console.log('🔑 AuthAPI.resetPassword response:', res);
      // Normalize to ApiResponse<{ message: string }>
      if ('success' in res) {
        return {
          success: res.success,
          data: { message: (res as any).message ?? 'Request completed' },
          message: (res as any).message,
        } as ApiResponse<{ message: string }>;
      }
      // Axios-like response shape fallback
      const message = (res as any)?.data?.message ?? 'Request completed';
      return {
        success: (res as any)?.status >= 200 && (res as any)?.status < 300,
        data: { message },
        message,
      } as ApiResponse<{ message: string }>;
    } catch (error: unknown) {
      console.error('❌ AuthAPI.resetPassword failed:', error);
      throw error;
    }
  },
};