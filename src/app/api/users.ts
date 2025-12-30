import { requests } from './utils';
import axios, { AxiosHeaders } from 'axios';
import app from '@/config';

// Create a direct axios instance as enhanced fallback
const directAxios = axios.create({
  baseURL: app.baseURL,
  timeout: app.timeout,
  headers: { 'x-access-key': app.apiKey },
  withCredentials: true,
});

// Enhanced auth token retrieval
const getAuthToken = (): string | null => {
  console.log('🔑 === GETTING AUTH TOKEN ===');

  try {
    if (typeof window === 'undefined') {
      console.warn('⚠️ Window is undefined, cannot get token');
      return null;
    }

    // Get token from localStorage
    const authData = localStorage.getItem('auth');
    if (authData) {
      console.log('📦 Found auth data in localStorage');
      try {
        const parsed = JSON.parse(authData);
        const token = parsed?.tokens?.accessToken;
        if (token && typeof token === 'string' && token.trim() !== '') {
          console.log('✅ Found valid token from localStorage');
          console.log('🎯 Token preview:', token.substring(0, 20) + '...');
          console.log('🎯 Token length:', token.length);
          return token;
        } else {
          console.warn('⚠️ Token exists but is invalid');
        }
      } catch (parseError) {
        console.warn('⚠️ Error parsing auth data from localStorage:', parseError);
      }
    } else {
      console.warn('⚠️ No auth data found in localStorage');
    }

    console.warn('❌ No valid auth token found');
    return null;

  } catch (error) {
    console.error('❌ Critical error getting auth token:', error);
    return null;
  }
};

// Create headers with proper authentication
const getAuthHeaders = (): { [key: string]: string } => {
  const token = getAuthToken();

  if (!token) {
    console.warn('⚠️ No auth token available for request');
    return {};
  }

  // Ensure proper Bearer format
  const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

  console.log('🔐 Auth header created successfully');

  return {
    'Authorization': authHeader
  };
};

