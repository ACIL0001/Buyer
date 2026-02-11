"use client";

import { useEffect, useState } from "react";
import MultipurposeDetails2 from "@/components/tender-details/MultipurposeDetails2";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { SnackbarProvider } from 'notistack';
import RequestProvider from "@/contexts/RequestContext";
import { AxiosInterceptor } from '@/app/api/AxiosInterceptor';

export default function TenderDetailsClient() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="auction-details-section mb-110" style={{ marginTop: 0, paddingTop: '120px', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <SnackbarProvider>
      <AxiosInterceptor>
        <RequestProvider>
          <Header />
          <MultipurposeDetails2 />
          <Footer />
        </RequestProvider>
      </AxiosInterceptor>
    </SnackbarProvider>
  );
}
