"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/FooterWithErrorBoundary';
import { motion } from 'framer-motion';
import DynamicScrollToTop from "@/components/common/DynamicScrollToTop";

export default function ContactPage() {
    const [headerHeight, setHeaderHeight] = useState(104);
    const primaryColor = '#002896';
    const cardBgColor = '#f4f6f9';
    const textGrey = '#757575';

    useEffect(() => {
        const checkHeaderHeight = () => {
            const width = window.innerWidth;
            let calculatedHeight = width <= 375 ? 60 : width <= 1024 ? 68 : 104;
            setHeaderHeight(calculatedHeight);
        };
        checkHeaderHeight();
        window.addEventListener('resize', checkHeaderHeight);
        return () => window.removeEventListener('resize', checkHeaderHeight);
    }, []);

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@700&display=swap" rel="stylesheet" />
            <Header />
            <main style={{ 
                minHeight: '100vh', 
                background: 'linear-gradient(135deg, #ffffff 0%, #f4f6f9 100%)',
                paddingTop: `${headerHeight + 40}px`,
                paddingBottom: '120px',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: '"DM Sans", sans-serif'
            }}>
                {/* Decorative background elements for glass effect */}

                <div className="container mx-auto" style={{ width: '100%', maxWidth: '1440px', padding: '0 clamp(16px, 4vw, 40px)', position: 'relative', zIndex: 1 }}>

                    {/* Page Header */}
                    <div style={{ marginBottom: '10px' }}>
                        <h1 style={{ color: primaryColor, fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: '700', marginBottom: '16px', letterSpacing: '-0.5px' }}>
                            Une question ? Échangeons ensemble.
                        </h1>
                        <p style={{ color: textGrey, fontSize: 'clamp(0.875rem, 1.4vw, 0.95rem)', maxWidth: '440px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                            Que vous soyez un acheteur en quête d'opportunités ou un professionnel souhaitant vendre, notre équipe dédiée vous accompagne dans chaque étape.
                        </p>
                    </div>

                    {/* Content Section - Stacks on mobile/tablet, side-by-side on lg+ */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(20px, 3vw, 40px)', alignItems: 'flex-start', justifyContent: 'space-between' }}>

                        {/* Left Side - Contact Form Card */}
                        <div style={{ width: '100%', maxWidth: '652px', flex: '1 1 320px', marginTop: 'clamp(16px, 3vw, 30px)' }}>
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6 }}
                                style={{
                                    background: 'linear-gradient(127.45deg, rgba(230, 230, 230, 0.7) 2.15%, rgba(195, 201, 215, 0.14) 63.05%)',
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                    borderRadius: '24px',
                                    padding: 'clamp(24px, 4vw, 50px) clamp(20px, 4vw, 45px)',
                                    boxShadow: '0px 20px 40px 0px #0000001A, 0px 4px 4px 0px #00000040',
                                    width: '100%',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    border: '1px solid rgba(255, 255, 255, 0.3)'
                                }}
                            >
                                <form>
                                    {/* Line 1: Nom & Email */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 'clamp(16px, 3vw, 40px)', marginBottom: 'clamp(20px, 4vw, 45px)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <label style={{ color: primaryColor, fontWeight: '700', fontSize: '15px' }}>Nom</label>
                                            <input type="text" placeholder="Anis M" style={{ width: '100%', padding: '20px 25px', borderRadius: '30px', border: 'none', background: 'white', outline: 'none', color: '#444', fontSize: '15px' }} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <label style={{ color: primaryColor, fontWeight: '700', fontSize: '15px' }}>Email</label>
                                            <input type="email" placeholder="example@email.com" style={{ width: '100%', padding: '20px 25px', borderRadius: '30px', border: 'none', background: 'white', outline: 'none', color: '#444', fontSize: '15px' }} />
                                        </div>
                                    </div>

                                    {/* Line 2: Numéro & Entreprise */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 'clamp(16px, 3vw, 40px)', marginBottom: 'clamp(20px, 4vw, 45px)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <label style={{ color: primaryColor, fontWeight: '700', fontSize: '15px' }}>Numéro</label>
                                            <input type="text" placeholder="xxxx-xxx-xxx" style={{ width: '100%', padding: '20px 25px', borderRadius: '30px', border: 'none', background: 'white', outline: 'none', color: '#444', fontSize: '15px' }} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <label style={{ color: primaryColor, fontWeight: '700', fontSize: '15px' }}>Entreprise</label>
                                            <input type="text" placeholder="Lorem" style={{ width: '100%', padding: '20px 25px', borderRadius: '30px', border: 'none', background: 'white', outline: 'none', color: '#444', fontSize: '15px' }} />
                                        </div>
                                    </div>

                                    {/* Motif */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '45px' }}>
                                        <label style={{ color: primaryColor, fontWeight: '700', fontSize: '15px' }}>Motif</label>
                                        <div style={{ position: 'relative' }}>
                                            <select style={{ width: '100%', padding: '20px 25px', borderRadius: '30px', border: 'none', background: 'white', outline: 'none', color: '#999', fontSize: '15px', appearance: 'none' }}>
                                                <option value="">Selectionner une option</option>
                                                <option value="info">Information</option>
                                                <option value="support">Support</option>
                                                <option value="partnership">Partenariat</option>
                                            </select>
                                            <div style={{ position: 'absolute', right: '25px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '55px' }}>
                                        <label style={{ color: primaryColor, fontWeight: '700', fontSize: '15px' }}>Message</label>
                                        <textarea placeholder="votre message" rows={6} style={{ width: '100%', padding: '25px 25px', borderRadius: '30px', border: 'none', background: 'white', outline: 'none', color: '#444', fontSize: '15px', resize: 'none' }}></textarea>
                                    </div>

                                    {/* Submit */}
                                    <div>
                                        <button type="button" style={{ background: primaryColor, color: 'white', padding: '18px 55px', borderRadius: '50px', fontWeight: '700', fontSize: '16px', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }} className="hover:scale-105 hover:shadow-2xl">
                                            Soumettre mon message
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>

                        {/* Right Side - Info Card */}
                        <div style={{ width: '100%', maxWidth: '602px', flex: '1 1 320px', marginTop: 0 }}>
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                                style={{
                                    background: 'linear-gradient(127.45deg, rgba(230, 230, 230, 0.7) 2.15%, rgba(195, 201, 215, 0.14) 63.05%)',
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                    borderRadius: '24px',
                                    padding: 'clamp(28px, 5vw, 60px) clamp(20px, 4vw, 45px)',
                                    boxShadow: '0px 20px 40px 0px #0000001A, 0px 4px 4px 0px #00000040',
                                    width: '100%',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    border: '1px solid rgba(255, 255, 255, 0.3)'
                                }}
                            >
                                <h2 style={{ color: primaryColor, fontSize: 'clamp(1.75rem, 4vw, 2.4rem)', fontWeight: '700', marginBottom: 'clamp(28px, 5vw, 60px)', letterSpacing: '-1px' }}>
                                    Restons en contact
                                </h2>

                                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                    {/* Address */}
                                    <div style={{ marginBottom: 'clamp(28px, 5vw, 60px)' }}>
                                        <p style={{ color: textGrey, fontSize: '13px', fontWeight: '800', letterSpacing: '1px', marginBottom: '25px', textTransform: 'uppercase' }}>
                                            NOTRE ADRESSE
                                        </p>
                                        <div style={{ color: primaryColor, fontSize: 'clamp(1.25rem, 2.5vw, 1.875rem)', fontWeight: '700', lineHeight: '1.2' }}>
                                            58 rue des orangers<br/>Alger .
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div style={{ marginBottom: 'clamp(28px, 5vw, 60px)' }}>
                                        <p style={{ color: textGrey, fontSize: '13px', fontWeight: '800', letterSpacing: '1px', marginBottom: '25px', textTransform: 'uppercase' }}>
                                            APPELEZ-NOUS
                                        </p>
                                        <div style={{ color: primaryColor, fontSize: 'clamp(1.25rem, 2.5vw, 1.875rem)', fontWeight: '700' }}>
                                            034 -xx-xx-xx
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <p style={{ color: textGrey, fontSize: '13px', fontWeight: '800', letterSpacing: '1px', marginBottom: '25px', textTransform: 'uppercase' }}>
                                            SERVICE CLIENT
                                        </p>
                                        <div style={{ color: primaryColor, fontSize: 'clamp(1.125rem, 2.2vw, 1.75rem)', fontWeight: '700', wordBreak: 'break-all' }}>
                                            contact@mazadclick.com
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            <DynamicScrollToTop colorSchema="gradient" />
        </>
    );
}
