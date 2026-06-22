import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lng = cookieStore.get('i18nextLng')?.value || 'fr';
  const isArabic = lng === 'ar';

  const title = isArabic
    ? "دليل الاستخدام وكيفية عمل منصة مزاد كليك | دليل المناقصات"
    : "Guide d'Utilisation & Fonctionnement de la Plateforme B2B | MazadClick";

  const description = isArabic
    ? "شرح تفصيلي لكيفية المزايدة وتقديم العطاءات للمناقصات والصفقات العمومية في الجزائر. أمان المعاملات بين الشركات."
    : "Découvrez comment fonctionne la plateforme MazadClick. Tutoriels de soumission d'offres et d'enchères en ligne sécurisées.";

  const keywords = isArabic
    ? "كيف تعمل المنصة, دليل المناقصات, دليل الاستخدام, شرح المزايدة, كيفاش تمشي المنصة, طريقة المشاركة في المناقصات"
    : "guide utilisateur MazadClick, fonctionnement plateforme B2B, sécurité transactions, guide appels d'offres, tutoriel, comment utiliser mazadclick";

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

export default function HowToBidLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
