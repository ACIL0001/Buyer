"use client"

import React, { useState, useEffect } from "react"
import Header from "@/components/header/Header"
import Footer from "@/components/footer/Footer"
import useAuth from "@/hooks/useAuth"
import { useSnackbar } from "notistack"
import { motion, AnimatePresence } from "framer-motion"
import { UserAPI } from "@/app/api/users"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { authStore } from "@/contexts/authStore"
import { useQueryClient } from "@tanstack/react-query" 
import "../profile/modern-styles.css" 

// Password field component
// Password field component
const PasswordField = ({ name, label, value, onChange, index }: {
    name: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    index: number;
}) => {
    const [isVisible, setIsVisible] = useState(false);
    
    return (
        <motion.div
            className="modern-form-field"
            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 + (index * 0.1) }}
        >
            <label htmlFor={name}>{label}</label>
            <div className="input-with-icon">
                <input
                    type={isVisible ? "text" : "password"}
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={`Enter ${label.toLowerCase()}`}
                />
                <div className="modern-input-icon">
                    <i className="bi bi-shield-lock-fill"></i>
                </div>
                <button 
                    type="button"
                    onClick={() => setIsVisible(!isVisible)}
                    className="password-toggle-btn"
                >
                    <i className={`bi ${isVisible ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`} />
                </button>
            </div>
        </motion.div>
    );
};

export default function SettingsPage() {
    const { t } = useTranslation();
    const auth = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const router = useRouter();
    const set = authStore((state: any) => state.set);
    const [isReady, setIsReady] = useState(false);
    const isLogged = !!auth.user;

    const [activeTab, setActiveTab] = useState("security");
    const [isPasswordChanging, setIsPasswordChanging] = useState(false);

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        setIsReady(true);
    }, []);

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };



    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            enqueueSnackbar(t("passwordsDoNotMatch"), { variant: "error" });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            enqueueSnackbar(t("passwordTooShort"), { variant: "error" });
            return;
        }

        setIsPasswordChanging(true);

        try {
            const response = await UserAPI.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            enqueueSnackbar(response.message || t("passwordChanged"), { variant: "success" });

            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });

        } catch (error: any) {
            if (error.response?.status === 401) {
                enqueueSnackbar(t("sessionExpired"), { variant: 'error' });
                set({ tokens: undefined, user: undefined });
                router.push("/auth/login");
            } else {
                const errorMessage = error.message || t("failedToUpdatePassword");
                enqueueSnackbar(errorMessage, { variant: "error" });
            }
        } finally {
            setIsPasswordChanging(false);
        }
    };

    if (!isReady) {
        return (
             <div style={{ paddingTop: '100px', minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                 <div className="modern-spinner"></div>
             </div>
        );
    }
    
    // Redirect if not logged in loaded
    if (isReady && !isLogged) {
        if (typeof window !== 'undefined') router.push("/auth/login");
        return null;
    }

    return (
        <div>
            <Header />
            <main className="modern-profile-page" style={{ paddingTop: '80px' }}>
                {/* Animated Background */}
                <div className="profile-background">
                    <div className="gradient-orb orb-1"></div>
                    <div className="gradient-orb orb-2"></div>
                    <div className="gradient-orb orb-3"></div>
                </div>

                <div className="modern-profile-container">
                    <h1 className="profile-page-title" style={{ marginBottom: '2rem' }}>
                        {t("settings.title") || "Paramètres"}
                    </h1>

                    <div className="modern-tabs-section">
                        <div className="modern-tab-nav">
                            {[
                                { id: "security", icon: "bi-shield-lock-fill", label: t("profile.security.title") || "Security" },
                            ].map((tab, index) => (
                                <motion.button
                                    key={tab.id}
                                    className={`modern-tab-btn ${activeTab === tab.id ? "active" : ""}`}
                                    onClick={() => setActiveTab(tab.id)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <i className={tab.icon}></i>
                                    <span>{tab.label}</span>
                                    {activeTab === tab.id && (
                                        <motion.div
                                            className="tab-indicator"
                                            layoutId="tab-indicator"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </motion.button>
                            ))}
                        </div>

                        <div className="modern-tab-content" style={{ marginTop: '2rem' }}>
                            <AnimatePresence mode="wait">

                                
                                {activeTab === "security" && (
                                    <motion.div
                                        key="security"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <div className="modern-section-card">
                                            <div className="section-header">
                                                <div className="header-content">
                                                    <div className="header-icon">
                                                        <i className="bi bi-shield-lock-fill"></i>
                                                    </div>
                                                    <div className="header-text">
                                                        <h2>{t("profile.security.title") || "Security"}</h2>
                                                        <p>{t("profile.security.subtitle") || "Update your password and security settings"}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <form onSubmit={handlePasswordSubmit} className="modern-profile-form">
                                                <div className="modern-form-grid">
                                                    <PasswordField
                                                        name="currentPassword"
                                                        label={t("profile.currentPassword") || "Current password"}
                                                        value={passwordData.currentPassword}
                                                        onChange={handlePasswordChange}
                                                        index={0}
                                                    />
                                                    <PasswordField
                                                        name="newPassword"
                                                        label={t("profile.newPassword") || "New password"}
                                                        value={passwordData.newPassword}
                                                        onChange={handlePasswordChange}
                                                        index={1}
                                                    />
                                                    <PasswordField
                                                        name="confirmPassword"
                                                        label={t("profile.confirmPassword") || "Confirm password"}
                                                        value={passwordData.confirmPassword}
                                                        onChange={handlePasswordChange}
                                                        index={2}
                                                    />
                                                </div>

                                                <div className="modern-actions">
                                                    <button
                                                        type="submit"
                                                        disabled={isPasswordChanging}
                                                        className="modern-btn primary"
                                                    >
                                                        {isPasswordChanging ? (
                                                            <>
                                                                <div className="modern-spinner-sm"></div>
                                                                <span>Updating...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="bi bi-shield-check"></i>
                                                                <span>Update password</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </form>
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
