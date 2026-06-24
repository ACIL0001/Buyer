import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lng = cookieStore.get('i18nextLng')?.value || 'fr';
  const isArabic = lng === 'ar';

  const title = isArabic
    ? "المناقصات في الجزائر | صفقات عمومية ودفتر الشروط | مزاد كليك"
    : "Appels d'Offres Algérie | Marchés Publics & Tenders | MazadClick";

  const description = isArabic
    ? "إعلانات المناقصات الوطنية والدولية، مشاريع البناء والصفقات العمومية في الجزائر. تنزيل دفتر الشروط والمشاركة."
    : "Consultez la liste des appels d'offres nationaux et internationaux en Algérie. Accédez aux cahiers des charges, BOMOP et marchés publics.";

  const keywords = isArabic
    ? "المناقصات في الجزائر, صفقات عمومية, إعلان مناقصة, دفتر الشروط, منقصات تع الشركات, باوسم, بوموب"
    : "Appels d'offres Algérie, Avis de marchés, Marchés publics, Tenders Algérie, BOMOP, cahier des charges, avis d'appel d'offre national dz, baosem";

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

export default function TendersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
