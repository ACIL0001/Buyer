import { ReactNode } from "react";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Script from "next/script";
import Head from "./head";
import Providers from "./Providers";
import CookieBanner from "@/components/common/CookieBanner";

// Critical CSS
import "../../public/assets/css/bootstrap.min.css";
import "../../public/assets/css/bootstrap-icons.css";
import "../../public/assets/css/style.css";
import "./rtl.css";

import { dmsans, playfair_display } from "@/fonts/font";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lng = cookieStore.get('i18nextLng')?.value || 'fr';
  const isArabic = lng === 'ar';

  const title = isArabic
    ? "مزاد كليك | مناقصات الجزائر، مزادات علنية وصفقات B2B"
    : "MazadClick | Appels d'offres, Enchères & Ventes B2B en Algérie";

  const description = isArabic
    ? "منصة الأعمال الأولى في الجزائر للمناقصات والصفقات العمومية، المزادات العلنية الإلكترونية، والبيع المباشر للشركات. تبيع تشري وتبزنس في دزاير."
    : "La première plateforme B2B en Algérie pour les appels d'offres, enchères en ligne et ventes directes. Trouvez vos marchés publics (BOMOP, BAOSEM) et opportunités d'affaires.";

  const keywords = isArabic
    ? "مناقصات الجزائر, صفقات عمومية, مزاد علني, أعمال, مزاد كليك, سوق البناء المهني, بيع وشراء بين الشركات, الجزائر, واد كنيس B2B"
    : "Appels d'offres Algérie, Marchés publics, enchères B2B, plateforme de mise en relation, baosem, mazad click, appel d'offre dz, marchés publics algérie, ventes directes, B2B, Algérie, alternative Ouedkniss";

  const headersList = await headers();
  const host = headersList.get('host') || '';
  const isVercel = host.includes('vercel.app') && !host.includes('mazadclick.vercel.app');

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://mazadclick.vercel.app'),
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      siteName: "MazadClick",
      locale: isArabic ? "ar_DZ" : "fr_DZ",
      type: "website",
    },
    ...(isVercel && {
      robots: {
        index: false,
        follow: false,
      }
    })
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${playfair_display.variable} ${dmsans.variable}`}
      // Prop to prevent hydration errors from browser extensions
      suppressHydrationWarning={true}
      data-scroll-behavior="smooth"
    >
      <head>
        <Head />
        <Script
          id="schema-jsonld"
          type="application/ld+json"
          strategy="beforeInteractive"
        >
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "MazadClick",
            "url": "https://mazadclick.vercel.app",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://mazadclick.vercel.app/auctions?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })}
        </Script>
      </head>
      <body>
        {/* GDPR Cookie Banner & Conditional Meta Pixel */}
        <CookieBanner />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_META_PIXEL_ID || '1893599971552570'}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
        
        <Providers>
          {children}
        </Providers>
        
        <div id="filter-popup-root"></div>
      </body>
    </html>
  );
}