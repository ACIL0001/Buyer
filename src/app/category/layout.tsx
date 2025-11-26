"use client";

import Header from '@/components/header/Header'
import Footer from '@/components/footer/Footer'

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <section style={{ paddingTop: 'clamp(70px, 8vw, 100px)' }}>
        {children}
      </section>
      <Footer />
    </>
  )
} 