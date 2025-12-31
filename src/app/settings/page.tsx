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
import { WILAYAS } from "@/constants/wilayas"
import "../profile/modern-styles.css" 

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
            <div style={{ position: 'relative', width: '100%' }}>
                <input
                    type={isVisible ? "text" : "password"}
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={`Enter ${label.toLowerCase()}`}
                    style={{ 
                        paddingRight: '40px',
                        width: '100%',
                        boxSizing: 'border-box'
                    }}
                />
                <button 
                    type="button"
                    onClick={() => setIsVisible(!isVisible)}
                    style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        cursor: 'pointer',
                        color: '#9ca3af',
                        fontSize: '1rem',
                        background: 'none',
                        border: 'none',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
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

    const [activeTab, setActiveTab] = useState("personal-info");
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordChanging, setIsPasswordChanging] = useState(false);

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        wilaya: "",
        activitySector: "",
        companyName: "",
        jobTitle: "",
    });

    useEffect(() => {
        setIsReady(true);
    }, []);

    useEffect(() => {
        if (auth.user) {
            setFormData({
                firstName: auth.user.firstName || "",
                lastName: auth.user.lastName || "",
                email: auth.user.email || "",
                phone: auth.user.phone || "",
                wilaya: auth.user.wilaya || "",
                activitySector: (auth.user as any).activitySector || (auth.user as any).secteur || "",
                companyName: (auth.user as any).companyName || (auth.user as any).socialReason || "",
                jobTitle: auth.user.jobTitle || "",
            });
        }
    }, [auth.user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const updatePayload = { ...formData };
            const updatedUser = await UserAPI.updateProfile(updatePayload);
            
            enqueueSnackbar(t("profileUpdated") || "Profile updated successfully", { variant: "success" });
            setIsEditing(false);

            if (auth.user) {
                const mergedUser = { ...auth.user, ...updatedUser };
                set({ user: mergedUser, tokens: auth.tokens });
            }
        } catch (error: any) {
            console.error('Error updating profile:', error);
            const errorMessage = error.response?.data?.message || t("updateFailed") || "Failed to update profile";
            enqueueSnackbar(errorMessage, { variant: "error" });
        } finally {
            setIsLoading(false);
        }
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
            <main className="modern-profile-page" style={{ paddingTop: '100px', minHeight: '100vh', background: '#f8fafc' }}>
                <div className="modern-profile-container">
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', color: '#1e293b' }}>
                        {t("settings.title") || "Paramètres"}
                    </h1>

                    <div className="modern-tabs-section">
                        <div className="modern-tab-nav">
                             {[
                                { id: "personal-info", icon: "bi-person-circle", label: t("profile.tabs.personalInfo") || "Personal Information" },
                                { id: "security", icon: "bi-shield-lock-fill", label: t("profile.tabs.security") || "Security" },
                                { id: "notifications", icon: "bi-bell-fill", label: t("profile.tabs.notifications") || "Notifications" },
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
                                {activeTab === "personal-info" && (
                                    <motion.div
                                        key="personal-info"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <div className="modern-section-card">
                                            <div className="section-header">
                                                <div className="header-content">
                                                    <div className="header-icon">
                                                        <i className="bi bi-person-circle"></i>
                                                    </div>
                                                    <div className="header-text">
                                                        <h2>{t("profile.personalInfo") || "Personal info"}</h2>
                                                        <p>{t("profile.personalInfoDesc") || "Manage your personal information and profile details"}</p>
                                                    </div>
                                                </div>
                                                <motion.button
                                                    className={`modern-edit-button ${isEditing ? "editing" : ""}`}
                                                    onClick={() => setIsEditing(!isEditing)}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <i className={`bi ${isEditing ? 'bi-x-circle' : 'bi-pencil-square'}`} />
                                                    <span>{isEditing ? t("common.cancel") : t("common.edit")}</span>
                                                </motion.button>
                                            </div>

                                            <form onSubmit={handleSubmit} className="modern-profile-form">
                                                <div className="modern-form-grid">
                                                    <div className="modern-form-field">
                                                        <label htmlFor="firstName">{t("profile.firstName") || "First name"}</label>
                                                        <input
                                                            type="text"
                                                            id="firstName"
                                                            name="firstName"
                                                            value={formData.firstName}
                                                            onChange={handleInputChange}
                                                            disabled={!isEditing}
                                                            required
                                                        />
                                                    </div>

                                                    <div className="modern-form-field">
                                                        <label htmlFor="lastName">{t("profile.lastName") || "Last name"}</label>
                                                        <input
                                                            type="text"
                                                            id="lastName"
                                                            name="lastName"
                                                            value={formData.lastName}
                                                            onChange={handleInputChange}
                                                            disabled={!isEditing}
                                                            required
                                                        />
                                                    </div>

                                                    <div className="modern-form-field">
                                                        <label htmlFor="wilaya">{t("profile.wilaya") || "Wilaya"}</label>
                                                        <select
                                                            id="wilaya"
                                                            name="wilaya"
                                                            value={formData.wilaya}
                                                            onChange={handleInputChange}
                                                            disabled={!isEditing}
                                                            style={{
                                                                width: '100%',
                                                                padding: '12px 16px',
                                                                borderRadius: '12px',
                                                                border: '1px solid #e5e7eb',
                                                                backgroundColor: isEditing ? '#ffffff' : '#f9fafb',
                                                                color: '#1f2937',
                                                                fontSize: '14px',
                                                                outline: 'none',
                                                                height: '48px'
                                                            }}
                                                        >
                                                            <option value="">Select Wilaya</option>
                                                            {WILAYAS.map((w, index) => (
                                                                <option key={index} value={w}>{w}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="modern-form-field">
                                                        <label htmlFor="companyName">Nom d'entreprise</label>
                                                        <input
                                                            type="text"
                                                            id="companyName"
                                                            name="companyName"
                                                            value={formData.companyName}
                                                            onChange={handleInputChange}
                                                            disabled={!isEditing}
                                                        />
                                                    </div>

                                                    <div className="modern-form-field">
                                                        <label htmlFor="jobTitle">{t("profile.jobTitle") || "Job Title"}</label>
                                                        <input
                                                            type="text"
                                                            id="jobTitle"
                                                            name="jobTitle"
                                                            value={formData.jobTitle}
                                                            onChange={handleInputChange}
                                                            disabled={!isEditing}
                                                        />
                                                    </div>

                                                    <div className="modern-form-field">
                                                        <label htmlFor="activitySector">Secteur d'activité</label>
                                                        <input
                                                            type="text"
                                                            id="activitySector"
                                                            name="activitySector"
                                                            value={formData.activitySector}
                                                            onChange={handleInputChange}
                                                            disabled={!isEditing}
                                                        />
                                                    </div>

                                                    <div className="modern-form-field">
                                                        <label htmlFor="phone">{t("profile.phone") || "Phone"}</label>
                                                        <input
                                                            type="tel"
                                                            id="phone"
                                                            name="phone"
                                                            value={formData.phone}
                                                            onChange={handleInputChange}
                                                            disabled={!isEditing}
                                                        />
                                                    </div>
                                                </div>

                                                {isEditing && (
                                                    <div className="modern-actions">
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsEditing(false)}
                                                            className="modern-btn secondary"
                                                        >
                                                            <i className="bi bi-x-circle"></i>
                                                            <span>{t("common.cancel")}</span>
                                                        </button>

                                                        <button
                                                            type="submit"
                                                            disabled={isLoading}
                                                            className="modern-btn primary"
                                                        >
                                                            {isLoading ? (
                                                                <>
                                                                    <div className="modern-spinner-sm"></div>
                                                                    <span>{t("profile.saving") || "Saving..."}</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <i className="bi bi-check-circle"></i>
                                                                    <span>{t("profile.saveChanges") || "Save changes"}</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                            </form>
                                        </div>
                                    </motion.div>
                                )}
                                
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
                                                        <h2>Security</h2>
                                                        <p>Update your password and security settings</p>
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

                                {activeTab === "notifications" && (
                                    <motion.div
                                        key="notifications"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <div className="modern-section-card">
                                            <div className="section-header">
                                                <div className="header-content">
                                                    <div className="header-icon">
                                                        <i className="bi bi-bell-fill"></i>
                                                    </div>
                                                    <div className="header-text">
                                                        <h2 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Notifications</h2>
                                                        <p style={{ fontSize: '0.75rem' }}>Manage your notification preferences</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="modern-notifications-grid">
                                                {[
                                                    {
                                                        icon: "bi-envelope-heart",
                                                        title: "Email notifications",
                                                        desc: "Receive email notifications",
                                                        color: "primary",
                                                        gradient: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)"
                                                    },
                                                    {
                                                        icon: "bi-bell-fill",
                                                        title: "New auction alerts",
                                                        desc: "Receive alerts for new auctions",
                                                        color: "success",
                                                        gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                                                    },
                                                    {
                                                        icon: "bi-heart-pulse",
                                                        title: "Bid updates",
                                                        desc: "Receive updates about bids",
                                                        color: "warning",
                                                        gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                                                    }
                                                ].map((notification, index) => (
                                                    <motion.div
                                                        key={notification.title}
                                                        className="modern-notification-card"
                                                        initial={{ opacity: 0, y: 30 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        whileHover={{ scale: 1.02 }}
                                                    >
                                                        <div className="notification-card-background">
                                                            <div className="card-gradient" style={{ background: notification.gradient }}></div>
                                                        </div>

                                                        <div className="notification-content">
                                                            <div className={`notification-icon ${notification.color}`}>
                                                                <i className={notification.icon} />
                                                            </div>

                                                            <div className="notification-text">
                                                                <h3>{notification.title}</h3>
                                                                <p>{notification.desc}</p>
                                                            </div>
                                                        </div>

                                                        <div className="modern-switch-container">
                                                            <label className="modern-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    defaultChecked
                                                                    className="switch-input"
                                                                />
                                                                <span className="switch-slider">
                                                                    <span className="switch-thumb" />
                                                                </span>
                                                            </label>
                                                        </div>
                                                    </motion.div>
                                                ))}
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
