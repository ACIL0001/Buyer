"use client";
import { useEffect, ReactNode, useState } from "react";
import Script from "next/script";
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

import ScrollTopBtn from "../components/common/ScrollTopBtn.jsx";
import useWow from "@/customHooks/useWow";
import { dmsans, playfair_display } from "@/fonts/font";

import { authStore } from "@/contexts/authStore";
import { AxiosInterceptor } from "@/app/api/AxiosInterceptor";

import { SnackbarProvider } from "@/contexts/snackbarContext";
import SocketProvider from "@/contexts/socket";
import FloatingAdminChat from "@/components/FloatingAdminChat";
import FloatingLanguageSwitcher from "@/components/FloatingLanguageSwitcher";
import { LanguageProvider } from "@/contexts/LanguageContext";
import I18nProvider from "@/components/I18nProvider";
import GlobalLoader from "@/components/common/GlobalLoader";
import BidChecker from "@/components/BidChecker";
import WinnerAnnouncement from "@/components/WinnerAnnouncement";
import TokenHandler from "@/app/components/TokenHandler";
import MobileOptimizer from "@/components/common/MobileOptimizer";
import { usePathname } from "next/navigation";
import Head from "./head";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Import notification service
import { notificationManager } from "@/services/notifications";
import { Capacitor } from "@capacitor/core";

function ScrollManager() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
      return () => {
        window.history.scrollRestoration = "auto";
      };
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "auto" });
        document.documentElement?.scrollTo?.({ top: 0, behavior: "auto" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "auto" });
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }, 50);
      });
    }
  }, [pathname]);

  return null;
}

export default function RootLayout({ children }: { children: ReactNode }) {
  // --- Hooks must be called inside the component function body ---
  
  // Custom hook for WOW.js animations
  useWow();

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
      },
    },
  }));

  // Initialize notifications on app load
  useEffect(() => {
    // Check if running in Capacitor native app
    if (Capacitor.isNativePlatform()) {
      console.log('Initializing push notifications...');
      notificationManager.initialize().catch(error => {
        console.error('Failed to initialize notifications:', error);
      });
    }
  }, []);

  // useEffect for initializing authentication state
  useEffect(() => {
    // Initialize auth store on app load
    authStore.getState().initializeAuth();
  }, []);

  // Set document title
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = 'MazadClick';
    }
  }, []);

  // --- The return statement provides the component's UI ---
  return (
    <html
      lang="en"
      className={`${playfair_display.variable} ${dmsans.variable}`}
      // Prop to prevent hydration errors from browser extensions
      suppressHydrationWarning={true}
    >
      <Head />
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
        <QueryClientProvider client={queryClient}>
          <MobileOptimizer>
            <I18nProvider>
              <LanguageProvider>
                <AxiosInterceptor>
                  <SocketProvider>
                    <SnackbarProvider>
                      <TokenHandler>
                        <GlobalLoader />
                        <BidChecker />
                        <WinnerAnnouncement />
                        
                        {/* Notification Handler Component */}
                        <NotificationHandler />
                        
                        <ScrollManager />
                        {children}
                      </TokenHandler>
                      <ScrollTopBtn />
                      <FloatingAdminChat />
                      <FloatingLanguageSwitcher />
                    </SnackbarProvider>
                  </SocketProvider>
                </AxiosInterceptor>
              </LanguageProvider>
            </I18nProvider>
          </MobileOptimizer>
        </QueryClientProvider>
      </body>
    </html>
  );
}

// Notification Handler Component
function NotificationHandler() {
  useEffect(() => {
    // Handle notification permissions
    const handleNotificationPermission = async () => {
      if ('Notification' in window && Capacitor.getPlatform() === 'web') {
        if (Notification.permission === 'default') {
          // Request permission on web
          const permission = await Notification.requestPermission();
          console.log('Notification permission:', permission);
        }
      }
    };

    handleNotificationPermission();
  }, []);

  return null;
}