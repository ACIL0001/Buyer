import DirectSaleDetailsClient from "./DirectSaleDetailsClient";
import app from "@/config";
import { normalizeImageUrl } from "@/utils/url";

// Force Next.js to not cache this page so social media bots always get fresh data
export const dynamic = 'force-dynamic';

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  
  const fallbackMetadata = { title: "Vente Directe - MazadClick" };

  if (!id) return fallbackMetadata;

  try {
    // Note: Make sure this matches your NestJS backend route exactly (direct-sale or direct-sales)
    const res = await fetch(`${app.baseURL}direct-sale/${id}`, {
      headers: { 
        'x-access-key': app.apiKey || '',
        'Content-Type': 'application/json'
      },
      next: { revalidate: 0 }
    });
    
    if (!res.ok) return fallbackMetadata;

    const json = await res.json();
    const directSale = json.data || json; 

    // Extract Data
    const title = directSale.title || "Vente Directe";
    const rawDescription = directSale.description || "Découvrez ce produit sur MazadClick";
    const price = directSale.price || 0;
    const quantity = directSale.quantity === 0 ? "Illimitée" : (directSale.quantity || 0);

    // Build the Social Media Description
    const shortDesc = rawDescription.length > 80 ? rawDescription.substring(0, 80) + '...' : rawDescription;
    const enhancedDescription = `💰 Prix: ${price} DA | 📦 Qté: ${quantity} | ${shortDesc}`;

    // FOOLPROOF IMAGE FIX FOR FACEBOOK
    let imageUrl = "/assets/images/logo-dark.png";
    if (directSale.thumbs && directSale.thumbs.length > 0) {
        imageUrl = directSale.thumbs[0].url || directSale.thumbs[0];
    }
    
    let fullImageUrl = normalizeImageUrl(imageUrl);
    
    // If the URL doesn't start with http, Facebook will ignore it. Force the domain!
    if (fullImageUrl && !fullImageUrl.startsWith('http')) {
        const domain = app.route || 'https://mazadclick.vercel.app'; 
        fullImageUrl = fullImageUrl.startsWith('/') 
            ? `${domain}${fullImageUrl}` 
            : `${domain}/${fullImageUrl}`;
    }

    return {
      title: `${title} - MazadClick`,
      description: enhancedDescription,
      openGraph: {
        title: title,
        description: enhancedDescription,
        url: `https://mazadclick.vercel.app/direct-sale/${id}`,
        images: fullImageUrl ? [
          {
            url: fullImageUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ] : [],
        siteName: 'MazadClick',
        type: 'website',
        locale: 'fr_DZ',
      },
      twitter: {
        card: 'summary_large_image',
        title: title,
        description: enhancedDescription,
        images: fullImageUrl ? [fullImageUrl] : [],
      }
    };
  } catch (error) {
    console.error("Direct Sale metadata error:", error);
    return fallbackMetadata;
  }
}

export default function DirectSaleDetailsPage() {
  return <DirectSaleDetailsClient />;
}