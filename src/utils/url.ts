/**
 * URL Utility Functions
 * Helper functions to ensure URLs are absolute and properly prefixed with API base URL
 */

import app from '@/config';

const DEFAULT_IMAGE = '/assets/images/avatar.jpg';

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

    // Already an absolute URL - return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // Relative URL - prefix with API base URL
    const baseURL = app.baseURL.endsWith('/') ? app.baseURL : `${app.baseURL}/`;
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return `${baseURL}${cleanUrl}`;
};

/**
 * Same as getAbsoluteUrl but returns undefined instead of a fallback
 * Useful when you want to handle missing images differently
 */
export const getAbsoluteUrlOrUndefined = (url?: string | null): string | undefined => {
    if (!url || url.trim() === '') return undefined;

    // Already an absolute URL - return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // Relative URL - prefix with API base URL
    const baseURL = app.baseURL.endsWith('/') ? app.baseURL : `${app.baseURL}/`;
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return `${baseURL}${cleanUrl}`;
};

/**
 * Gets a static image URL from the API server
 * @param path - Path to the static file (e.g., 'uploads/image.png')
 */
export const getStaticUrl = (path: string): string => {
    const baseURL = app.baseURL.endsWith('/') ? app.baseURL : `${app.baseURL}/`;
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const pathWithStatic = cleanPath.startsWith('static/') ? cleanPath : `static/${cleanPath}`;
    return `${baseURL}${pathWithStatic}`;
};

export default getAbsoluteUrl;
