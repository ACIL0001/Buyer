"use client";

import PageSkeleton from "@/components/skeletons/PageSkeleton";

export default function Loading() {
  return (
    <div className="category-page-loading" style={{ padding: '100px 0', background: '#f9fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px' }}>
        <PageSkeleton />

        
        {/* Redundant skeletons removed in favor of PageSkeleton */}
        
        {/* CSS Animations */}
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes shine {
            to {
              background-position-x: -200%;
            }
          }
        `}</style>
      </div>
    </div>
  )
} 