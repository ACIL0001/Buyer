import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lng = cookieStore.get('i18nextLng')?.value || 'fr';
  const isArabic = lng === 'ar';

  const title = isArabic
    ? "سياسة الخصوصية وحماية البيانات | مزاد كليك"
    : "Notice d'information relative à la protection des données à caractère personnel Mazad Click";

  const description = isArabic
    ? "سياسة الخصوصية وحماية البيانات الشخصية وإدارة الكوكيز (Traceurs) على منصة مزاد كليك B2B."
    : "Consultez la politique de confidentialité, la gestion des données personnelles et des cookies sur la plateforme B2B MazadClick.";

  const keywords = isArabic
    ? "سياسة الخصوصية, حماية البيانات, البيانات الشخصية, أمن البيانات, كوكيز, مزاد كليك"
    : "politique de confidentialité, protection des données, RGPD, données personnelles, cookies, sécurité, plateforme B2B, MazadClick";

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

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
