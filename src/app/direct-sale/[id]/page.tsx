import DirectSaleDetailsClient from "./DirectSaleDetailsClient";
import app from "@/config";
import { normalizeImageUrl } from "@/utils/url";

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  
  const fallbackMetadata = {
    title: "Vente Directe - MazadClick",
    description: "Découvrez cette vente directe sur MazadClick. Trouvez les meilleures offres et produits.",
    openGraph: {
      title: "Vente Directe - MazadClick",
      description: "Découvrez cette vente directe sur MazadClick.",
      url: `https://mazadclick.vercel.app/direct-sale/${id}`,
      siteName: 'MazadClick',
      type: 'website',
      locale: 'fr_DZ',
    }
  };

  if (!id) return fallbackMetadata;

  try {
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

    // 1. Extract the raw data safely
    const title = directSale.title || "Vente Directe";
    const rawDescription = directSale.description || "Découvrez ce produit sur MazadClick";
    const price = directSale.price || 0;
    
    // 2. Calculate the exact available quantity
    const totalQuantity = directSale.quantity || 0;
    const soldQuantity = directSale.soldQuantity || 0;
    const availableStock = totalQuantity === 0 ? "Illimitée" : (totalQuantity - soldQuantity);

    // 3. Build the custom Social Media Description
    // We put Price and Quantity FIRST so Facebook doesn't cut them off!
    const shortDesc = rawDescription.length > 90 ? rawDescription.substring(0, 90) + '...' : rawDescription;
    const enhancedDescription = `💰 Prix: ${price} DA | 📦 Quantité: ${availableStock} | 📝 ${shortDesc}`;

    // Handle Image
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
      description: enhancedDescription, // <-- This feeds Google Search
      openGraph: {
        title: title,
        description: enhancedDescription, // <-- This feeds Facebook/WhatsApp
        url: `https://mazadclick.vercel.app/direct-sale/${id}`,
        images: fullImageUrl ? [{ url: fullImageUrl, width: 1200, height: 630, alt: title }] : [],
        siteName: 'MazadClick',
        type: 'website',
        locale: 'fr_DZ',
      },
      twitter: {
        card: 'summary_large_image',
        title: title,
        description: enhancedDescription, // <-- This feeds Twitter/X
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