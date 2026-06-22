import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lng = cookieStore.get('i18nextLng')?.value || 'fr';
  const isArabic = lng === 'ar';

  const title = isArabic
    ? "المزادات العلنية الإلكترونية في الجزائر | مزاد كليك"
    : "Vente aux Enchères en Ligne en Algérie | Véhicules & Équipements B2B | MazadClick";

  const description = isArabic
    ? "منصة المزادات العلنية الإلكترونية للمحترفين في الجزائر. بيع وشراء بالمزاد للمعدات، الآلات، السيارات المستعملة والجديدة."
    : "Trouvez et participez aux meilleures ventes aux enchères en ligne en Algérie. Véhicules, équipements BTPH, matériel industriel réformé.";

  const keywords = isArabic
    ? "المزادات العلنية الإلكترونية, بيع وشراء بالمزاد, مزاد علني, دلالة موديرن, نزايد في المزاد, واد كنيس سيارات, واد كنيس دزاير"
    : "enchères en ligne Algérie, vente aux enchères, enchères professionnelles, équipements, véhicules réformés, enchérir, alternative ouedkniss auto";

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      locale: isArabic ? "ar_DZ" : "fr_DZ",
    }
  };
}

export default function AuctionSidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
