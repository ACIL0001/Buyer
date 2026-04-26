"use client";

import MultipurposeDetails2 from "@/components/tender-details/MultipurposeDetails2";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { SnackbarProvider } from 'notistack';
import RequestProvider from "@/contexts/RequestContext";
import { AxiosInterceptor } from '@/app/api/AxiosInterceptor';

export default function TenderDetailsClient() {
  return (
    <SnackbarProvider>
      <AxiosInterceptor>
        <RequestProvider>
          <style jsx global>{`
            body {
              background-color: #ffffff !important;
              background-image: none !important;
            }
          `}</style>
          <Header />
          <main style={{ minHeight: '100vh', backgroundColor: '#fff', marginTop: 0, paddingTop: 0 }}>
            <MultipurposeDetails2 />
          </main>
          <Footer />
        </RequestProvider>
      </AxiosInterceptor>
    </SnackbarProvider>
  );
}
