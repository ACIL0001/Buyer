"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import app, { DEV_SERVER_URL } from "@/config";
import { UserAPI, USER_TYPE } from "@/app/api/users";
import { motion, AnimatePresence } from "framer-motion";
import "../modern-styles.css";
import useAuth from '@/hooks/useAuth';
import { useTranslation } from "react-i18next";
import UserActivitiesSection from "@/components/profile/UserActivitiesSection";

// Helper for image URLs
const getImageUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('http')) {
         if (url.startsWith('http://localhost/')) {
             return url.replace('http://localhost/', 'http://localhost:3000/');
         }
         return url;
    }
    if (url.startsWith('/static')) {
        const baseURL = app.baseURL.endsWith('/') ? app.baseURL : `${app.baseURL}/`;
        return `${baseURL}${url.startsWith('/') ? url.slice(1) : url}`;
    }
    return url;
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const DEV_SERVER_REGEX = new RegExp(escapeRegExp(DEV_SERVER_URL), "g");

interface User {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  entreprise?: string;
  companyName?: string;
  avatar?: string | { url?: string; filename?: string; fullUrl?: string };
  photoURL?: string;
  coverPhotoURL?: string;
  type: USER_TYPE;
  role?: string;
  rating: number;
  rate?: number;
  joinDate: string;
  createdAt?: string;
  phone?: string;
  location?: string;
  description?: string;
  verificationStatus?: string;
  isVerified?: boolean;
  isCertified?: boolean;
  isRecommended?: boolean;
  secteur?: string | { _id: string; name: string };
  socialReason?: string;
  jobTitle?: string;
  entity?: string;
  wilaya?: string;
  bio?: string;
}

