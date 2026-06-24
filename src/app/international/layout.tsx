import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lng = cookieStore.get('i18nextLng')?.value || 'fr';
  const isArabic = lng === 'ar';

  const title = isArabic
    ? "التبادل التجاري الدولي والمناقصات الدولية الجزائر | مزاد كليك"
    : "Appels d'Offres Internationaux & Import-Export Algérie | MazadClick";

  const description = isArabic
    ? "شراكات أجنبية واستيراد وتصدير B2B في الجزائر. صفقات النقل الدولي واللوجستيك، مناقصات دولية للمستثمرين."
    : "Découvrez les opportunités d'import-export B2B, appels d'offres internationaux en Algérie, logistique de transport et fret maritime.";

  const keywords = isArabic
    ? "التبادل التجاري الدولي, مناقصات دولية في الجزائر, شركاء أجانب, تصدير, سلعة من الخارج, لاسيسبور, شحن دولي"
    : "import-export Algérie B2B, commerce international, partenariats étrangers, fret logistique, appels d'offres internationaux, international tender algeria";

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

export default function InternationalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
