import DirectSaleDetailsClient from "./DirectSaleDetailsClient";
import app, { getFrontendUrl } from "@/config";
import { normalizeImageUrlForMetadata } from "@/utils/url";

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<any> {
  const params = await props.params;
  const id = params.id;
  
  console.log('🔍 [DirectSale] Generating metadata for ID:', id);
  
  if (!id) {
    console.warn('⚠️ [DirectSale] No ID provided');
    return { title: "Vente Directe - MazadClick" };
  }

  try {
    const fetchUrl = `${app.baseURL}direct-sales/${id}`;
    console.log('📡 [DirectSale] Fetching from:', fetchUrl);
    
    const res = await fetch(fetchUrl, {
      headers: { 
        'x-access-key': app.apiKey,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'  // Always fetch fresh data
    });
    
    if (!res.ok) {
      console.error('❌ [DirectSale] Fetch failed with status:', res.status);
      return { title: "Vente Directe - MazadClick" };
    }

    const json = await res.json();
    const directSale = json.data || json; 
    
    console.log('✅ [DirectSale] Data fetched:', directSale?.title || directSale?.name);

    // Title and description
    const title = directSale.title || directSale.name || "Vente Directe";
    const description = directSale.description || "Découvrez cette opportunité sur MazadClick";

    // Image logic
    let imageUrl = "/assets/images/logo-dark.png";
    if (directSale.thumbs && directSale.thumbs.length > 0) {
        imageUrl = directSale.thumbs[0].url;
    }
    
    // Normalize image URL for Open Graph metadata
    const fullImageUrl = normalizeImageUrlForMetadata(imageUrl, getFrontendUrl());
    console.log('🖼️ [DirectSale] Image URL:', fullImageUrl);

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
    
    console.log('🌐 [DirectSale] Production URL:', productionFrontendUrl + '/direct-sale/' + id);

    const metadata = {
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
    
    console.log('✅ [DirectSale] Metadata generated successfully');
    console.log('📋 [DirectSale] OG Image:', metadata.openGraph?.images?.[0]?.url);
    return metadata;
    
  } catch (error) {
    console.error("❌ [DirectSale] Metadata error:", error);
    return { title: "Vente Directe - MazadClick" };
  }
}

export default function DirectSaleDetailsPage() {
  return <DirectSaleDetailsClient />;
}
