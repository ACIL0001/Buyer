import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lng = cookieStore.get('i18nextLng')?.value || 'fr';
  const isArabic = lng === 'ar';

  const title = isArabic
    ? "خطط الاشتراك والحلول الاحترافية | أسعار باقات مزاد كليك"
    : "Abonnements Veille Commerciale & Tarifs B2B | MazadClick";

  const description = isArabic
    ? "باقات الاشتراك للشركات والمحترفين في الجزائر. تنبيهات المناقصات اليومية، خدمات الترويج والإشهار وعروض الأسعار."
    : "Découvrez nos offres et forfaits d'abonnement pour la veille commerciale d'appels d'offres (BOMOP, BAOSEM) et enchères en Algérie.";

  const keywords = isArabic
    ? "خطط الاشتراك, أسعار الخدمات, حساب شركة, تنبيهات المناقصات, كيفاش نخلص لابيلمون, أسعار باوسم"
    : "Abonnements MazadClick, tarifs professionnels, packs visibilité, services premium, veille commerciale, alertes appels d'offres, tarifs baosem";

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

export default function SubscriptionPlansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
