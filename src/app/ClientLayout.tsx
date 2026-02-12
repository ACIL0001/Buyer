"use client";
import { useEffect, ReactNode, useState } from "react";
import useWow from "@/customHooks/useWow";
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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { notificationManager } from "@/services/notifications";
import { Capacitor } from "@capacitor/core";
import ScrollTopBtn from "../components/common/ScrollTopBtn.jsx";

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

export default function ClientLayout({ children }: { children: ReactNode }) {
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
  );
}
