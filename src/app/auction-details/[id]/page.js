import AuctionDetailsClient from "./AuctionDetailsClient";
import app, { getFrontendUrl } from "@/config";
import { normalizeImageUrlForMetadata } from "@/utils/url";

export async function generateMetadata(props) {
  const params = await props.params;
  const id = params.id;
  
  console.log('🔍 [Auction] Generating metadata for ID:', id);
  
  if (!id) {
    return {
      title: "Enchère - MazadClick",
    };
  }

  try {
    // Import API dynamically to ensure server-side execution context is respected
    const { AuctionsAPI } = await import('@/app/api/auctions');
    
    console.log('📡 [Auction] Fetching auction details...');
    const auctionData = await AuctionsAPI.getAuctionById(id);
    const auction = auctionData.data || auctionData;
    
    if (!auction) {
      throw new Error('Auction not found');
    }

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
    const pageUrl = `${productionFrontendUrl}/auction-details/${id}`;
    
    const metadata = {
      title: `${title} - Enchère MazadClick`,
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
            url: pageUrl,
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
    return metadata;
    
  } catch (error) {
    console.error("❌ [Auction] Metadata error:", error);
    const fallbackTitle = "Enchère - MazadClick";
    const fallbackDesc = "Découvrez cette enchère sur MazadClick";
    
    return {
      title: fallbackTitle,
      description: fallbackDesc,
      openGraph: {
        title: fallbackTitle,
        description: fallbackDesc,
        url: `${getFrontendUrl().replace(/\/$/, '')}/auction-details/${id || ''}`,
        type: 'website',
        siteName: 'MazadClick',
      },
    };
  }
}

import { Suspense } from 'react';

// ...

export default async function AuctionDetailsPage(props) {
  const params = await props.params;
  return (
    <Suspense fallback={
       <div className="auction-details-section mb-110" style={{ 
         marginTop: 0, 
         paddingTop: 'clamp(120px, 15vw, 140px)',
         minHeight: 'calc(100vh - 120px)'
       }}>
         <div className="container-fluid">
           <div className="row">
             <div className="col-12 text-center">
               <div className="spinner-border text-primary" role="status">
                 <span className="visually-hidden">Loading...</span>
               </div>
               <h3 className="mt-3">Chargement...</h3>
             </div>
           </div>
         </div>
       </div>
    }>
      <AuctionDetailsClient />
    </Suspense>
  );
} 