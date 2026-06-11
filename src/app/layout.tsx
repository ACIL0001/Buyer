import { ReactNode } from "react";
import type { Metadata } from "next";
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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://mazadclick.com'),
  title: "MazadClick | Enchères et Ventes Directes en Ligne",
  description: "La première plateforme en Algérie pour les enchères, les ventes directes et les appels d'offres. Achetez et vendez en toute sécurité avec des vendeurs vérifiés et des paiements protégés.",
  keywords: "enchères, ventes directes, appels d'offres, Algérie, achats sécurisés, MazadClick, B2B, B2C",
  openGraph: {
    title: "MazadClick | Enchères et Ventes Directes en Ligne",
    description: "La plateforme de référence pour les enchères et appels d'offres. Transactions sécurisées et vendeurs vérifiés.",
    siteName: "MazadClick",
    locale: "fr_DZ",
    type: "website",
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${playfair_display.variable} ${dmsans.variable}`}
      // Prop to prevent hydration errors from browser extensions
      suppressHydrationWarning={true}
    >
      <head>
        <Head />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "MazadClick",
              "url": "https://mazadclick.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://mazadclick.com/auctions?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body>
        {/* GDPR Cookie Banner & Conditional Meta Pixel */}
        <CookieBanner />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1893599971552570&ev=PageView&noscript=1"
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