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
import { normalizeImageUrl } from "@/utils/url";
import { formatUserName } from "@/utils/user";

// Helper for image URLs
// Helper for image URLs
const getImageUrl = normalizeImageUrl;

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
  coverPhoto?: string | { url?: string; filename?: string; fullUrl?: string };
  type: USER_TYPE;
  role?: string;
  rating: number;
  rate?: number;
  joinDate: string;
  createdAt?: string;
  phone?: string;
  contactNumber?: string;
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
  isProfileVisible?: boolean;
}

export default function PublicProfilePage() {
    const { t } = useTranslation();
    const router = useRouter();
    const params = useParams();
    const { user: currentUser, initializeAuth } = useAuth();
    
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

    const getCoverPhotoSrc = () => {
        if (!user) return undefined;

        // Priority 1: coverPhotoURL (string)
        if (user.coverPhotoURL && user.coverPhotoURL.trim() !== "") {
            const cleanUrl = getImageUrl(user.coverPhotoURL);
             if (cleanUrl) return cleanUrl; 
        }

        // Priority 2: coverPhoto (object)
        if (user.coverPhoto && typeof user.coverPhoto === 'object') {
             if (user.coverPhoto.fullUrl) return getImageUrl(user.coverPhoto.fullUrl);
             if (user.coverPhoto.url) return getImageUrl(user.coverPhoto.url);
        }
        
        return undefined;
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
    
    // Check if profile should be visible (visible if isProfileVisible is true OR if current user is the owner)
    // Default to true if isProfileVisible is undefined to maintain backward compatibility
    // But based on user request, if they chose "invisible", it should be invisible.
    // If undefined, we can assume public or check requirements. Assuming public for now.
    const isOwner = currentUser && currentUser._id === userId;
    const isProfileVisible = user.isProfileVisible !== false; // Default to true if undefined
    const canViewInfo = isProfileVisible || isOwner;

    return (
        <div>
            <Header />
            <main className="figma-profile-page" style={{ paddingTop: '30px' }}>
                <div className="figma-profile-container">
                    {/* Back Button */}
                    <div style={{ marginBottom: '1.5rem' }}>
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
                            {t("common.back") || "Retour"}
                         </button>
                    </div>

                    <motion.div 
                        className="figma-profile-hero"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        {/* Combined Cover and Avatar Div */}
                        <div className="figma-hero-header" style={{ marginBottom: '40px' }}>
                            <div className="figma-cover-dashed">
                                {getCoverPhotoSrc() ? (
                                    <img 
                                        src={getCoverPhotoSrc()} 
                                        alt="Cover" 
                                        className="figma-cover-img"
                                    />
                                ) : (
                                    <div className="figma-cover-placeholder">
                                        <i className="bi bi-image" style={{ marginRight: '8px', fontSize: '20px' }}></i>
                                        <span>Photo de couverture</span>
                                    </div>
                                )}
                            </div>

                            <div className="figma-avatar-container">
                                <div className="figma-avatar-circle">
                                    <img src={avatarSrc} alt="Avatar" className="figma-avatar-img" onError={(e) => {
                                        const target = e.currentTarget as HTMLImageElement;
                                        if (!target.src.includes('avatar.jpg')) target.src = '/assets/images/avatar.jpg';
                                    }} />
                                </div>
                                <div className="figma-avatar-badges">
                                    {user.isVerified && <div className="figma-badge top-left"><i className="bi bi-check-circle-fill"></i></div>}
                                    {user.isRecommended && <div className="figma-badge top-right"><i className="bi bi-stars"></i></div>}
                                    {user.isCertified && <div className="figma-badge bottom-left"><i className="bi bi-award-fill"></i></div>}
                                    <div className="figma-badge bottom-right"><i className="bi bi-shield-fill-check"></i></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <div className="figma-tab-content" style={{ marginTop: '20px' }}>
                        <AnimatePresence mode="wait">
                            <motion.div 
                                key="info" 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0, y: -10 }} 
                                transition={{ duration: 0.3 }}
                            >
                                    <div className="figma-card figma-card-personal" style={{ marginBottom: '24px' }}>
                                        <div className="figma-card-header">
                                            <div className="figma-card-title-box">
                                                <h3 className="figma-card-title">Informations personnelles</h3>
                                                <p className="figma-card-description">Détails du profil de l'utilisateur</p>
                                            </div>
                                        </div>
                                        
                                        {(user.companyName || user.entreprise || user.socialReason) ? (
                                            <div className="figma-input-field" style={{ width: '100%' }}>
                                                <label className="figma-input-label">Nom de l'entreprise</label>
                                                <div className="figma-form-field readonly">
                                                    <input type="text" value={user.companyName || user.entreprise || user.socialReason || ""} disabled />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="figma-form-row">
                                                <div className="figma-input-field">
                                                    <label className="figma-input-label">Nom</label>
                                                    <div className="figma-form-field readonly">
                                                        <input type="text" value={user.lastName || ""} disabled />
                                                    </div>
                                                </div>
                                                <div className="figma-input-field">
                                                    <label className="figma-input-label">Prénom</label>
                                                    <div className="figma-form-field readonly">
                                                        <input type="text" value={user.firstName || ""} disabled />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                <div className="figma-card figma-card-additional">
                                    <div className="figma-card-header">
                                        <div className="figma-card-title-box">
                                            <h3 className="figma-card-title">Details supplementaires</h3>
                                        </div>
                                    </div>
                                    
                                    <div className="figma-form-row">
                                        <div className="figma-input-field">
                                            <label className="figma-input-label">Pays / Wilaya</label>
                                            <div className="figma-form-field readonly">
                                                <input type="text" value={user.wilaya || ""} disabled />
                                            </div>
                                        </div>
                                        <div className="figma-input-field">
                                            <label className="figma-input-label">Addresse / Secteur</label>
                                            <div className="figma-form-field readonly">
                                                <input type="text" value={typeof user.secteur === 'string' ? user.secteur : (user.secteur as any)?.name || ""} disabled />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

