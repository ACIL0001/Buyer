import app from '../config';

/**
 * Get the full URL for a category image from the database
 * Handles various URL formats: full URLs, relative paths, /static/ paths, etc.
 * 
 * @param category - Category object with thumb property
 * @returns Full URL string for the category image, or fallback image path
 */
export const getCategoryImageUrl = (category: any): string => {
  // Ensure baseURL doesn't have trailing slash for proper URL construction
  const baseURL = app.baseURL?.replace(/\/$/, '') || 'http://localhost:3000';
  
  // Primary: Check if category has thumb with url
  if (category?.thumb?.url) {
    const imageUrl = category.thumb.url.trim();
    
    // Skip empty URLs
    if (!imageUrl) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Category has empty thumb.url:', category.name);
      }
      return '/assets/images/cat.avif';
    }
    
    // If it's already a full URL, return it as-is (after localhost replacement if needed)
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      // Replace localhost:3000 with current baseURL if needed
      if (imageUrl.includes('localhost:3000')) {
        const cleanBaseURL = baseURL.replace(/\/$/, '');
        return imageUrl.replace(/http:\/\/localhost:3000/g, cleanBaseURL);
      }
      return imageUrl;
    }
    
    // Handle /static/ paths - most common format from database
    if (imageUrl.startsWith('/static/')) {
      return `${baseURL}${imageUrl}`;
    }
    
    // Handle other paths starting with /
    if (imageUrl.startsWith('/')) {
      return `${baseURL}${imageUrl}`;
    }
    
    // Handle paths without leading slash - assume it's a static path
    return `${baseURL}/static/${imageUrl}`;
  }
  
  // Fallback: try other possible image fields
  const imageUrl = category?.thumb?.fullUrl || 
                   category?.image || 
                   category?.thumbnail || 
                   category?.photo || 
                   category?.thumb?.filename ||
                   '';
  
  if (!imageUrl || typeof imageUrl !== 'string') {
    return '/assets/images/cat.avif'; // Fallback image
  }

  const trimmedUrl = imageUrl.trim();
  
  // If it's already a full URL, return it as-is
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    if (trimmedUrl.includes('localhost:3000')) {
      const cleanBaseURL = baseURL.replace(/\/$/, '');
      return trimmedUrl.replace(/http:\/\/localhost:3000/g, cleanBaseURL);
    }
    return trimmedUrl;
  }

  // Handle relative paths
  if (trimmedUrl.startsWith('/static/')) {
    return `${baseURL}${trimmedUrl}`;
  }
  
  if (trimmedUrl.startsWith('/')) {
    return `${baseURL}${trimmedUrl}`;
  }
  
  // If no leading slash, assume it's a static file
  return `${baseURL}/static/${trimmedUrl}`;
};

/**
 * Handle image load error with fallback
 * Prevents infinite loops if fallback image also fails
 * 
 * @param e - Error event from img onError
 * @param fallbackImage - Path to fallback image (default: '/assets/images/cat.avif')
 * @param categoryInfo - Optional category info for logging
 */
export const handleCategoryImageError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackImage: string = '/assets/images/cat.avif',
  categoryInfo?: { id?: string; name?: string }
): void => {
  const target = e.target as HTMLImageElement;
  
  // Prevent infinite loop if fallback also fails
  if (target.src !== fallbackImage && !target.src.includes('cat.avif')) {
    if (process.env.NODE_ENV === 'development' && categoryInfo) {
      console.warn('Failed to load category image:', {
        categoryId: categoryInfo.id,
        categoryName: categoryInfo.name,
        attemptedUrl: target.src
      });
    }
    target.src = fallbackImage;
  }
};

