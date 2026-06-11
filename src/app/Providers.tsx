"use client";

import { useEffect, ReactNode, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import useWow from "@/customHooks/useWow";
import { authStore } from "@/contexts/authStore";
import { AxiosInterceptor } from "@/app/api/AxiosInterceptor";
import { SnackbarProvider } from "@/contexts/snackbarContext";
import SocketProvider from "@/contexts/socket";
import { LanguageProvider } from "@/contexts/LanguageContext";
import I18nProvider from "@/components/I18nProvider";
import GlobalLoader from "@/components/common/GlobalLoader";
import TokenHandler from "@/app/components/TokenHandler";
import MobileOptimizer from "@/components/common/MobileOptimizer";
import ThemeInjector from "@/components/common/ThemeInjector";

// Import notification service
import { notificationManager } from "@/services/notifications";

// Non-critical components moved to dynamic imports for better initial load
const ScrollTopBtn = dynamic(() => import("../components/common/ScrollTopBtn.jsx"), { ssr: false });
const FloatingAdminChat = dynamic(() => import("@/components/FloatingAdminChat"), { ssr: false });
const FloatingLanguageSwitcher = dynamic(() => import("@/components/FloatingLanguageSwitcher"), { ssr: false });
const BidChecker = dynamic(() => import("@/components/BidChecker"), { ssr: false });
const WinnerAnnouncement = dynamic(() => import("@/components/WinnerAnnouncement"), { ssr: false });

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

export default function Providers({ children }: { children: ReactNode }) {
  useWow();

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000,  // 30 minutes
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      console.log('Initializing push notifications...');
      notificationManager.initialize().catch(error => {
        console.error('Failed to initialize notifications:', error);
      });
    }
  }, []);

  useEffect(() => {
    authStore.getState().initializeAuth();
  }, []);

  return (
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
                    <ThemeInjector />
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
  );
}
