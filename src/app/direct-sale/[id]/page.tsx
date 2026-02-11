import DirectSaleDetailsClient from "./DirectSaleDetailsClient";
import app, { getFrontendUrl } from "@/config";
import { normalizeImageUrlForMetadata } from "@/utils/url";

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  
  if (!id) {
    return { title: "Direct Sale Details - MazadClick" };
  }

  try {
    const res = await fetch(`${app.baseURL}direct-sales/${id}`, {
      headers: { 
        'x-access-key': app.apiKey,
        'Content-Type': 'application/json'
      },
      next: { revalidate: 0 }
    });
    
    if (!res.ok) {
       return { title: "Direct Sale Details - MazadClick" };
    }

    const json = await res.json();
    const directSale = json.data || json; 

    // Title and description
    const title = directSale.title || directSale.name || "Direct Sale Details";
    const description = directSale.description || "View this product on MazadClick";

    // Image logic
    let imageUrl = "/assets/images/logo-dark.png";
    if (directSale.thumbs && directSale.thumbs.length > 0) {
        imageUrl = directSale.thumbs[0].url;
    }
    
    // Normalize image URL for Open Graph metadata
    const fullImageUrl = normalizeImageUrlForMetadata(imageUrl, getFrontendUrl());

    // Extract additional metadata
    const price = directSale.price || 0;
    const currency = directSale.currency || 'DZD';
    const stock = directSale.stock || directSale.quantity || 0;
    const category = directSale.category?.name || directSale.categoryName || '';
    const location = directSale.location || '';
    const seller = directSale.seller?.name || directSale.sellerName || '';
    const condition = directSale.condition || 'new';
    
    // Determine availability
    const availability = stock > 0 ? 'in stock' : 'out of stock';
    
    // Create structured description
    const enhancedDescription = `${description}${price ? ` | Prix: ${price} ${currency}` : ''}${stock ? ` | ${stock} en stock` : ''}${category ? ` | Catégorie: ${category}` : ''}`;

    // Get production frontend URL for sharing
    const productionFrontendUrl = getFrontendUrl().replace(/\/$/, '');

    return {
      title: `${title} - Vente Directe MazadClick`,
      description: enhancedDescription,
      openGraph: {
        title: title,
        description: enhancedDescription,
        url: `${productionFrontendUrl}/direct-sale/${id}`,
        images: fullImageUrl ? [
          {
            url: fullImageUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ] : [],
        siteName: 'MazadClick',
        type: 'product',
        locale: 'fr_DZ',
        // Product-specific Open Graph tags
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
        ...(condition && {
          'product:condition': condition,
        }),
      },
      twitter: {
        card: 'summary_large_image',
        site: '@MazadClick',
        title: title,
        description: enhancedDescription,
        images: fullImageUrl ? [fullImageUrl] : [],
        creator: seller ? `@${seller}` : undefined,
      },
      // Additional metadata for better SEO
      keywords: [
        'vente directe',
        'direct sale',
        'MazadClick',
        category,
        title,
      ].filter(Boolean).join(', '),
      authors: [{ name: seller || 'MazadClick' }],
      // JSON-LD structured data
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
            availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: `${productionFrontendUrl}/direct-sale/${id}`,
            itemCondition: condition === 'new' ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition',
          },
          brand: {
            '@type': 'Brand',
            name: 'MazadClick',
          },
          category: category,
          ...(location && { location: location }),
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
    return { title: "Direct Sale Details - MazadClick" };
  }
}

export default function DirectSaleDetailsPage() {
  return <DirectSaleDetailsClient />;
}
