import AuctionDetailsClient from "./AuctionDetailsClient";
import app, { getFrontendUrl } from "@/config";
import { normalizeImageUrlForMetadata } from "@/utils/url";

export async function generateMetadata(props) {
  const params = await props.params;
  const id = params.id;
  
  console.log('🔍 [Auction] Generating metadata for ID:', id);
  
  if (!id) {
    console.warn('⚠️ [Auction] No ID provided');
    return {
      title: "Enchère - MazadClick",
    };
  }

  try {
    // Fetch auction data server-side
    const fetchUrl = `${app.baseURL}bid/${id}`;
    console.log('📡 [Auction] Fetching from:', fetchUrl);
    
    const res = await fetch(fetchUrl, {
      headers: { 
        'x-access-key': app.apiKey,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'  // Always fetch fresh data
    });
    
    if (!res.ok) {
       console.error("❌ [Auction] Fetch failed:", res.status, res.statusText);
       return {
            title: "Enchère - MazadClick",
            description: "Découvrez cette enchère sur MazadClick",
       };
    }

    const json = await res.json();
    const auction = json.data || json; 
    
    console.log('✅ [Auction] Data fetched:', auction?.title || auction?.name);

    // Get title and description
    const title = auction.title || auction.name || "Enchère";
    const description = auction.description || "Découvrez cette enchère sur MazadClick";

    // Get image URL
    let imageUrl = "/assets/images/logo-dark.png";
    if (auction.thumbs && auction.thumbs.length > 0) {
        imageUrl = auction.thumbs[0].url || auction.thumbs[0].fullUrl;
    } else if (auction.images && auction.images.length > 0) {
        imageUrl = auction.images[0];
    } else if (auction.image) {
        imageUrl = auction.image;
    }
    
    // Normalize image URL to be absolute for Open Graph
    const fullImageUrl = normalizeImageUrlForMetadata(imageUrl, getFrontendUrl());
    console.log('🖼️ [Auction] Image URL:', fullImageUrl);

    // Extract additional metadata
    const currentPrice = auction.currentPrice || auction.price || auction.startingPrice || 0;
    const currency = auction.currency || 'DZD';
    const endDate = auction.endDate || auction.endTime;
    const startDate = auction.startDate || auction.startTime;
    const bidsCount = auction.bidsCount || 0;
    const category = auction.category?.name || auction.categoryName || '';
    const location = auction.location || '';
    const seller = auction.seller?.name || auction.sellerName || '';
    
    // Determine availability
    const isEnded = endDate ? new Date(endDate) < new Date() : false;
    const availability = isEnded ? 'sold out' : 'in stock';
    
    // Create structured description
    const enhancedDescription = `${description}${currentPrice ? ` | Prix actuel: ${currentPrice} ${currency}` : ''}${bidsCount ? ` | ${bidsCount} enchères` : ''}${category ? ` | Catégorie: ${category}` : ''}`;

    // Get production frontend URL for sharing
    const productionFrontendUrl = getFrontendUrl().replace(/\/$/, '');
    
    console.log('🌐 [Auction] Production URL:', productionFrontendUrl + '/auction-details/' + id);

    const metadata = {
      title: `${title} - Enchère MazadClick`,
      description: enhancedDescription,
      openGraph: {
        title: title,
        description: enhancedDescription,
        url: `${productionFrontendUrl}/auction-details/${id}`,
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
        ...(currentPrice && {
          'product:price:amount': currentPrice.toString(),
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
        creator: seller ? `@${seller}` : undefined,
      },
      // Additional metadata for better SEO
      keywords: [
        'enchère',
        'auction',
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
            price: currentPrice,
            priceCurrency: currency,
            availability: isEnded ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
            url: `${productionFrontendUrl}/auction-details/${id}`,
            validThrough: endDate,
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
          aggregateRating: bidsCount > 0 ? {
            '@type': 'AggregateRating',
            ratingCount: bidsCount,
          } : undefined,
        }),
      },
    };
    
    console.log('✅ [Auction] Metadata generated successfully');
    console.log('📋 [Auction] OG Image:', metadata.openGraph?.images?.[0]?.url);
    return metadata;
    
  } catch (error) {
    console.error("❌ [Auction] Metadata error:", error);
    return {
      title: "Enchère - MazadClick",
      description: "Découvrez cette enchère sur MazadClick",
    };
  }
}

export default async function AuctionDetailsPage(props) {
  const params = await props.params;
  return (
    <AuctionDetailsClient params={params} />
  );
} 