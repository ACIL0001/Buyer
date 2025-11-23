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
      <section>
        {children}
      </section>
      <Footer />
    </>
  )
} 