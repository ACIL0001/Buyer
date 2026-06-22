import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lng = cookieStore.get('i18nextLng')?.value || 'fr';
  const isArabic = lng === 'ar';

  const title = isArabic
    ? "حول منصة مزاد كليك | إيكوسيستم الأعمال بالجزائر"
    : "À Propos de MazadClick | L'Écosystème B2B en Algérie";

  const description = isArabic
    ? "تعرف على خدمات منصة مزاد كليك لتنظيم المعاملات التجارية بين الشركات في الجزائر. قيمنا: الوضوح الكامل، تكافؤ الفرص، والنمو المشترك."
    : "Découvrez comment MazadClick structure et organise le marché professionnel algérien. Nos valeurs: clarté, inclusion et performance.";

  const keywords = isArabic
    ? "حول مزاد كليك, خدمات الجزائر, قيم الشركة, تسيير الأعمال, كيفاش تمشي المنصة"
    : "Qui sommes-nous, MazadClick, équipe, écosystème d'affaires, Algérie, comment ça marche";

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

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
