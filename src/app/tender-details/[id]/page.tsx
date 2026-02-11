
import TenderDetailsClient from "./TenderDetailsClient";
import app, { getFrontendUrl } from "@/config";
import { normalizeImageUrlForMetadata } from "@/utils/url";

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<any> {
  const params = await props.params;
  const id = params.id;
  
  console.log('🔍 [Tender] Generating metadata for ID:', id);
  
  if (!id) {
    console.warn('⚠️ [Tender] No ID provided');
    return { title: "Appel d'Offres - MazadClick" };
  }

  try {
    // Import API dynamically to ensure server-side execution context is respected
    const { TendersAPI } = await import('@/app/api/tenders');
    
    console.log('📡 [Tender] Fetching details...');
    const tenderData = await TendersAPI.getTenderById(id);
    const tender = (tenderData as any).data || tenderData;
    
    if (!tender) {
        throw new Error('Tender not found');
    }

    console.log('✅ [Tender] Data fetched:', tender?.title || tender?.name);

    // Title and description
    const title = tender.title || tender.name || "Appel d'Offres";
    const description = tender.description || "Découvrez cet appel d'offres sur MazadClick";

    // Image logic
    let imageUrl = "/assets/images/logo-dark.png";
    if (tender.attachments && tender.attachments.length > 0) {
        // Try to find an image attachment first
        const imageAttachment = tender.attachments.find((att: any) => 
            att.url && att.url.match(/\.(jpg|jpeg|png|webp)$/i)
        );
        
        if (imageAttachment) {
            imageUrl = imageAttachment.url;
        } else {
            // Fallback to first attachment (could be PDF, but better than nothing or specific logic needed)
             imageUrl = tender.attachments[0].url;
        }
    } else if (tender.images && tender.images.length > 0) {
        imageUrl = tender.images[0];
    }
    
    // Normalize image URL for Open Graph metadata
    const fullImageUrl = normalizeImageUrlForMetadata(imageUrl, getFrontendUrl());
    console.log('🖼️ [Tender] Image URL:', fullImageUrl);

    // Extract additional metadata
    const budget = tender.budget || tender.estimatedValue || 0;
    const currency = tender.currency || 'DZD';
    const deadline = tender.deadline || tender.submissionDeadline;
    const category = tender.category?.name || tender.categoryName || '';
    const location = tender.location || tender.wilaya || '';
    const issuer = tender.issuer?.name || tender.companyName || 'MazadClick';
    const offersCount = tender.offersCount || tender.bidsCount || 0;
    
    // Determine status
    const isExpired = deadline ? new Date(deadline) < new Date() : false;
    const status = isExpired ? 'Expiré' : 'Actif';
    
    // Create structured description
    const enhancedDescription = `${description}${budget ? ` | Budget: ${budget} ${currency}` : ''} | Status: ${status}${category ? ` | Catégorie: ${category}` : ''}`;

    // Get production frontend URL for sharing
    const productionFrontendUrl = getFrontendUrl().replace(/\/$/, '');
    const pageUrl = `${productionFrontendUrl}/tender-details/${id}`;
    
    console.log('🌐 [Tender] Production URL:', pageUrl);

    const metadata = {
      title: `${title} - Appel d'Offres MazadClick`,
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
        type: 'website', // Tenders are more like articles or website objects than products
        locale: 'fr_DZ',
      },
      twitter: {
        card: 'summary_large_image',
        site: '@MazadClick',
        title: title,
        description: enhancedDescription,
        images: fullImageUrl ? [fullImageUrl] : [],
      },
      authors: [{ name: issuer }],
      // JSON-LD structured data
      other: {
        'structuredData': JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Report', // Using Report as generic business checking or Tender if custom type supported
          name: title,
          description: description,
          image: fullImageUrl,
          dateExpires: deadline,
          about: {
            '@type': 'Thing',
            name: category,
          },
          author: {
             '@type': 'Organization',
             name: issuer,
          },
          ...(location && { locationCreated: { '@type': 'Place', name: location } }),
        }),
      },
    };
    
    console.log('✅ [Tender] Metadata generated successfully');
    return metadata;
    
  } catch (error) {
    console.error("❌ [Tender] Metadata error:", error);
    const fallbackTitle = "Appel d'Offres - MazadClick";
    const fallbackDesc = "Découvrez cet appel d'offres sur MazadClick";
    
    return {
      title: fallbackTitle,
      description: fallbackDesc,
      openGraph: {
        title: fallbackTitle,
        description: fallbackDesc,
        url: `${getFrontendUrl().replace(/\/$/, '')}/tender-details/${id || ''}`,
        type: 'website',
        siteName: 'MazadClick',
      },
    };
  }
}

export default async function TenderDetailsPage(props: { params: Promise<{ id: string }> }) {
  // We await params just to satisfy Next.js server component requirements,
  // but the client component uses useParams() hook
  await props.params;
  return (
    <TenderDetailsClient />
  );
}