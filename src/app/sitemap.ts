import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://mazadclick.vercel.app';

  const routes = [
    { path: '', changeFrequency: 'daily', priority: 1.0 },
    { path: 'auction-sidebar', changeFrequency: 'hourly', priority: 0.9 },
    { path: 'direct-sale', changeFrequency: 'hourly', priority: 0.9 },
    { path: 'tenders', changeFrequency: 'hourly', priority: 0.9 },
    { path: 'about', changeFrequency: 'monthly', priority: 0.8 },
    { path: 'startup', changeFrequency: 'monthly', priority: 0.8 },
    { path: 'international', changeFrequency: 'monthly', priority: 0.8 },
    { path: 'how-to-bid', changeFrequency: 'monthly', priority: 0.7 },
    { path: 'subscription-plans', changeFrequency: 'monthly', priority: 0.7 },
    { path: 'plans', changeFrequency: 'monthly', priority: 0.7 },
    { path: 'contact', changeFrequency: 'yearly', priority: 0.5 },
    { path: 'privacy-policy', changeFrequency: 'yearly', priority: 0.5 },
    { path: 'terms-condition', changeFrequency: 'yearly', priority: 0.5 },
  ];

  return routes.map(({ path, changeFrequency, priority }) => {
    const routeUrl = path ? `${baseUrl}/${path}/` : `${baseUrl}/`;
    return {
      url: routeUrl,
      lastModified: new Date(),
      changeFrequency: changeFrequency as any,
      priority,
      alternates: {
        languages: {
          fr: path ? `${baseUrl}/${path}/?lng=fr` : `${baseUrl}/?lng=fr`,
          ar: path ? `${baseUrl}/${path}/?lng=ar` : `${baseUrl}/?lng=ar`,
        },
      },
    };
  });
}
