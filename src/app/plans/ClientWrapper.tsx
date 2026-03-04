"use client";

import dynamic from 'next/dynamic';
import React from 'react';

// Use dynamic import to avoid SSR issues with heavy client components
const PlansClient = dynamic(() => import('@/app/plans/PlansClient'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0', minHeight: '100vh', background: '#f8fafc' }}>
      <div className="spinner" style={{ width: '48px', height: '48px', border: '4px solid rgba(0, 99, 177, 0.2)', borderTopColor: '#0063b1', borderRadius: '50%', animation: 'spin 1s ease-in-out infinite' }}></div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
});

export default function ClientWrapper() {
  return <PlansClient />;
}
