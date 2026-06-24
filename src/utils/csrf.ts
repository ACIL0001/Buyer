// CSRF Protection Utility

export const getCsrfToken = (): string => {
  if (typeof window === 'undefined') return '';
  
  // Read CSRF token from document.cookie set by the backend
  const match = document.cookie.match(new RegExp('(^| )csrf_token=([^;]+)'));
  if (match) {
    return match[2];
  }
  
  return '';
};

// Common paths that should be protected against CSRF
export const isProtectedPath = (url: string): boolean => {
  if (!url) return false;
  
  const protectedPaths = [
    '/auth/signin',
    '/auth/signup',
    '/auth/reset-password',
    '/message/voice-message',
    '/attachments/upload'
  ];
  
  return protectedPaths.some(path => url.includes(path));
};