// Add interceptors to directAxios as well
directAxios.interceptors.request.use(
  (config) => {
    const authHeaders = getAuthHeaders();
    if (Object.keys(authHeaders).length > 0) {
      const headers = config.headers instanceof AxiosHeaders
        ? config.headers
        : new AxiosHeaders(config.headers as any);
      for (const [key, value] of Object.entries(authHeaders)) {
        headers.set(key, value);
      }
      config.headers = headers;
      console.log('🔐 Auth headers attached to direct request:', config.url);
    } else {
      console.warn('⚠️ No auth headers for direct request:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('❌ Direct axios request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401s in directAxios
directAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('🔐 401 Unauthorized in direct axios - clearing auth');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth');
        if (window.location.pathname !== '/auth/signin') {
          window.location.href = '/auth/signin';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Enhanced postFormData function
const safePostFormData = async (url: string, formData: FormData) => {
  console.log('🎯 === SAFE POST FORM DATA ===');
  console.log('🔗 Base URL:', directAxios.defaults.baseURL);
  console.log('🔗 Endpoint:', url);

  // Validate FormData
  if (!formData) {
    throw new Error('FormData is required');
  }

  // Debug FormData contents
  console.log('📋 FormData validation:');
  const entries = Array.from(formData.entries());
  console.log('📊 Number of entries:', entries.length);

  entries.forEach(([key, value]) => {
    console.log(`📄 ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
  });

  if (entries.length === 0) {
    console.error('❌ FormData is empty!');
    throw new Error('FormData cannot be empty');
  }

  try {
    const authHeaders = getAuthHeaders();
    console.log('🔐 Auth headers status:', Object.keys(authHeaders).length > 0 ? '✅ Present' : '❌ Missing');

    if (Object.keys(authHeaders).length === 0) {
      console.error('❌ No authentication headers available!');
      throw new Error('Authentication required but no token found');
    }

    const config = {
      headers: {
        ...authHeaders,
        // Let browser set Content-Type automatically for multipart/form-data
      },
      timeout: 30000,
    };

    console.log('🚀 Making POST request with auth headers...');

    const response = await directAxios.post(url, formData, config);

    console.log('✅ Request successful!');
    console.log('📦 Response data:', response.data);
    return response.data;

  } catch (error: any) {
    console.error('❌ === REQUEST FAILED ===');
    console.error('📊 Error status:', error?.response?.status);
    console.error('💬 Error message:', error?.message);
    console.error('📄 Response data:', error?.response?.data);
    throw error;
  }
};

// Enhanced get request function
const safeGet = async (url: string) => {
  console.log('🎯 === SAFE GET REQUEST ===');
  console.log('🔗 URL:', url);

  try {
    const authHeaders = getAuthHeaders();
    console.log('🔐 Auth headers status:', Object.keys(authHeaders).length > 0 ? '✅ Present' : '❌ Missing');

    if (Object.keys(authHeaders).length === 0) {
      console.error('❌ No authentication headers available!');
      throw new Error('Authentication required but no token found');
    }

    const config = {
      headers: authHeaders,
      timeout: 30000,
    };

    console.log('🚀 Making GET request with auth headers...');

    const response = await directAxios.get(url, config);

    console.log('✅ GET request successful!');
    console.log('📦 Response data:', response.data);
    return response.data;

  } catch (error: any) {
    console.error('❌ === GET REQUEST FAILED ===');
    console.error('📊 Error status:', error?.response?.status);
    console.error('💬 Error message:', error?.message);
    console.error('📄 Response data:', error?.response?.data);
    throw error;
  }
};

// Enhanced put request function
const safePut = async (url: string, data: any) => {
  console.log('🎯 === SAFE PUT REQUEST ===');
  console.log('🔗 URL:', url);
  console.log('📄 Data:', data);

  try {
    const authHeaders = getAuthHeaders();
    console.log('🔐 Auth headers status:', Object.keys(authHeaders).length > 0 ? '✅ Present' : '❌ Missing');

    if (Object.keys(authHeaders).length === 0) {
      console.error('❌ No authentication headers available!');
      throw new Error('Authentication required but no token found');
    }

    const config = {
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json'
      },
      timeout: 30000,
    };

    console.log('🚀 Making PUT request with auth headers...');

    const response = await directAxios.put(url, data, config);

    console.log('✅ PUT request successful!');
    console.log('📦 Response data:', response.data);
    return response.data;

  } catch (error: any) {
    console.error('❌ === PUT REQUEST FAILED ===');
    console.error('📊 Error status:', error?.response?.status);
    console.error('💬 Error message:', error?.message);
    console.error('📄 Response data:', error?.response?.data);
    throw error;
  }
};

// Enhanced post request function
const safePost = async (url: string, data: any) => {
  console.log('🎯 === SAFE POST REQUEST ===');
  console.log('🔗 URL:', url);
  console.log('📄 Data:', data);

  try {
    const authHeaders = getAuthHeaders();
    console.log('🔐 Auth headers status:', Object.keys(authHeaders).length > 0 ? '✅ Present' : '❌ Missing');

    if (Object.keys(authHeaders).length === 0) {
      console.error('❌ No authentication headers available!');
      throw new Error('Authentication required but no token found');
    }

    const config = {
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json'
      },
      timeout: 30000,
    };

    console.log('🚀 Making POST request with auth headers...');

    const response = await directAxios.post(url, data, config);

    console.log('✅ POST request successful!');
    console.log('📦 Response data:', response.data);
    return response.data;

  } catch (error: any) {
    console.error('❌ === POST REQUEST FAILED ===');
    console.error('📊 Error status:', error?.response?.status);
    console.error('💬 Error message:', error?.message);
    console.error('📄 Response data:', error?.response?.data);
    throw error;
  }
};

// Define user types
export enum USER_TYPE {
  CLIENT = 'CLIENT',
  RESELLER = 'RESELLER',
  PROFESSIONAL = 'PROFESSIONAL',
}

interface User {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: any;
  accountType?: USER_TYPE;
  type?: USER_TYPE;
  rate?: number;
  isVerified?: boolean;
  isHasIdentity?: boolean;
  isPhoneVerified?: boolean;
  isActive?: boolean;
  isBanned?: boolean;
  photoURL?: string;
  fullName?: string;
  createdAt?: string;
  updatedAt?: string;
  wilaya?: string;
  activitySector?: string; // Renamed from secteur
  companyName?: string; // Renamed from socialReason
  jobTitle?: string;
  // entity?: string; // Removed
  coverPhoto?: any;
  coverPhotoURL?: string;
  loginCount?: number;
  profileCompletionNote?: {
    dismissed: boolean;
    postponedCount: number;
  };
  // Deprecated fields for backward compatibility if needed
  secteur?: string;
  socialReason?: string;
  entity?: string;
}

interface ApiResponse<T> {
  data?: T;
  user?: T;
  message?: string;
  success: boolean;
}

export const UserAPI = {
  // Get current user profile - FIXED to handle response properly
  getMe: async (): Promise<ApiResponse<User>> => {
    console.log('👤 === GET CURRENT USER PROFILE ===');

    // Verify token availability before making request
    const token = getAuthToken();
    if (!token) {
      console.error('❌ No auth token available for getMe request');
      return Promise.reject(new Error('No authentication token available'));
    }

    console.log('✅ Token verified, making getMe request');

    try {
      // Try using requests first, fallback to direct method
      let response;
      if (requests && typeof requests.get === 'function') {
        console.log('🌐 Using requests.get for /users/me');
        response = await requests.get('users/me');
      } else {
        console.log('🌐 Using safeGet for /users/me');
        response = await safeGet('users/me');
      }

      console.log('✅ getMe response received:', response);

      // FIXED: Handle different response formats from backend
      if (response.success !== false && (response.user || response.data)) {
        const userData = response.user || response.data || response;
        console.log('✅ User data extracted:', userData);
        return {
          success: true,
          user: userData,
          data: userData,
          message: response.message
        };
      } else {
        console.error('❌ Invalid response format:', response);
        throw new Error('Invalid response format from server');
      }

    } catch (error: any) {
      console.error('❌ getMe failed:', error);
      if (error.response?.status === 401) {
        // Clear auth and redirect on 401
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth');
          window.location.href = '/auth/signin';
        }
      }
      throw error;
    }
  },

  // Update current user profile - FIXED to handle response properly
  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    console.log('💾 === UPDATE USER PROFILE ===');
    console.log('💾 Update data:', data);

    const token = getAuthToken();
    if (!token) {
      console.error('❌ No auth token for updateProfile');
      return Promise.reject(new Error('No authentication token available'));
    }

    try {
      // Filter out undefined values and only allow certain fields
      const allowedFields: Array<keyof User> = ['firstName', 'lastName', 'phone', 'wilaya', 'activitySector', 'companyName', 'jobTitle', 'secteur', 'socialReason']; // Added new fields, kept old for safe transition
      const filteredData: Partial<User> = {};

      for (const field of allowedFields) {
        const value = data[field as keyof User];
        if (value !== undefined && value !== null && value !== '') {
          filteredData[field] = value as any;
        }
      }

      if (Object.keys(filteredData).length === 0) {
        throw new Error('No valid fields to update');
      }

      console.log('💾 Filtered update data:', filteredData);

      let response;
      if (requests && typeof requests.put === 'function') {
        console.log('🌐 Using requests.put for /users/me');
        response = await requests.put('users/me', filteredData);
      } else {
        console.log('🌐 Using safePut for /users/me');
        response = await safePut('users/me', filteredData);
      }

      console.log('✅ Profile update response:', response);

      // FIXED: Handle different response formats from backend
      if (response.success !== false && (response.user || response.data)) {
        const userData = response.user || response.data || response;
        console.log('✅ Updated user data:', userData);
        return {
          success: true,
          user: userData,
          data: userData,
          message: response.message || 'Profile updated successfully'
        };
      } else {
        console.error('❌ Invalid response format:', response);
        throw new Error('Invalid response format from server');
      }

    } catch (error: any) {
      console.error('❌ Profile update failed:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth');
          window.location.href = '/auth/signin';
        }
      }
      throw error;
    }
  },

  // Change password - FIXED to handle response properly
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<null>> => {
    console.log('🔐 === CHANGE PASSWORD ===');

    const token = getAuthToken();
    if (!token) {
      console.error('❌ No auth token available for changePassword');
      return Promise.reject(new Error('No authentication token available'));
    }

    console.log('✅ Auth token verified for password change');

    try {
      let response;

      if (requests && typeof requests.post === 'function') {
        console.log('🌐 Using requests.post for /users/change-password');
        response = await requests.post('users/change-password', data);
      } else {
        console.log('🌐 Using safePost for /users/change-password');
        response = await safePost('users/change-password', data);
      }

      console.log('✅ Password change successful');
      console.log('✅ Response:', {
        success: response?.success,
        message: response?.message
      });

      return {
        success: true,
        message: response?.message || 'Password changed successfully'
      };

    } catch (error: any) {
      console.error('❌ Password change failed:', {
        status: error?.response?.status,
        message: error?.message,
        data: error?.response?.data
      });

      if (error?.response?.status === 400) {
        const backendMsg = error?.response?.data?.message || 'Current password is incorrect or new password is invalid';
        throw new Error(backendMsg);
      } else if (error?.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error?.response?.status === 404) {
        throw new Error('Password change endpoint not found. Please contact support.');
      } else {
        throw error;
      }
    }
  },

  // Upload avatar - FIXED to handle response properly and refresh user data
  uploadAvatar: async (formData: FormData): Promise<ApiResponse<User>> => {
    console.log('🖼️ === UPLOAD AVATAR ===');

    // Validate FormData
    if (!formData) {
      console.error('❌ No FormData provided to uploadAvatar');
      throw new Error('FormData is required for avatar upload');
    }

    // Check if avatar file exists in FormData
    const hasAvatar = Array.from(formData.entries()).some(([key, value]) =>
      key === 'avatar' && value instanceof File
    );

    if (!hasAvatar) {
      console.error('❌ No avatar file found in FormData');
      throw new Error('Avatar file is required for avatar upload');
    }

    console.log('✅ FormData validated, proceeding with avatar upload...');

    try {
      // Use the backend endpoint: POST /users/me/avatar
      const response = await safePostFormData('users/me/avatar', formData);

      console.log('✅ Avatar upload response:', response);

      // FIXED: Handle the response properly
      if (response.success && (response.user || response.data)) {
        const userData = response.user || response.data;
        console.log('✅ Avatar uploaded, user data:', userData);

        return {
          success: true,
          user: userData,
          data: userData,
          message: response.message || 'Avatar uploaded successfully'
        };
      } else {
        console.error('❌ Avatar upload failed:', response);
        throw new Error(response.message || 'Avatar upload failed');
      }

    } catch (error: any) {
      console.error('❌ Avatar upload error:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Avatar upload failed');
    }
  },

  // Upload cover - matches POST /users/me/cover
  uploadCover: async (formData: FormData): Promise<ApiResponse<User>> => {
    console.log('🖼️ === UPLOAD COVER ===');

    // Validate FormData
    if (!formData) {
      console.error('❌ No FormData provided to uploadCover');
      throw new Error('FormData is required for cover upload');
    }

    // Check if cover file exists in FormData
    const hasCover = Array.from(formData.entries()).some(([key, value]) =>
      key === 'cover' && value instanceof File
    );

    if (!hasCover) {
      console.error('❌ No cover file found in FormData');
      throw new Error('Cover file is required for cover upload');
    }

    console.log('✅ FormData validated, proceeding with cover upload...');

    try {
      // Use the backend endpoint: POST /users/me/cover
      const response = await safePostFormData('users/me/cover', formData);

      console.log('✅ Cover upload response:', response);

      if (response.success && (response.user || response.data)) {
        const userData = response.user || response.data;
        console.log('✅ Cover uploaded, user data:', userData);

        return {
          success: true,
          user: userData,
          data: userData,
          message: response.message || 'Cover uploaded successfully'
        };
      } else {
        console.error('❌ Cover upload failed:', response);
        throw new Error(response.message || 'Cover upload failed');
      }

    } catch (error: any) {
      console.error('❌ Cover upload error:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Cover upload failed');
    }
  },

  // Upload reseller identity - matches POST /users/me/reseller-identity
  uploadResellerIdentity: async (formData: FormData): Promise<ApiResponse<User>> => {
    console.log('🆔 === UPLOAD RESELLER IDENTITY ===');

    if (!formData) {
      throw new Error('FormData is required for reseller identity upload');
    }

    // Check if identityCard file exists in FormData
    const hasIdentityCard = Array.from(formData.entries()).some(([key, value]) =>
      key === 'identityCard' && value instanceof File
    );

    if (!hasIdentityCard) {
      console.error('❌ No identityCard file found in FormData');
      throw new Error('identityCard file is required');
    }

    console.log('✅ identityCard file validated');

    try {
      const response = await safePostFormData('users/me/reseller-identity', formData);

      if (response.success && (response.user || response.data)) {
        const userData = response.user || response.data;
        return {
          success: true,
          user: userData,
          data: userData,
          message: response.message || 'Identity uploaded successfully'
        };
      } else {
        throw new Error(response.message || 'Identity upload failed');
      }
    } catch (error: any) {
      console.error('❌ Identity upload error:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Identity upload failed');
    }
  },

  // Convert to reseller - matches POST /users/convert-to-reseller
  convertToReseller: async (data: { plan: string, paymentDetails: any }): Promise<ApiResponse<User>> => {
    console.log('🪙 === CONVERT TO RESELLER ===');
    console.log('🪙 Conversion data:', data);

    const token = getAuthToken();
    if (!token) {
      return Promise.reject(new Error('No authentication token available'));
    }

    try {
      let response;
      if (requests && typeof requests.post === 'function') {
        response = await requests.post('users/convert-to-reseller', data);
      } else {
        response = await safePost('users/convert-to-reseller', data);
      }

      console.log('✅ Convert to reseller response:', response);

      if (response.success && (response.user || response.data)) {
        const userData = response.user || response.data;
        return {
          success: true,
          user: userData,
          data: userData,
          message: response.message || 'Successfully converted to reseller'
        };
      } else {
        throw new Error(response.message || 'Reseller conversion failed');
      }

    } catch (error: any) {
      console.error('❌ Convert to reseller failed:', error);
      throw error;
    }
  },

  // Update user with identity - matches POST /users/update-with-identity
  updateUserWithIdentity: async (): Promise<ApiResponse<User>> => {
    console.log('🆔 === UPDATE USER WITH IDENTITY ===');

    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    try {
      let response;
      if (requests && typeof requests.post === 'function') {
        response = await requests.post('users/update-with-identity', {});
      } else {
        response = await safePost('users/update-with-identity', {});
      }

      console.log('✅ Update user with identity response:', response);

      if (response.success && (response.user || response.data)) {
        const userData = response.user || response.data;
        return {
          success: true,
          user: userData,
          data: userData,
          message: response.message || 'User updated with identity successfully'
        };
      } else {
        throw new Error(response.message || 'Update user with identity failed');
      }

    } catch (error: any) {
      console.error('❌ Update user with identity failed:', error);
      throw error;
    }
  },

  // Other methods - FIXED to use consistent response handling
  getAll: async (): Promise<ApiResponse<User[]>> => {
    const token = getAuthToken();
    if (!token) {
      return Promise.reject(new Error('No authentication token available'));
    }

    if (requests) {
      return requests.get('users/all');
    }
    return safeGet('users/all');
  },

  getClients: async (): Promise<ApiResponse<User[]>> => {
    const token = getAuthToken();
    if (!token) {
      return Promise.reject(new Error('No authentication token available'));
    }

    if (requests) {
      return requests.get('users/clients');
    }
    return safeGet('users/clients');
  },

  getResellers: async (): Promise<ApiResponse<User[]>> => {
    const token = getAuthToken();
    if (!token) {
      return Promise.reject(new Error('No authentication token available'));
    }

    if (requests) {
      return requests.get('users/resellers');
    }
    return safeGet('users/resellers');
  },

  getProfessionals: async (): Promise<ApiResponse<User[]>> => {
    const token = getAuthToken();
    if (!token) {
      return Promise.reject(new Error('No authentication token available'));
    }

    if (requests) {
      return requests.get('users/professionals');
    }
    return safeGet('users/professionals');
  },

  getAdmins: async (): Promise<ApiResponse<User[]>> => {
    const token = getAuthToken();
    if (!token) {
      return Promise.reject(new Error('No authentication token available'));
    }

    if (requests) {
      return requests.get('users/admins');
    }
    return safeGet('users/admins');
  },

  getUserById: async (id: string): Promise<ApiResponse<User>> => {
    const token = getAuthToken();
    if (!token) {
      return Promise.reject(new Error('No authentication token available'));
    }

    if (requests) {
      return requests.get(`users/${id}`);
    }
    return safeGet(`users/${id}`);
  },

  // Legacy aliases for backward compatibility
  getUser: async (): Promise<ApiResponse<User>> => {
    return UserAPI.getMe();
  },

  updateMe: async (data: any): Promise<ApiResponse<User>> => {
    return UserAPI.updateProfile(data);
  },

  // Update profile completion note status
  updateProfileCompletionNote: async (action: 'postpone' | 'dismiss'): Promise<ApiResponse<User>> => {
    console.log(`📝 === UPDATE PROFILE COMPLETION NOTE: ${action} ===`);

    const token = getAuthToken();
    if (!token) return Promise.reject(new Error('No authentication token available'));

    try {
      const endpoint = 'users/me/profile-completion-note';
      const data = { action };

      let response;
      if (requests && typeof requests.put === 'function') {
        response = await requests.put(endpoint, data);
      } else {
        response = await safePut(endpoint, data);
      }

      if (response.success && (response.user || response.data)) {
        return {
          success: true,
          user: response.user || response.data,
          data: response.user || response.data,
          message: response.message
        };
      }
      throw new Error(response.message || 'Failed to update note status');
    } catch (error: any) {
      console.error('❌ Update note status failed:', error);
      throw error;
    }
  },

  findById: async (id: string): Promise<ApiResponse<User>> => {
    return UserAPI.getUserById(id);
  },

  createAdmin: async (): Promise<ApiResponse<User>> => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      let response;
      if (requests && typeof requests.post === 'function') {
        response = await requests.post('users/admin', {});
      } else {
        response = await safePost('users/admin', {});
      }

      // Normalize and return ApiResponse<User>
      if (response?.success !== false && (response?.user || response?.data)) {
        const userData = response.user || response.data || response;
        return {
          success: true,
          user: userData,
          data: userData,
          message: response.message || 'Admin created successfully'
        };
      }

      throw new Error(response?.message || 'Failed to create admin');
    } catch (error: any) {
      console.error('Error creating admin:', error);
      throw error;
    }
  },

  // Test auth token retrieval - for debugging
  testAuth: () => {
    console.log('🧪 Testing authentication setup...');
    const token = getAuthToken();
    const headers = getAuthHeaders();

    console.log('🧪 Token status:', token ? 'Found' : 'Missing');
    console.log('🧪 Headers status:', Object.keys(headers).length > 0 ? 'Ready' : 'Missing');

    if (token) {
      console.log('🧪 Token preview:', token.substring(0, 30) + '...');
      console.log('🧪 Token length:', token.length);
    }

    return { hasToken: !!token, hasHeaders: Object.keys(headers).length > 0, token: token?.substring(0, 30) + '...' };
  },
  // Recommendation methods
  recommendUser: (userId: string, isRecommended: boolean): Promise<any> =>
    requests.put(`users/recommend/${userId}`, { isRecommended }),

  getRecommendedProfessionals: (): Promise<any> =>
    requests.get('users/professionals/recommended'),

  getRecommendedResellers: (): Promise<any> =>
    requests.get('users/resellers/recommended'),

  // Helper: Get avatar URL for current user (derived from profile)
  getUserAvatar: async (userId?: string): Promise<ApiResponse<{ avatarUrl?: string }>> => {
    try {
      // Reuse getMe to avoid backend dependency on a dedicated avatar endpoint
      const profile = await UserAPI.getMe();
      const user = profile.user || profile.data as any;
      const avatar = user?.avatar;
      const avatarUrl = avatar?.fullUrl || avatar?.url || user?.photoURL;
      return {
        success: true,
        data: { avatarUrl },
        message: avatarUrl ? 'Avatar fetched successfully' : 'No avatar found'
      };
    } catch (error: any) {
      console.error('❌ getUserAvatar failed:', error);
      return {
        success: false,
        data: { avatarUrl: undefined },
        message: error?.message || 'Failed to get avatar'
      } as any;
    }
  },
};