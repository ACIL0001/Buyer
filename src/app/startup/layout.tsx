import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lng = cookieStore.get('i18nextLng')?.value || 'fr';
  const isArabic = lng === 'ar';

  const title = isArabic
    ? "المؤسسات الناشئة والابتكار المفتوح الجزائر | مزاد كليك"
    : "Startup & Open Innovation Algérie | Financement & Projets | MazadClick";

  const description = isArabic
    ? "منصة الابتكار المفتوح وتمويل المشاريع المبتكرة في الجزائر. صفقات وحاضنات أعمال للشركات الناشئة لولوج الأسواق."
    : "Accédez à l'open innovation en Algérie. Appels à projets pour startups labellisées, partenariats B2B, incubateurs et investissement.";

  const keywords = isArabic
    ? "الابتكار المفتوح الجزائر, شركات ناشئة, تمويل مشاريع, بروجي جديد, ستارت آب, تمويل الجزائر, مسرعة أعمال"
    : "open innovation Algérie, label startup Algérie, projets innovants, financement startup, incubateur B2B, appel a projet algerie";

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

export default function StartupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
