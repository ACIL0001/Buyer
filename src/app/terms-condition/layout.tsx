import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lng = cookieStore.get('i18nextLng')?.value || 'fr';
  const isArabic = lng === 'ar';

  const title = isArabic
    ? "الشروط والأحكام العامة للاستخدام | شروط استخدام مزاد كليك"
    : "Conditions Générales d'Utilisation (CGU) & Mentions Légales | MazadClick";

  const description = isArabic
    ? "القواعد القانونية المنظمة للمعاملات التجارية وشروط وأحكام استخدام منصة مزاد كليك B2B."
    : "Consultez les conditions générales d'utilisation (CGU) et les mentions légales de la plateforme B2B MazadClick.";

  const keywords = isArabic
    ? "الشروط القانونية, شروط الاستخدام, القواعد القانونية, اتفاقية الاستخدام, شروط استخدام بالجزائر, مزاد كليك"
    : "Mentions légales site B2B, Conditions générales d'utilisation, CGU, conditions d'utilisation, contrat d'utilisation, B2B, MazadClick, dz";

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

export default function TermsConditionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
