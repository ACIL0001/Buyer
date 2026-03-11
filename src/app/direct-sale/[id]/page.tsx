import DirectSaleDetailsClient from "./DirectSaleDetailsClient";
import app from "@/config";
import { normalizeImageUrl } from "@/utils/url";

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  
  // 1. Fallback metadata in case the fetch fails
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
    // FIX 1: Ensure we hit the correct singular endpoint matching the backend controller
    const res = await fetch(`${app.baseURL}direct-sale/${id}`, {
      headers: { 
        'x-access-key': app.apiKey || '',
        'Content-Type': 'application/json'
      },
      next: { revalidate: 0 } // Bypass cache to guarantee fresh metadata for sharing
    });
    
    if (!res.ok) {
       console.error(`Failed to fetch metadata. Status: ${res.status}`);
       return fallbackMetadata;
    }

    const json = await res.json();
    const directSale = json.data || json; 

    // Extract core data based on your NestJS schema
    const title = directSale.title || "Vente Directe";
    const description = directSale.description || "Découvrez ce produit sur MazadClick";
    const price = directSale.price || 0;
    const currency = 'DZD'; // Default to Algerian Dinar
    
    // Calculate accurate stock availability
    const totalQuantity = directSale.quantity || 0;
    const soldQuantity = directSale.soldQuantity || 0;
    const availableStock = totalQuantity === 0 ? 999 : (totalQuantity - soldQuantity);
    const availability = availableStock > 0 ? 'in stock' : 'out of stock';

    // Map relationships securely
    const category = directSale.productCategory?.name || '';
    const location = [directSale.wilaya, directSale.place].filter(Boolean).join(', ') || '';
    const seller = directSale.owner?.entreprise || directSale.owner?.companyName || directSale.owner?.firstName || 'MazadClick Vendeur';
    const condition = 'new'; // Update if your schema tracks new vs used
    
    // Create a punchy, informative description for social media previews
    const shortDesc = description.substring(0, 120) + (description.length > 120 ? '...' : '');
    const enhancedDescription = `${shortDesc} | Prix: ${price} ${currency} ${availableStock > 0 && totalQuantity !== 0 ? `| ${availableStock} en stock` : ''} ${category ? `| Catégorie: ${category}` : ''}`;

    // FIX 2: Resolve absolute URLs for Facebook/WhatsApp crawlers
    let imageUrl = "/assets/images/logo-dark.png";
    if (directSale.thumbs && directSale.thumbs.length > 0) {
        imageUrl = directSale.thumbs[0].url || directSale.thumbs[0];
    }
    
    let fullImageUrl = normalizeImageUrl(imageUrl);
    // Force absolute URL if it's relative
    if (fullImageUrl && fullImageUrl.startsWith('/')) {
        const domain = app.route || 'https://mazadclick.vercel.app'; 
        fullImageUrl = `${domain}${fullImageUrl}`;
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
        // Advanced Facebook Product Tags
        ...(price && {
          'product:price:amount': price.toString(),
          'product:price:currency': currency,
        }),
        ...(availability && {
          'product:availability': availability,
        }),
        ...(category && {
          'product:category': category,
        }),
      },
      twitter: {
        card: 'summary_large_image',
        site: '@MazadClick',
        title: title,
        description: enhancedDescription,
        images: fullImageUrl ? [fullImageUrl] : [],
        creator: `@${seller.replace(/\s+/g, '')}`, // Removes spaces for Twitter handle fallback
      },
      // SEO Keywords
      keywords: [
        'vente directe',
        'direct sale',
        'MazadClick',
        'Algérie',
        category,
        title,
        location
      ].filter(Boolean).join(', '),
      authors: [{ name: seller }],
      
      // Advanced JSON-LD Structured Data for Google Rich Snippets
      other: {
        'structuredData': JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: title,
          description: description,
          image: fullImageUrl,
          offers: {
            '@type': 'Offer',
            price: price,
            priceCurrency: currency,
            availability: availableStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: `https://mazadclick.vercel.app/direct-sale/${id}`,
            itemCondition: condition === 'new' ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition',
          },
          brand: {
            '@type': 'Brand',
            name: 'MazadClick',
          },
          category: category,
          ...(location && { 
            locationCreated: {
              '@type': 'Place',
              name: location
            } 
          }),
          ...(seller && { 
            seller: {
              '@type': 'Organization',
              name: seller,
            },
          }),
        }),
      },
    };
  } catch (error) {
    console.error("Direct Sale metadata error:", error);
    return fallbackMetadata;
  }
}

export default function DirectSaleDetailsPage() {
  return <DirectSaleDetailsClient />;
}