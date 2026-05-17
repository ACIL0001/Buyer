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
              /* Mobile/tablet: header collapses to ~68px (~60px on very small phones).
                 Tighten both the page top padding and the title's stacked 80px margin. */
              @media (max-width: 1024px) {
                .direct-sale-page {
                  padding-top: 72px !important;
                }
                .direct-sale-page h1 {
                  margin-top: 8px !important;
                  font-size: 28px !important;
                  line-height: 32px !important;
                }
                .direct-sale-page .container {
                  margin-bottom: 20px !important;
                }
              }
              @media (max-width: 375px) {
                .direct-sale-page {
                  padding-top: 64px !important;
                }
                .direct-sale-page h1 {
                  margin-top: 4px !important;
                  font-size: 22px !important;
                  line-height: 26px !important;
                }
              }
            `}</style>
            <DynamicScrollToTop colorSchema="yellow" />
          </SnackbarProvider>
        </RequestProvider>
      </AxiosInterceptor>
    </>
  );
}