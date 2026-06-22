import TenderDetailsClient from "./TenderDetailsClient";
import app from "@/config";
import { normalizeImageUrl } from "@/utils/url";

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  
  if (!id) {
    return { title: "Tender Details - MazadClick" };
  }

  try {
    const res = await fetch(`${app.baseURL}tender/${id}`, {
      headers: { 
        'x-access-key': app.apiKey,
        'Content-Type': 'application/json'
      },
      next: { revalidate: 0 }
    });
    
    if (!res.ok) {
       return { title: "Tender Details - MazadClick" };
    }

    const json = await res.json();
    const tender = json.data || json; 

    // Tender title and description
    const title = tender.title || tender.name || "Tender Details";
    const description = tender.description || "View this tender on MazadClick";

    // Image logic
    let imageUrl = "/assets/images/logo-dark.png";
    if (tender.attachments && tender.attachments.length > 0) {
        imageUrl = tender.attachments[0].url;
    } else if (tender.images && tender.images.length > 0) {
        imageUrl = tender.images[0];
    }
    
    // Normalize image URL
    const fullImageUrl = normalizeImageUrl(imageUrl);

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

    return {
      title: `${title} - Appel d'Offres MazadClick`,
      description: enhancedDescription,
      openGraph: {
        title: title,
        description: enhancedDescription,
        url: `https://mazadclick.com/tender-details/${id}`,
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
  } catch (error) {
    console.error("Tender metadata error:", error);
    return { title: "Tender Details - MazadClick" };
  }
}

export default function TenderDetailsPage() {
  return <TenderDetailsClient />;
}