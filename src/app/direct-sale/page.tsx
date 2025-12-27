"use client";

import { useEffect } from "react";
import Link from "next/link";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import useAuth from "@/hooks/useAuth";
import { AxiosInterceptor } from '@/app/api/AxiosInterceptor';
import { SnackbarProvider } from 'notistack';
import RequestProvider from "@/contexts/RequestContext";
import MultipurposeDirectSaleSidebar from "@/components/direct-sale-sidebar/MultipurposeDirectSaleSidebar";

export default function DirectSalePage() {
  const { initializeAuth } = useAuth();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <>
      <AxiosInterceptor>
        <RequestProvider>
          <SnackbarProvider maxSnack={3}>
            <Header />
            <main className="direct-sale-page" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', paddingTop: 'clamp(80px, 10vw, 120px)', paddingBottom: 'clamp(40px, 5vw, 80px)' }}>
              
              {/* Main Content - Sidebar/Grid Component */}
              <MultipurposeDirectSaleSidebar />
              
            </main>
            <Footer />
            <style jsx global>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </SnackbarProvider>
        </RequestProvider>
      </AxiosInterceptor>
    </>
  );
}