import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lng = cookieStore.get('i18nextLng')?.value || 'fr';
  const isArabic = lng === 'ar';

  const title = isArabic
    ? "البيع المباشر للشركات في الجزائر | سعر الجملة | مزاد كليك"
    : "Vente Directe B2B Algérie | Grossistes & Prix Usine | MazadClick";

  const description = isArabic
    ? "منصة البيع المباشر للمعدات المهنية والسلع بالجملة للشركات. تصفية سلع وشراء مباشر بدون مزاد وبسعر المصنع."
    : "Achetez et vendez directement votre matériel professionnel, stocks et équipements au meilleur prix professionnel sans intermédiaire.";

  const keywords = isArabic
    ? "البيع المباشر للشركات, بيع مباشر, تصفية سلع, بيع وشراء مباشرة, نشري ونبيع تمتم بلا مزاد, بيع بالجملة, ڤرو, سوق الحميز, جوميا دي زاد"
    : "vente directe B2B, achat immédiat, grossiste Algérie, prix professionnel, matériel réformé, déstockage, achat en gros, alternative Jumia dz";

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

export default function DirectSaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
