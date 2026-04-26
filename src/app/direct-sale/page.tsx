"use client";

import { useEffect } from "react";
import Link from "next/link";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import DynamicScrollToTop from "@/components/common/DynamicScrollToTop";
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
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@700&display=swap" rel="stylesheet" />
      <AxiosInterceptor>
        <RequestProvider>
          <SnackbarProvider maxSnack={3}>
            <Header />
            <main className="direct-sale-page" style={{ 
              width: '100%',
              minHeight: '100vh',
              height: 'auto', 
              background: '#FFFFFF',
              position: 'relative', 
              zIndex: 1, 
              paddingTop: '200px', 
              paddingBottom: 'clamp(40px, 5vw, 80px)',
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 700,
              opacity: 1,
              transform: 'rotate(0deg)',
              boxSizing: 'border-box',
              overflowY: 'auto',
              overflowX: 'hidden'
            }}>
              
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
            <DynamicScrollToTop colorSchema="yellow" />
          </SnackbarProvider>
        </RequestProvider>
      </AxiosInterceptor>
    </>
  );
}