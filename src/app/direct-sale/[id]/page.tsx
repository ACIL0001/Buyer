
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
    // Import API dynamically to ensure server-side execution context is respected
    const { DirectSaleAPI } = await import('@/app/api/direct-sale');
    
    console.log('📡 [DirectSale] Fetching details...');
    const directSaleData = await DirectSaleAPI.getDirectSaleById(id);
    
    // Check if data is wrapped or direct
    const directSale = (directSaleData as any).data || directSaleData;
    
    if (!directSale) {
        throw new Error('Direct Sale not found');
    }

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
    const seller = directSale.seller?.name || directSale.sellerName || '';
    const location = directSale.location || directSale.wilaya || '';
    const condition = directSale.condition || 'new';
    
    // Create structured description
    const enhancedDescription = `${description}${price ? ` | Prix: ${price} ${currency}` : ''}${stock ? ` | Quantité: ${stock}` : ''}`;

    // Get production frontend URL for sharing
    const productionFrontendUrl = getFrontendUrl().replace(/\/$/, '');
    const pageUrl = `${productionFrontendUrl}/direct-sale/${id}`;
    
    console.log('🌐 [DirectSale] Production URL:', pageUrl);

    const metadata = {
      title: `${title} - Vente Directe MazadClick`,
      description: enhancedDescription,
      openGraph: {
        title: title,
        description: enhancedDescription,
        url: pageUrl,
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
        ...(condition && {
          'product:condition': condition,
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
            availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
            url: pageUrl,
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
    return metadata;

  } catch (error) {
    console.error("❌ [DirectSale] Metadata error:", error);
    const fallbackTitle = "Vente Directe - MazadClick";
    const fallbackDesc = "Découvrez cette opportunité sur MazadClick";

    return {
      title: fallbackTitle,
      description: fallbackDesc,
      openGraph: {
        title: fallbackTitle,
        description: fallbackDesc,
        url: `${getFrontendUrl().replace(/\/$/, '')}/direct-sale/${id || ''}`,
        type: 'website',
        siteName: 'MazadClick',
      },
    };
  }
}

export default async function DirectSaleDetailsPage(props: { params: Promise<{ id: string }> }) {
  // We await params just to satisfy Next.js server component requirements, 
  // but the client component uses useParams() hook
  await props.params;
  return (
    <DirectSaleDetailsClient />
  );
}
