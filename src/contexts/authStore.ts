import User from '@/types/User';
import { create } from 'zustand';
import { VaultService } from '@/services/vault';

const initialState: { tokens?: { accessToken: string; refreshToken?: string }; user?: User } = {
  tokens: undefined,
  user: undefined,
};

interface IAuthStore {
  isReady: boolean;
  isLogged: boolean;
  auth: typeof initialState;
  _lastFetchTime?: number;
  set: (auth: Partial<typeof initialState>) => void;
  clear: () => void;
  logout: () => void;
  initializeAuth: () => void;
  testTokenStorage: () => void;
  refreshAuthState: () => void;
  fetchFreshUserData: () => Promise<void>;
  setupInterceptors: () => void;
}

export const authStore = create<IAuthStore>((setValues) => ({
  isReady: false,
  isLogged: false,
  auth: initialState,
  _lastFetchTime: 0,

  set: (auth: Partial<typeof initialState>) => {

    if (auth.user) {
      // Map backend user fields to frontend User type
      auth.user = {
        ...auth.user,
        displayName: auth.user.firstName,
        type: auth.user.type || 'CLIENT',
        email: auth.user.email || '',
        photoURL: (auth.user.photoURL && !auth.user.photoURL.includes('mock-images'))
          ? auth.user.photoURL
          : '/assets/images/avatar.jpg',
        firstName: auth.user.firstName || '',
        lastName: auth.user.lastName || '',
        phone: auth.user.phone || '',
        rate: auth.user.rate || 1,
        avatar: auth.user.avatar || null,
      } as User;
    }

    setValues((state) => {
      const newAuth = { ...state.auth, ...auth };
      const isLogged = !!(newAuth.user && newAuth.tokens?.accessToken);

      return { auth: newAuth, isLogged, isReady: true };
    });

    // Store in Secure Vault with proper structure
    if (typeof window !== 'undefined') {
      const authData = {
        user: auth.user,
        tokens: auth.tokens,
      };

      console.log('💾 Storing auth data in Secure Vault');
      VaultService.setItem('auth', JSON.stringify(authData));
    }
  },

  clear: () => {
    console.log('🧹 Clearing auth data');
    setValues(() => ({ auth: initialState, isLogged: false }));
    if (typeof window !== 'undefined') {
      VaultService.clear();
    }
  },

  logout: () => {
    console.log('🚪 Logging out user');
    setValues(() => ({ auth: initialState, isLogged: false, isReady: true }));
    if (typeof window !== 'undefined') {
      VaultService.removeItem('auth');
    }
  },

  setupInterceptors: async () => {
    console.log('🔧 Interceptors are automatically set up in utils.ts');
  },

  initializeAuth: () => {
    console.log('🔄 Initializing auth...');
    if (typeof window === 'undefined') {
      console.log('⚠️ Window is undefined, skipping auth initialization');
      return;
    }

    const initAuth = async () => {
      const authentication = await VaultService.getItem('auth');
      console.log('📦 Auth data from Secure Vault:', authentication ? 'Found' : 'Not found');

      let values;

      if (authentication) {
        try {
          const parsed = JSON.parse(authentication);
          console.log('✅ Parsed auth data successfully');

          // Validate the stored data structure
          if (parsed.user && parsed.tokens && parsed.tokens.accessToken) {
            console.log('🔑 Valid tokens found in storage');
            console.log('🔑 Access token length:', parsed.tokens.accessToken.length);

            // Map user data to ensure compatibility
            const mappedUser = {
              ...parsed.user,
              displayName: parsed.user.firstName,
              type: parsed.user.type || 'CLIENT',
              email: parsed.user.email || '',
              photoURL: (parsed.user.photoURL && !parsed.user.photoURL.includes('mock-images'))
                ? parsed.user.photoURL
                : '/assets/images/avatar.jpg',
              firstName: parsed.user.firstName || '',
              lastName: parsed.user.lastName || '',
              phone: parsed.user.phone || '',
              rate: parsed.user.rate || 1,
              avatar: parsed.user.avatar || null,
            } as User;

            values = {
              auth: {
                user: mappedUser,
                tokens: parsed.tokens
              },
              isLogged: true
            };

          } else {
            console.log('⚠️ Invalid auth data structure, using initial state');
            values = { auth: initialState, isLogged: false };
          }
        } catch (error) {
          console.error('⚠️ Error parsing auth data:', error);
          values = { auth: initialState, isLogged: false };
        }
      } else {
        values = { auth: initialState, isLogged: false };
      }

      setValues({ ...values, isReady: true });
      
      // If user is logged in, fetch fresh data after initialization
      if (values.isLogged && values.auth.tokens?.accessToken) {
        const user = values.auth.user;
        const isIncomplete = !user?.firstName || user.firstName === 'User' || !user.lastName;

        // If data is suspect, fetch almost immediately. Otherwise, wait a bit.
        const delay = isIncomplete ? 500 : 2000;

        // Give some time for the app to fully initialize
        setTimeout(() => {
          const currentState = authStore.getState();
          if (currentState.isLogged && currentState.auth.tokens?.accessToken) {
            authStore.getState().fetchFreshUserData();
          }
        }, delay);
      }
    };

    initAuth();
  },

  testTokenStorage: () => {
    if (typeof window === 'undefined') {
      return;
    }

    VaultService.getItem('auth').then(authData => {

      if (authData) {
        try {
          JSON.parse(authData);
        } catch (error) {
          console.error('⚠️ Error parsing auth data');
        }
      }
    });
  },

  refreshAuthState: () => {
    if (typeof window === 'undefined') return;

    VaultService.getItem('auth').then(authData => {
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          if (parsed.user && parsed.tokens && parsed.tokens.accessToken) {
            setValues({
              auth: parsed,
              isLogged: true,
              isReady: true
            });
          }
        } catch (error) {
          console.error('🔄 Error refreshing auth state:', error);
        }
      }
    });
  },

  fetchFreshUserData: async () => {
    try {
      const currentState = authStore.getState();

      if (!currentState.auth.tokens?.accessToken) {
        console.log('⚠️ No access token available, cannot fetch user data');
        return;
      }

      // Check if we're already fetching to prevent loops
      const now = Date.now();
      const lastFetch = currentState._lastFetchTime || 0;
      if (now - lastFetch < 2000) { // Prevent calls within 2 seconds
        console.log('⚠️ Skipping fetch - too soon since last fetch');
        return;
      }

      // Mark that we're fetching - update in a way that doesn't trigger loops
      setValues({ _lastFetchTime: now });

      // Dynamic import to avoid circular dependency
      const { UserAPI } = await import('@/app/api/users');
      const response = await UserAPI.getMe();

      // Handle different response formats from your backend
      let userData = null;

      if (response && response.success && response.data) {
        userData = response.data;
      } else if (response && (response as any)._id) {
        userData = response as any;
      } else if (!response || (response && Object.keys(response).length === 0)) {
        return;
      } else {
        return;
      }

      if (userData) {
        const updatedAuth = {
          user: userData,
          tokens: currentState.auth.tokens
        };

        authStore.getState().set(updatedAuth);
      }
    } catch (error: any) {
      console.error('❌ Error fetching fresh user data:', error);

      if (error?.response?.status === 401) {
        authStore.getState().logout();

        if (typeof window !== 'undefined' && window.location.pathname !== '/auth/login') {
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 100);
        }
      }
    }
  },
}));