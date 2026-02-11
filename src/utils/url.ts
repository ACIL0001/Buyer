/**
 * URL Utility Functions
 * Helper functions to ensure URLs are absolute and properly prefixed with API base URL
 */

import app from '@/config';

const DEFAULT_IMAGE = '/assets/images/avatar.jpg';

// Production server URL for normalizing localhost URLs
const PRODUCTION_SERVER = 'https://mazadclick-server.onrender.com';
const DEV_SERVER = 'http://localhost:3000';

// Check if we're in development
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Normalizes any URL to ensure it points to the correct server.
 * In development: uses localhost:3000
 * In production: converts localhost URLs to production server
 * 
 * @param url - The URL to normalize
 * @returns Normalized absolute URL
 */
export const normalizeImageUrl = (url?: string | null): string => {
    if (!url || url.trim() === '') return '';

    let cleanUrl = url.trim();

    // Get the target base URL based on environment
    // Ensure we strip any trailing slash AND /api suffix to get the root server URL
    let targetBase = isDevelopment
        ? DEV_SERVER
        : (app.baseURL || PRODUCTION_SERVER).replace(/\/$/, '');

    // Strip /api if present at the end of the base URL
    if (targetBase.endsWith('/api')) {
        targetBase = targetBase.slice(0, -4);
    }

    // Debug log
    if (typeof window !== 'undefined') {
        // console.log('🖼️ normalizeImageUrl:', { url, targetBase, isDevelopment });
    }

    // Handle localhost URLs (any port) - normalize to correct server
    if (cleanUrl.match(/http:\/\/localhost(:\d+)?/)) {
        try {
            const urlObj = new URL(cleanUrl);
            let path = urlObj.pathname;
            // Strip /api/ prefix from the path if present
            if (path.startsWith('/api/')) {
                path = path.replace('/api/', '/');
            }
            cleanUrl = `${targetBase}${path}${urlObj.search}`;
        } catch (e) {
            // Fallback: just replace the localhost part, and check for /api
            cleanUrl = cleanUrl.replace(/http:\/\/localhost(:\d+)?/, targetBase);
            // We can't easily strip /api here without parsing, but the try block covers most cases
        }
        return cleanUrl;
    }

    // Handle legacy api.mazad.click URLs (only in production)
    if (!isDevelopment && cleanUrl.startsWith('https://api.mazad.click')) {
        cleanUrl = cleanUrl.replace('https://api.mazad.click', targetBase);
    }

    // If it's already a full URL, return it
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
        return cleanUrl;
    }

    // If it's a frontend asset, return as is
    if (cleanUrl.startsWith('/assets/')) {
        return cleanUrl;
    }

    // Handle relative paths
    if (cleanUrl.startsWith('/static/')) {
        return `${targetBase}${cleanUrl}`;
    }

    if (cleanUrl.startsWith('/')) {
        return `${targetBase}${cleanUrl}`;
    }

    // If it starts with 'static/', treat it as relative path to root
    if (cleanUrl.startsWith('static/')) {
        return `${targetBase}/${cleanUrl}`;
    }

    // If no leading slash, assume it's a static file (if it doesn't have other indicators)
    return `${targetBase}/static/${cleanUrl}`;
};

/**
 * Ensures a URL is absolute by prefixing it with the API base URL if it's a relative path.
 * This is important because the frontend runs on a different port (e.g., localhost:3001)
 * than the backend API (e.g., localhost:3000), so relative URLs like "/static/..." would
 * incorrectly resolve to the frontend origin instead of the API.
 * 
 * @param url - The URL to process (can be relative or absolute)
 * @param fallback - Optional fallback URL if the input is empty/undefined
 * @returns An absolute URL pointing to the correct API server
 * 
 * @example
 * // Returns 'http://localhost:3000/static/image.png'
 * getAbsoluteUrl('/static/image.png')
 * 
 * @example
 * // Returns 'https://example.com/image.png' (unchanged)
 * getAbsoluteUrl('https://example.com/image.png')
 */
export const getAbsoluteUrl = (url?: string | null, fallback: string = DEFAULT_IMAGE): string => {
    // Return fallback if no URL provided
    if (!url || url.trim() === '') return fallback;

    // Use normalizeImageUrl for robust handling
    const normalized = normalizeImageUrl(url);
    return normalized || fallback;
};

/**
 * Same as getAbsoluteUrl but returns undefined instead of a fallback
 * Useful when you want to handle missing images differently
 */
export const getAbsoluteUrlOrUndefined = (url?: string | null): string | undefined => {
    if (!url || url.trim() === '') return undefined;

    // Use normalizeImageUrl for robust handling
    const normalized = normalizeImageUrl(url);
    return normalized || undefined;
};

/**
 * Gets a static image URL from the API server
 * @param path - Path to the static file (e.g., 'uploads/image.png')
 */
export const getStaticUrl = (path: string): string => {
    let targetBase = isDevelopment
        ? DEV_SERVER
        : (app.baseURL || PRODUCTION_SERVER).replace(/\/$/, '');

    // Strip /api if present
    if (targetBase.endsWith('/api')) {
        targetBase = targetBase.slice(0, -4);
    }

    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const pathWithStatic = cleanPath.startsWith('static/') ? cleanPath : `static/${cleanPath}`;
    return `${targetBase}/${pathWithStatic}`;
};

/**
 * Normalizes image URLs specifically for Open Graph metadata.
 * Always returns absolute URLs using the production domain, even in development.
 * This ensures social media platforms can properly fetch and display images.
 * 
 * @param url - The URL to normalize
 * @param frontendUrl - The frontend production URL (e.g., 'https://mazadclick.vercel.app')
 * @returns Absolute URL suitable for Open Graph tags
 */
export const normalizeImageUrlForMetadata = (url?: string | null, frontendUrl?: string): string => {
    if (!url || url.trim() === '') return '';

    let cleanUrl = url.trim();

    // Always use production server for metadata
    const METADATA_SERVER = PRODUCTION_SERVER;

    // If it's a frontend asset (/assets/), make it absolute using frontend URL
    if (cleanUrl.startsWith('/assets/')) {
        const baseFrontendUrl = frontendUrl || 'https://mazadclick.vercel.app';
        return `${baseFrontendUrl.replace(/\/$/, '')}${cleanUrl}`;
    }

    // If it's already a full URL, return it
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
        // Convert localhost URLs to production URLs for metadata
        if (cleanUrl.match(/http:\/\/localhost(:\d+)?/)) {
            try {
                const urlObj = new URL(cleanUrl);
                let path = urlObj.pathname;
                // Strip /api/ prefix from the path if present
                if (path.startsWith('/api/')) {
                    path = path.replace('/api/', '/');
                }
                return `${METADATA_SERVER}${path}${urlObj.search}`;
            } catch (e) {
                // Fallback: just replace the localhost part
                return cleanUrl.replace(/http:\/\/localhost(:\d+)?/, METADATA_SERVER);
            }
        }
        return cleanUrl;
    }

    // Handle relative paths - always use production server
    if (cleanUrl.startsWith('/static/')) {
        return `${METADATA_SERVER}${cleanUrl}`;
    }

    if (cleanUrl.startsWith('/')) {
        return `${METADATA_SERVER}${cleanUrl}`;
    }

    // If it starts with 'static/', treat it as relative path to root
    if (cleanUrl.startsWith('static/')) {
        return `${METADATA_SERVER}/${cleanUrl}`;
    }

    // If no leading slash, assume it's a static file
    return `${METADATA_SERVER}/static/${cleanUrl}`;
};

export default getAbsoluteUrl;
