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
    const fetchUrl = `${app.baseURL}tenders/${id}`;
    console.log('📡 [Tender] Fetching from:', fetchUrl);
    
    const res = await fetch(fetchUrl, {
      headers: { 
        'x-access-key': app.apiKey,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'  // Always fetch fresh data
    });
    
    if (!res.ok) {
      console.error('❌ [Tender] Fetch failed with status:', res.status);
      return { title: "Appel d'Offres - MazadClick" };
    }

    const json = await res.json();
    const tender = json.data || json; 
    
    console.log('✅ [Tender] Data fetched:', tender?.title || tender?.name);

    // Tender title and description
    const title = tender.title || tender.name || "Appel d'Offres";
    const description = tender.description || "Découvrez cet appel d'offres sur MazadClick";

    // Image logic
    let imageUrl = "/assets/images/logo-dark.png";
    if (tender.attachments && tender.attachments.length > 0) {
        imageUrl = tender.attachments[0].url;
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
    const tenderType = tender.tenderType || tender.type || '';
    const category = tender.category?.name || tender.categoryName || '';
    const location = tender.location || '';
    const organization = tender.organization?.name || tender.organizationName || '';
    const offersCount = tender.offersCount || tender.bidsCount || 0;
    
    // Determine status
    const isExpired = deadline ? new Date(deadline) < new Date() : false;
    const status = isExpired ? 'Expiré' : 'Actif';
    
    // Create structured description
    const enhancedDescription = `${description}${budget ? ` | Budget: ${budget} ${currency}` : ''}${deadline ? ` | Date limite: ${new Date(deadline).toLocaleDateString('fr-DZ')}` : ''}${offersCount ? ` | ${offersCount} offres` : ''}${category ? ` | Catégorie: ${category}` : ''}`;

    // Get production frontend URL for sharing
    const productionFrontendUrl = getFrontendUrl().replace(/\/$/, '');
    
    console.log('🌐 [Tender] Production URL:', productionFrontendUrl + '/tender-details/' + id);

    const metadata = {
      title: `${title} - Appel d'Offres MazadClick`,
      description: enhancedDescription,
      openGraph: {
        title: title,
        description: enhancedDescription,
        url: `${productionFrontendUrl}/tender-details/${id}`,
        images: fullImageUrl ? [
          {
            url: fullImageUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ] : [],
        siteName: 'MazadClick',
        type: 'article',
        locale: 'fr_DZ',
        // Article-specific Open Graph tags for tenders
        ...(deadline && {
          'article:published_time': new Date().toISOString(),
          'article:expiration_time': new Date(deadline).toISOString(),
        }),
        ...(category && {
          'article:section': category,
        }),
        ...(organization && {
          'article:author': organization,
        }),
      },
      twitter: {
        card: 'summary_large_image',
        site: '@MazadClick',
        title: title,
        description: enhancedDescription,
        images: fullImageUrl ? [fullImageUrl] : [],
        creator: organization ? `@${organization}` : undefined,
      },
      // Additional metadata for better SEO
      keywords: [
        'appel d\'offres',
        'tender',
        'soumission',
        'MazadClick',
        category,
        tenderType,
        title,
      ].filter(Boolean).join(', '),
      authors: [{ name: organization || 'MazadClick' }],
      // JSON-LD structured data
      other: {
        'structuredData': JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'JobPosting',
          title: title,
          description: description,
          image: fullImageUrl,
          hiringOrganization: {
            '@type': 'Organization',
            name: organization || 'MazadClick',
          },
          datePosted: new Date().toISOString(),
          validThrough: deadline,
          jobLocation: location ? {
            '@type': 'Place',
            address: {
              '@type': 'PostalAddress',
              addressLocality: location,
            },
          } : undefined,
          baseSalary: budget ? {
            '@type': 'MonetaryAmount',
            currency: currency,
            value: {
              '@type': 'QuantitativeValue',
              value: budget,
              unitText: 'BUDGET',
            },
          } : undefined,
          employmentType: tenderType || 'TENDER',
          industry: category,
          ...(offersCount > 0 && {
            applicationContact: {
              '@type': 'ContactPoint',
              name: `${offersCount} offres reçues`,
            },
          }),
        }),
      },
    };
    
    console.log('✅ [Tender] Metadata generated successfully');
    console.log('📋 [Tender] OG Image:', metadata.openGraph?.images?.[0]?.url);
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
        url: `${getFrontendUrl().replace(/\/$/, '')}/tender-details/${id}`,
        type: 'website',
        siteName: 'MazadClick',
      },
    };
  }
}

export default function TenderDetailsPage() {
  return <TenderDetailsClient />;
}