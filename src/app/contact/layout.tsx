import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lng = cookieStore.get('i18nextLng')?.value || 'fr';
  const isArabic = lng === 'ar';

  const title = isArabic
    ? "اتصل بنا | الدعم الفني وخدمة العملاء مزاد كليك"
    : "Contact & Support Client MazadClick | Assistance B2B";

  const description = isArabic
    ? "تواصل مع فريق الدعم الفني والخدمة التجارية لمزاد كليك. راسلنا أو اتصل بنا للحصول على مرافقة في مناقصاتك أو مزاداتك."
    : "Contactez nos équipes et conseillers pour toute assistance technique ou commerciale sur vos enchères et soumissions en Algérie.";

  const keywords = isArabic
    ? "اتصل بنا, دعم فني, خدمة العملاء, كيفاش نهدر مع الفريق, رقم هاتف مزاد كليك, اتصل بنا الجزائر"
    : "support client, assistance technique, service client B2B, contact, aide, numéro mazad click, contact alger";

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

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