export default function PublicProfilePage() {
    const { t } = useTranslation();
    const router = useRouter();
    const params = useParams();
    const { initializeAuth } = useAuth();
    
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("activities");

    const userId = params?.id as string;

    // Fetch User Details
    const fetchUserDetails = useCallback(async () => {
        try {
            setIsLoading(true);
            const [userResponse, recommendedProfessionals, recommendedResellers] = await Promise.all([
                UserAPI.getUserById(userId),
                UserAPI.getRecommendedProfessionals().catch(() => ({ data: [] })),
                UserAPI.getRecommendedResellers().catch(() => ({ data: [] }))
            ]);

            const userData = userResponse?.data || userResponse;

            if (userData) {
                // Determine recommendation status
                const recProfIds = ((recommendedProfessionals as any)?.data || []).map((u: any) => u._id);
                const recResellerIds = ((recommendedResellers as any)?.data || []).map((u: any) => u._id);
                
                const hasRecommendedFromAPI = Boolean((userData as any).isRecommended);
                const isInRecommendedList = recProfIds.includes((userData as any)._id) || recResellerIds.includes((userData as any)._id);
                const isRecommended = hasRecommendedFromAPI || isInRecommendedList;

                setUser({
                    ...(userData as any),
                    rating: typeof (userData as any).rate === 'number' ? (userData as any).rate : ((userData as any).rating || 0),
                    joinDate: (userData as any).createdAt || new Date().toISOString(),
                    isRecommended,
                    type: (userData as any).type || (userData as any).accountType || USER_TYPE.CLIENT
                });
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Error fetching user details:", error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        initializeAuth();
        if (userId) {
            fetchUserDetails();
        }
    }, [userId, initializeAuth, fetchUserDetails]);

    // Get Avatar Src Logic from ProfilePage to match
    const getAvatarSrc = () => {
        if (!user) return '/assets/images/avatar.jpg';
        
        // Priority 1: photoURL
        if (user.photoURL && user.photoURL.trim() !== "") {
            const cleanUrl = getImageUrl(user.photoURL);
            if (cleanUrl && !cleanUrl.includes('mock-images')) return cleanUrl;
        }
        
        // Priority 2: avatar object
        if (user.avatar && typeof user.avatar === 'object') {
             if (user.avatar.fullUrl) return getImageUrl(user.avatar.fullUrl);
             if (user.avatar.url) return getImageUrl(user.avatar.url);
             if (user.avatar.filename) return getImageUrl(user.avatar.filename);
        }
        
        // Fallback
        return '/assets/images/avatar.jpg';
    };

    if (isLoading) {
        return (
             <div className="modern-profile-page" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="modern-spinner"></div>
             </div>
        );
    }

    if (!user) {
        return (
            <div className="modern-profile-page">
                <Header />
                 <div className="modern-profile-container" style={{ paddingTop: '100px', textAlign: 'center' }}>
                    <h2>User not found</h2>
                    <button className="modern-btn primary" onClick={() => router.push('/')}>Go Home</button>
                 </div>
                 <Footer />
            </div>
        );
    }

    const avatarSrc = getAvatarSrc();

    return (
        <div>
            <Header />
            <main className="modern-profile-page" style={{ paddingTop: '100px' }}>
                {/* Animated Background */}
                <div className="profile-background">
                    <div className="gradient-orb orb-1"></div>
                    <div className="gradient-orb orb-2"></div>
                    <div className="gradient-orb orb-3"></div>
                </div>

                <div className="modern-profile-container">
                    {/* Back Button */}
                    <div style={{ marginBottom: '1rem' }}>
                         <button 
                            onClick={() => router.back()}
                            style={{ 
                                background: 'transparent',
                                border: 'none',
                                color: '#4b5563',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 500
                            }}
                         >
                            <i className="bi bi-arrow-left"></i>
                            Back
                         </button>
                    </div>

                    {/* Cover Photo */}
                    <motion.div 
                        className="profile-cover-wrapper"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        style={{ marginBottom: '1rem', position: 'relative' }}
                    >
                        <div className="profile-cover-photo" style={{ 
                            height: '250px', 
                            width: '100%', 
                            borderRadius: '16px',
                            overflow: 'hidden',
                            position: 'relative',
                            backgroundColor: '#f3f4f6',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}>
                            {user.coverPhotoURL ? (
                                <img 
                                    src={getImageUrl(user.coverPhotoURL)}
                                    alt="Cover" 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                />
                            ) : (
                                <div style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    background: 'linear-gradient(135deg, #e0e7ff 0%, #fae8ff 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}></div>
                            )}
                        </div>

                        {/* Profile Info Bar */}
                        <div className="profile-info-bar" style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            padding: '0 20px',
                            marginTop: '-60px',
                            position: 'relative',
                            zIndex: 20,
                            flexWrap: 'wrap',
                            gap: '20px'
                        }}>
                            {/* Avatar */}
                            <div className="profile-avatar-wrapper" style={{ position: 'relative' }}>
                                <div style={{
                                    width: '140px',
                                    height: '140px',
                                    borderRadius: '50%',
                                    border: '4px solid #ffffff',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                    background: '#ffffff',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <img 
                                        src={avatarSrc} 
                                        alt={user.firstName}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        onError={(e) => {
                                            const target = e.currentTarget;
                                            target.src = '/assets/images/avatar.jpg';
                                        }}
                                    />
                                </div>
                                {/* Rating Badge */}
                                {user.rating > 0 && (
                                     <div style={{
                                        position: 'absolute',
                                        top: '0',
                                        right: '0',
                                        transform: 'translate(10%, -10%)',
                                        background: '#ffffff',
                                        color: '#d97706',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                        borderRadius: '50%',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px solid #fff',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        zIndex: 25
                                     }}>
                                         <span>{Math.round(user.rating * 10) / 10}</span>
                                     </div>
                                )}
                            </div>

                            {/* User Info Text */}
                            <div style={{ paddingBottom: '10px', flex: 1 }}>
                                <h1 style={{ 
                                    fontSize: '28px', 
                                    fontWeight: '800', 
                                    color: '#111827',
                                    margin: 0,
                                    lineHeight: 1.2,
                                    textShadow: '0 1px 2px rgba(255,255,255,1)'
                                }}>
                                    {user.socialReason || user.entreprise || user.companyName || `${user.firstName} ${user.lastName}`}
                                </h1>
                                
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '8px' }}>
                                    {/* Badges */}
                                    {user.type === USER_TYPE.PROFESSIONAL && (
                                        <span className="user-type-badge" style={{ padding: '4px 10px', fontSize: '12px' }}>
                                            <i className="bi bi-star-fill" style={{ fontSize: '10px' }}></i>
                                            <span>PRO</span>
                                        </span>
                                    )}
                                    {user.isVerified && (
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '4px 10px',
                                            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                            color: 'white',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: '600'
                                        }}>
                                            <i className="bi bi-check-circle-fill"></i>
                                            <span>VERIFIED</span>
                                        </div>
                                    )}
                                    {user.isRecommended && (
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '4px 10px',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: 'white',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: '600'
                                        }}>
                                            <i className="bi bi-star-fill"></i>
                                            <span>RECOMMENDED</span>
                                        </div>
                                    )}
                                </div>
                                
                                {user.bio && (
                                    <p style={{ marginTop: '0.5rem', color: '#4b5563', fontSize: '0.95rem', maxWidth: '600px' }}>
                                        {user.bio}
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Tabs Section */}
                    <div className="modern-tabs-section">
                        <div className="modern-tab-nav">
                             {[
                                { id: "activities", icon: "bi-activity", label: t("profile.activities") || "Activités" },
                                { id: "info", icon: "bi-person-circle", label: t("profile.personalInfo") || "Informations" },
                             ].map((tab) => (
                                <button
                                    key={tab.id}
                                    className={`modern-tab-btn ${activeTab === tab.id ? "active" : ""}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <i className={tab.icon}></i>
                                    <span>{tab.label}</span>
                                    {activeTab === tab.id && <div className="tab-indicator" />}
                                </button>
                             ))}
                        </div>

                        <div className="modern-tab-content">
                            <AnimatePresence mode="wait">
                                {activeTab === "activities" && (
                                    <motion.div
                                        key="activities"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <UserActivitiesSection userId={userId} />
                                    </motion.div>
                                )}

                                {activeTab === "info" && (
                                    <motion.div
                                        key="info"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="modern-section-card">
                                            <div className="modern-form-grid">
                                                <div className="modern-form-field">
                                                    <label>Full Name</label>
                                                    <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                                        {user.firstName} {user.lastName}
                                                    </div>
                                                </div>
                                                {user.email && (
                                                    <div className="modern-form-field">
                                                        <label>Email</label>
                                                         <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                                            {/* Obfuscate email if needed, or show if public profile allows */}
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                )}
                                                {user.phone && (
                                                    <div className="modern-form-field">
                                                        <label>Phone</label>
                                                         <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                                            {user.phone}
                                                        </div>
                                                    </div>
                                                )}
                                                {user.wilaya && (
                                                    <div className="modern-form-field">
                                                        <label>Wilaya</label>
                                                         <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                                            {user.wilaya}
                                                        </div>
                                                    </div>
                                                )}
                                                {user.location && (
                                                     <div className="modern-form-field">
                                                        <label>Location</label>
                                                         <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                                            {user.location}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {(user.socialReason || user.entreprise) && (
                                                     <div className="modern-form-field">
                                                        <label>Company / Social Reason</label>
                                                         <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                                            {user.socialReason || user.entreprise}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {user.secteur && (
                                                     <div className="modern-form-field">
                                                        <label>Sector</label>
                                                         <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                                            {typeof user.secteur === 'string' ? user.secteur : user.secteur.name}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="modern-form-field">
                                                    <label>Member Since</label>
                                                     <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                                        {new Date(user.joinDate).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}