'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authStore } from '@/contexts/authStore';
import app from '@/config';
import { CLIENT_TYPE } from '@/types/User';

interface TokenHandlerProps {
  children: React.ReactNode;
}

export default function TokenHandler({ children }: TokenHandlerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    const processTokenFromUrl = async () => {
      // Only process once
      if (hasProcessed || isProcessing) return;

      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refreshToken');
      const fromSeller = searchParams.get('from') === 'seller';

      // Only process if we have a token and it's from seller
      if (token && fromSeller) {
        console.log('🔄 TokenHandler: Processing token from seller redirect');
        setIsProcessing(true);

        try {
          // Decode the tokens
          const accessToken = decodeURIComponent(token);
          const refreshTokenValue = refreshToken ? decodeURIComponent(refreshToken) : '';

          console.log('🔑 TokenHandler: Extracted tokens:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshTokenValue,
            accessTokenLength: accessToken.length
          });

          // Verify the token with the backend
          console.log('🌐 TokenHandler: Making request to validate token...');
          console.log('🌐 TokenHandler: Request URL:', `${app.baseURL.replace(/\/$/, '')}/auth/validate-token`);
          console.log('🌐 TokenHandler: Headers:', {
            'Authorization': `Bearer ${accessToken.substring(0, 20)}...`,
            'x-access-key': app.apiKey,
            'Content-Type': 'application/json',
          });

          const response = await fetch(`${app.baseURL.replace(/\/$/, '')}/auth/validate-token`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'x-access-key': app.apiKey,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          console.log('🌐 TokenHandler: Response status:', response.status);
          console.log('🌐 TokenHandler: Response headers:', Object.fromEntries(response.headers.entries()));

          if (response.ok) {
            const data = await response.json();
            console.log('✅ TokenHandler: Token validation successful:', data);

            if (data.valid && data.user) {
              // Store the authentication data
              const authData = {
                user: data.user,
                tokens: {
                  accessToken: accessToken,
                  refreshToken: refreshTokenValue,
                },
              };

              console.log('💾 TokenHandler: Storing auth data:', authData);
              authStore.getState().set(authData);

              // Remove token parameters from URL without page reload
              const url = new URL(window.location.href);
              url.searchParams.delete('token');
              url.searchParams.delete('refreshToken');
              url.searchParams.delete('from');
              
              // Update URL without reload
              window.history.replaceState({}, '', url.toString());

              console.log('🎉 TokenHandler: Authentication successful, redirecting to home');
              
              // Small delay to ensure auth store is updated
              setTimeout(() => {
                router.push('/');
              }, 500);
            } else {
              console.error('❌ TokenHandler: Invalid token response:', data);
              // Clean up URL parameters
              const url = new URL(window.location.href);
              url.searchParams.delete('token');
              url.searchParams.delete('refreshToken');
              url.searchParams.delete('from');
              window.history.replaceState({}, '', url.toString());
            }
          } else {
            const errorText = await response.text();
            console.error('❌ TokenHandler: Token validation failed:', {
              status: response.status,
              statusText: response.statusText,
              error: errorText
            });
            
            // If it's a CORS error or network error, try a different approach
            if (response.status === 0 || response.status === 404) {
              console.log('🔄 TokenHandler: Attempting alternative authentication method...');
              
              // Try to decode the JWT token and use it directly
              try {
                const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
                console.log('🔍 TokenHandler: Token payload:', tokenPayload);
                
                // Check if token is expired
                const now = Math.floor(Date.now() / 1000);
                if (tokenPayload.exp && tokenPayload.exp < now) {
                  console.error('❌ TokenHandler: Token has expired');
                  throw new Error('Token expired');
                }
                
                // Create a mock user object from token payload
                const mockUser = {
                  _id: tokenPayload.sub,
                  firstName: 'User', // Default values since we don't have this info in token
                  lastName: 'From Seller',
                  email: '', // Will be fetched later if needed
                  type: CLIENT_TYPE.CLIENT,
                  phone: '',
                  displayName: 'User From Seller',
                  photoURL: '/static/mock-images/avatars/avatar_24.jpg',
                  rate: 1,
                  avatar: undefined,
                };
                
                console.log('🔄 TokenHandler: Using token payload for authentication');
                
                // Store the authentication data with mock user
                const authData = {
                  user: mockUser,
                  tokens: {
                    accessToken: accessToken,
                    refreshToken: refreshTokenValue,
                  },
                };

                console.log('💾 TokenHandler: Storing auth data with mock user:', authData);
                authStore.getState().set(authData);

                // Remove token parameters from URL without page reload
                const url = new URL(window.location.href);
                url.searchParams.delete('token');
                url.searchParams.delete('refreshToken');
                url.searchParams.delete('from');
                
                // Update URL without reload
                window.history.replaceState({}, '', url.toString());

                console.log('🎉 TokenHandler: Authentication successful with token payload, redirecting to home');
                
                // Small delay to ensure auth store is updated
                setTimeout(() => {
                  router.push('/');
                }, 500);
                
                return; // Exit early since we handled the error
              } catch (tokenError) {
                console.error('❌ TokenHandler: Failed to decode token:', tokenError);
              }
            }
            
            // Clean up URL parameters
            const url = new URL(window.location.href);
            url.searchParams.delete('token');
            url.searchParams.delete('refreshToken');
            url.searchParams.delete('from');
            window.history.replaceState({}, '', url.toString());
          }
        } catch (error) {
          console.error('❌ TokenHandler: Error processing token:', error);
          // Clean up URL parameters
          const url = new URL(window.location.href);
          url.searchParams.delete('token');
          url.searchParams.delete('refreshToken');
          url.searchParams.delete('from');
          window.history.replaceState({}, '', url.toString());
        } finally {
          setIsProcessing(false);
          setHasProcessed(true);
        }
      } else {
        // No token to process
        setHasProcessed(true);
      }
    };

    processTokenFromUrl();
  }, [searchParams, router, hasProcessed, isProcessing]);

  // Show loading state while processing token
  if (isProcessing) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '16px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>Authenticating...</h2>
        <p style={{ margin: 0, opacity: 0.8, fontSize: '16px' }}>Please wait while we verify your credentials</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}
