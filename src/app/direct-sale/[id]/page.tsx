import DirectSaleDetailsClient from "./DirectSaleDetailsClient";
import app from "@/config";
import { normalizeImageUrl } from "@/utils/url";

// Force Next.js to always fetch fresh data for social media bots
export const dynamic = 'force-dynamic';

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  
  const fallbackMetadata = { title: "Vente Directe - MazadClick" };

  if (!id) return fallbackMetadata;

  try {
    // FIX 1: Use singular 'direct-sale' to match your NestJS controller
    const res = await fetch(`${app.baseURL}direct-sale/${id}`, {
      headers: { 
        'x-access-key': app.apiKey || '',
        'Content-Type': 'application/json'
      },
      next: { revalidate: 0 }
    });
    
    if (!res.ok) {
       return fallbackMetadata;
    }

    const json = await res.json();
    const directSale = json.data || json; 

    // Extract core data
    const title = directSale.title || "Vente Directe";
    const rawDescription = directSale.description || "Découvrez ce produit sur MazadClick";
    const price = directSale.price || 0;
    
    // Calculate accurate stock 
    const totalQuantity = directSale.quantity || 0;
    const soldQuantity = directSale.soldQuantity || 0;
    const availableStock = totalQuantity === 0 ? "Illimitée" : (totalQuantity - soldQuantity);

    // FIX 2: Build the custom description (Price & Quantity FIRST)
    const cleanDesc = rawDescription.substring(0, 90) + (rawDescription.length > 90 ? '...' : '');
    const enhancedDescription = `💰 Prix: ${price} DA | 📦 Quantité: ${availableStock} | 📝 ${cleanDesc}`;

    // FIX 3: Force Absolute URL for Facebook (This unlocks the description!)
    let imageUrl = "/assets/images/logo-dark.png";
    if (directSale.thumbs && directSale.thumbs.length > 0) {
        imageUrl = directSale.thumbs[0].url || directSale.thumbs[0];
    }
    
    let fullImageUrl = normalizeImageUrl(imageUrl);
    if (fullImageUrl && !fullImageUrl.startsWith('http')) {
        const domain = app.route || 'https://mazadclick.vercel.app'; 
        fullImageUrl = fullImageUrl.startsWith('/') ? `${domain}${fullImageUrl}` : `${domain}/${fullImageUrl}`;
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