"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/FooterWithErrorBoundary';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import DynamicScrollToTop from "@/components/common/DynamicScrollToTop";
import { motion } from 'framer-motion';

const InternationalPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [headerHeight, setHeaderHeight] = useState(104);

  useEffect(() => {
    const checkHeaderHeight = () => {
      const width = window.innerWidth;
      let calculatedHeight = 104;
      if (width <= 375) calculatedHeight = 62;
      else if (width <= 768) calculatedHeight = 65;
      else if (width <= 992) calculatedHeight = 70;
      setHeaderHeight(calculatedHeight);
    };
    checkHeaderHeight();
    window.addEventListener('resize', checkHeaderHeight);
    return () => window.removeEventListener('resize', checkHeaderHeight);
  }, []);

  return (
    <>
      <Header />
      <main style={{ 
        minHeight: '100vh', 
        background: '#ffffff',
        paddingTop: `${headerHeight}px`,
        position: 'relative',
      }}>
        
        {/* 1. Hero Section with Gradient Overlay */}
        <section style={{ 
          position: 'relative', 
          width: '100%', 
          minHeight: '500px',
          display: 'flex',
          alignItems: 'center',
          backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80")', 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
          {/* Blue Glass Gradient Overlay from Image 1 */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(10, 50, 150, 0.9) 0%, rgba(20, 80, 200, 0.7) 100%)',
            zIndex: 1
          }}></div>

          <div className="container" style={{ position: 'relative', zIndex: 2, maxWidth: '1200px', margin: '0 auto', padding: '0 40px' }}>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ color: '#ffffff', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: '700', marginBottom: '20px', maxWidth: '800px' }}
            >
              Vous êtes une entreprise basée en dehors du territoire algérien ?
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', maxWidth: '600px', marginBottom: '40px', lineHeight: '1.5' }}
            >
              Développez votre activité et accédez à de nouvelles opportunités de croissance. MazadClick vous accompagne dans votre expansion sur le marché algérien.
            </motion.p>
            <button 
              onClick={() => router.push('/contact')}
              className="glass-button"
            >
              Contactez-nous
            </button>
          </div>
        </section>

        {/* 2. Why Use MazadClick? (Grid Layout from Image 1) */}
        <section style={{ padding: '80px 20px' }}>
          <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ color: '#003399', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '700', textAlign: 'center', marginBottom: '60px', maxWidth: '800px', margin: '0 auto 60px' }}>
              L'Algérie sans frontières : Propulsez vos ambitions sur l'échiquier global avec MazadClick
            </h2>

            <div className="features-grid">
              {[
                { 
                  title: "Conquérir les marchés mondiaux", 
                  img: "/assets/images/international01.png",
                  desc: "Déployez vos produits à l’international avec une visibilité structurée et crédible. Venez activer votre export."
                },
                { 
                  title: "Entreprendre au pays, simplement", 
                  img: "/assets/images/international02.png",
                  desc: "Accédez à des opportunités fiables et investissez à distance en toute confiance."
                },
                { 
                  title: "Créer des partenariats solides", 
                  img: "/assets/images/international03.png",
                  desc: "Trouvez des partenaires fiables et développez des relations B2B durables."
                },
                { 
                  title: "Sécuriser vos approvisionnements", 
                  img: "/assets/images/international04.png",
                  desc: "Accédez aux meilleures ressources et solutions pour booster votre activité."
                }
              ].map((item, idx) => (
                <div key={idx} className="feature-card">
                  <img src={item.img} alt={item.title} />
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. How to Launch (Layout from Image 2) */}
        <section style={{ padding: '60px 20px', background: '#fcfcfc' }}>
          <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h2 style={{ color: '#003399', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '700', textAlign: 'center', marginBottom: '80px', maxWidth: '800px', margin: '0 auto 80px' }}>
              Votre passerelle stratégique entre l'Algérie et le monde.
            </h2>
            
            <div style={{ display: 'flex', gap: '60px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <p style={{ color: '#444', fontSize: '15px', marginBottom: '40px', lineHeight: '1.6' }}>
                  <strong>Accélérez votre expansion à l'export</strong><br/><br/>
                  L’économie de demain se joue au-delà des frontières. MazadClick offre aux entreprises algériennes une vitrine structurée pour se positionner sur les marchés africains et européens, en les connectant à des partenaires fiables et en transformant leur potentiel export en opportunités concrètes.
                </p>
                <p style={{ color: '#444', fontSize: '15px', marginBottom: '40px', lineHeight: '1.6' }}>
                  <strong>Le point de liaison pour la diaspora et les investisseurs.</strong><br/><br/>
                  MazadClick simplifie l’investissement en Algérie en centralisant les opportunités et en sécurisant les mises en relation. Une solution claire et fiable pour connecter efficacement diaspora, investisseurs et porteurs de projets.
                </p>
                <p style={{ color: '#444', fontSize: '15px', marginBottom: '40px', lineHeight: '1.6' }}>
                  <strong>Une infrastructure pour des échanges sécurisés</strong><br/><br/>
                  MazadClick agit comme un tiers de confiance en structurant des échanges transparents et directs. Nous facilitons les partenariats import-export tout en réduisant les intermédiaires informels.
                </p>
              </div>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <img 
                  src="/assets/images/international05.png" 
                  alt="Strategic Bridge" 
                  style={{ width: '100%', borderRadius: '4px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 4. Contact Team (Light Blue Glass Section from Image 2) */}
        <section style={{ padding: '100px 20px' }}>
          <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className="contact-banner">
              <h2>Contactez-nous et découvrez de nouvelles opportunités.</h2>
              <p>Lorem ipsum dolor sit amet consectetur. Sed vestibulum mauris elit sagittis eu. Dui felis tristique consectetur sagittis faucibus non et fusce lacinia.</p>
              <button className="pill-button" onClick={() => router.push('/contact')}>
                Message
              </button>
            </div>
          </div>
        </section>

        <style jsx global>{`
          .glass-button {
            background: linear-gradient(90deg, #0a3296 0%, #3066e6 100%);
            color: white;
            border: 1px solid rgba(255,255,255,0.2);
            padding: 12px 40px;
            border-radius: 50px;
            font-weight: 600;
            cursor: pointer;
            transition: 0.3s;
          }
          .glass-button:hover {
            opacity: 0.9;
            transform: scale(1.02);
          }

          .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
          }

          .feature-card {
            text-align: center;
          }
          .feature-card img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            border-radius: 15px;
            margin-bottom: 20px;
          }
          .feature-card h3 {
            color: #003399;
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 15px;
          }
          .feature-card p {
            color: #777;
            font-size: 14px;
            line-height: 1.5;
          }

          .contact-banner {
            background: #e6f0ff;
            padding: 60px;
            border-radius: 0px;
            text-align: center;
          }
          .contact-banner h2 {
            color: #003399;
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 20px;
          }
          .contact-banner p {
            color: #003399;
            max-width: 600px;
            margin: 0 auto 30px;
            opacity: 0.8;
          }

          .pill-button {
            background: linear-gradient(90deg, #002680 0%, #2b65f0 100%);
            color: white;
            border: none;
            padding: 12px 60px;
            border-radius: 50px;
            font-weight: 600;
            cursor: pointer;
          }

          @media (max-width: 768px) {
            .contact-banner { padding: 40px 20px; }
          }
        `}</style>

      </main>
      <Footer />
      <DynamicScrollToTop colorSchema="gradient" />
    </>
  );
};

export default InternationalPage;