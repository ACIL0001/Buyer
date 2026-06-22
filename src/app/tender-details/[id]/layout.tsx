import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import app from "@/config";
import { normalizeImageUrl } from "@/utils/url";

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const id = params.id;
  const cookieStore = await cookies();
  const lng = cookieStore.get('i18nextLng')?.value || 'fr';
  const isArabic = lng === 'ar';

  if (!id) {
    return {
      title: isArabic ? "تفاصيل المناقصة - MazadClick" : "Détails de l'appel d'offres - MazadClick",
    };
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
       return {
            title: isArabic ? "تفاصيل المناقصة - MazadClick" : "Détails de l'appel d'offres - MazadClick",
       };
    }

    const json = await res.json();
    const tender = json.data || json; 

    const title = tender.title || "Détails de l'appel d'offres";
    const description = tender.description || "Consultez les détails de l'appel d'offres";

    // Image logic
    let imageUrl = "/assets/images/logo-dark.png";
    if (tender.thumbs && tender.thumbs.length > 0) {
        imageUrl = tender.thumbs[0].url;
    }
    const fullImageUrl = normalizeImageUrl(imageUrl);

    const category = tender.category?.name || tender.categoryName || '';
    
    const formattedTitle = isArabic
      ? `${title} - تقديم عطاءات ودفتر الشروط | مزاد كليك`
      : `${title} - Soumission Appel d'Offres Algérie | MazadClick`;

    const enhancedDescription = isArabic
      ? `${description} | التقديم على المناقصات ودفتر الشروط ومشاركة في المناقصة`
      : `${description} | Répondre à un appel d'offres, dossier de soumission et cahier des charges B2B.`;

    const keywords = isArabic
      ? `تقديم عطاءات, مشاركة في المناقصة, دفتر الشروط, صفقات عمومية, ${category}, ${title}`
      : `Soumissionner marché public, Répondre appel d'offres, dossier de soumission, cahier des charges, ${category}, ${title}`;

    return {
      title: formattedTitle,
      description: enhancedDescription,
      keywords,
      openGraph: {
        title: title,
        description: enhancedDescription,
        url: `https://mazadclick.vercel.app/tender-details/${id}`,
        images: fullImageUrl ? [{ url: fullImageUrl, alt: title }] : [],
        siteName: 'MazadClick',
        locale: isArabic ? 'ar_DZ' : 'fr_DZ',
      }
    };
  } catch (error) {
    console.error("Tender details layout metadata error:", error);
    return {
      title: isArabic ? "تفاصيل المناقصة - MazadClick" : "Détails de l'appel d'offres - MazadClick",
    };
  }
}

export default function TenderDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f9fa',
      paddingTop: '0px',
      paddingBottom: '50px',
    }}>
      {children}
    </div>
  );
}
