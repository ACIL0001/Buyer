import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lng = cookieStore.get('i18nextLng')?.value || 'fr';
  const isArabic = lng === 'ar';

  const title = isArabic
    ? "تفاصيل المزاد العلني | مزاد كليك"
    : "Détails de l'Enchère | MazadClick";

  const description = isArabic
    ? "معلومات وتفاصيل المزاد العلني والمزايدة على الإنترنت للمعدات والسيارات في الجزائر."
    : "Consultez les détails de cette vente aux enchères en ligne en Algérie et placez vos offres.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      locale: isArabic ? "ar_DZ" : "fr_DZ",
    }
  };
}

export default function AuctionDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
