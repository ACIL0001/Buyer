import { ReactNode } from "react";
import Script from "next/script";
import { Metadata, Viewport } from "next";
import "../../public/assets/css/bootstrap-icons.css";
import "../../public/assets/css/boxicons.min.css";
import "../../public/assets/css/swiper-bundle.min.css";
import "../../public/assets/css/slick-theme.css";
import "../../public/assets/css/animate.min.css";
import "../../public/assets/css/nice-select.css";
import "../../public/assets/css/slick.css";
import "../../public/assets/css/bootstrap.min.css";
import "../../public/assets/css/style.css";
import "./rtl.css";

import { dmsans, playfair_display } from "@/fonts/font";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
  title: {
    default: 'MazadClick',
    template: '%s - MazadClick',
  },
  description: "MazadClick est la plateforme B2B d'enchères et de soumissions dédiée aux entreprises algériennes. Achetez, vendez et découvrez des opportunités uniques.",
  metadataBase: new URL('https://mazadclick.vercel.app'),
  applicationName: 'MazadClick',
  keywords: ["MazadClick", "enchères", "soumissions", "B2B", "entreprise", "Algérie", "marketplace"],
  icons: {
    icon: '/assets/icon.png',
    apple: '/assets/icon.png',
    shortcut: '/assets/icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_DZ',
    url: 'https://mazadclick.vercel.app',
    siteName: 'MazadClick',
    title: 'MazadClick',
    description: "MazadClick est la plateforme B2B d'enchères et de soumissions dédiée aux entreprises algériennes.",
  },
  twitter: {
    card: 'summary_large_image',
    site: '@MazadClick',
    creator: '@MazadClick',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0063b1',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${playfair_display.variable} ${dmsans.variable}`}
      suppressHydrationWarning={true}
    >
      <body>
        {/* Meta Pixel Code */}
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1893599971552570');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1893599971552570&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
