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
        isProfileVisible: true,
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
                isProfileVisible: (auth.user as any).isProfileVisible !== undefined ? (auth.user as any).isProfileVisible : true,
            });
        }
    }, [auth.user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const target = e.target as HTMLInputElement;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;

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
                                { id: "personal-info", icon: "bi-person-circle", label: t("profile.personalInfo.title") || "Personal Information" },
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
                                                        <h2>{t("profile.personalInfo.title") || "Personal Information"}</h2>
                                                        <p>{t("profile.personalInfo.subtitle") || "Manage your personal information and profile details"}</p>
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
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                                    <div className="modern-form-field">
                                                        <label htmlFor="firstName">{t("profile.personalInfo.firstName") || "Prénom"}</label>
                                                        <div className="input-with-icon">
                                                            <i className="bi bi-person"></i>
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
                                                    </div>

                                                    <div className="modern-form-field">
                                                        <label htmlFor="lastName">{t("profile.lastName") || "Nom"}</label>
                                                        <div className="input-with-icon">
                                                            <i className="bi bi-person"></i>
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
                                                    </div>

                                                    <div className="modern-form-field">
                                                        <label htmlFor="wilaya">{t("profile.wilaya") || "Wilaya"}</label>
                                                        <div className="input-with-icon">
                                                            <i className="bi bi-geo-alt"></i>
                                                            <select
                                                                id="wilaya"
                                                                name="wilaya"
                                                                value={formData.wilaya}
                                                                onChange={handleInputChange}
                                                                disabled={!isEditing}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    paddingLeft: '45px',
                                                                    borderRadius: '12px',
                                                                    border: '1px solid #e2e8f0',
                                                                    backgroundColor: isEditing ? '#ffffff' : '#f8fafc',
                                                                    color: '#1e293b',
                                                                    fontSize: '14px',
                                                                    outline: 'none',
                                                                    height: '48px',
                                                                    appearance: 'none',
                                                                    cursor: isEditing ? 'pointer' : 'default',
                                                                    transition: 'all 0.2s ease'
                                                                }}
                                                            >
                                                                <option value="">Sélectionner une Wilaya</option>
                                                                {WILAYAS.map((w, index) => (
                                                                    <option key={index} value={w}>{w}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="modern-form-field">
                                                        <label htmlFor="companyName">{t("profile.personalInfo.companyName") || "Nom de l'entreprise"}</label>
                                                        <div className="input-with-icon">
                                                            <i className="bi bi-building"></i>
                                                            <input
                                                                type="text"
                                                                id="companyName"
                                                                name="companyName"
                                                                value={formData.companyName}
                                                                onChange={handleInputChange}
                                                                disabled={!isEditing}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="modern-form-field">
                                                        <label htmlFor="jobTitle">{t("profile.personalInfo.jobTitle") || "Poste actuel"}</label>
                                                        <div className="input-with-icon">
                                                            <i className="bi bi-person-workspace"></i>
                                                            <input
                                                                type="text"
                                                                id="jobTitle"
                                                                name="jobTitle"
                                                                value={formData.jobTitle}
                                                                onChange={handleInputChange}
                                                                disabled={!isEditing}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="modern-form-field">
                                                        <label htmlFor="activitySector">{t("profile.personalInfo.secteur") || "Secteur d'activité"}</label>
                                                        <div className="input-with-icon">
                                                            <i className="bi bi-activity"></i>
                                                            <input
                                                                type="text"
                                                                id="activitySector"
                                                                name="activitySector"
                                                                value={formData.activitySector}
                                                                onChange={handleInputChange}
                                                                disabled={!isEditing}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="modern-form-field">
                                                        <label htmlFor="phone">{t("profile.personalInfo.phone") || "Téléphone"}</label>
                                                        <div className="input-with-icon">
                                                            <i className="bi bi-telephone"></i>
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

                                                    <div className="modern-form-field" style={{ gridColumn: '1 / -1' }}>
                                                        <div style={{ 
                                                            display: 'flex', 
                                                            justifyContent: 'space-between', 
                                                            alignItems: 'center',
                                                            background: '#f8fafc',
                                                            padding: '1rem',
                                                            borderRadius: '12px',
                                                            border: '1px solid #e2e8f0'
                                                        }}>
                                                            <div>
                                                                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>
                                                                    {t("profile.personalInfo.isProfileVisible") || "Profil public"}
                                                                </h4>
                                                                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                                                                    {t("profile.personalInfo.isProfileVisibleDesc") || "Rendre votre profil visible"}
                                                                </p>
                                                            </div>
                                                            <div style={{ position: 'relative', width: '46px', height: '26px' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    id="isProfileVisible"
                                                                    name="isProfileVisible"
                                                                    checked={!!formData.isProfileVisible}
                                                                    onChange={handleInputChange}
                                                                    disabled={!isEditing}
                                                                    style={{ opacity: 0, width: 0, height: 0 }}
                                                                />
                                                                <label 
                                                                    htmlFor="isProfileVisible"
                                                                    style={{
                                                                        position: 'absolute',
                                                                        cursor: isEditing ? 'pointer' : 'not-allowed',
                                                                        top: 0, left: 0, right: 0, bottom: 0,
                                                                        backgroundColor: formData.isProfileVisible ? '#3b82f6' : '#cbd5e1',
                                                                        transition: '.3s',
                                                                        borderRadius: '34px',
                                                                        opacity: isEditing ? 1 : 0.7
                                                                    }}
                                                                >
                                                                    <span style={{
                                                                        display: 'block',
                                                                        position: 'absolute',
                                                                        height: '20px',
                                                                        width: '20px',
                                                                        left: formData.isProfileVisible ? '23px' : '3px',
                                                                        top: '3px',
                                                                        backgroundColor: 'white',
                                                                        transition: '.3s',
                                                                        borderRadius: '50%',
                                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                                    }}></span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <style jsx>{`
                                                    .input-with-icon {
                                                        position: relative;
                                                        width: 100%;
                                                    }
                                                    .input-with-icon i {
                                                        position: absolute;
                                                        left: 14px;
                                                        top: 50%;
                                                        transform: translateY(-50%);
                                                        color: #94a3b8;
                                                        font-size: 1.1rem;
                                                        pointer-events: none;
                                                        transition: color 0.2s;
                                                    }
                                                    .input-with-icon input:focus + i,
                                                    .input-with-icon input:not(:placeholder-shown) + i {
                                                        color: #3b82f6;
                                                    }
                                                    .modern-form-field input {
                                                        width: 100%;
                                                        padding: 12px 16px 12px 42px;
                                                        border-radius: 12px;
                                                        border: 1px solid #e2e8f0;
                                                        background-color: ${isEditing ? '#ffffff' : '#f8fafc'};
                                                        color: #1e293b;
                                                        font-size: 14px;
                                                        outline: none;
                                                        transition: all 0.2s ease;
                                                    }
                                                    .modern-form-field input:focus {
                                                        border-color: #3b82f6;
                                                        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                                                    }
                                                    .modern-form-field input:disabled {
                                                        color: #64748b;
                                                        cursor: default;
                                                    }
                                                    .modern-form-field label {
                                                        font-size: 0.9rem;
                                                        font-weight: 500;
                                                        color: #475569;
                                                        margin-bottom: 0.5rem;
                                                        display: block;
                                                    }
                                                `}</style>

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
