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
import { CategoryAPI } from "@/services/category"
import "../profile/modern-styles.css"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { IdentityAPI } from "@/app/api/identity"
import { normalizeImageUrl } from "@/utils/url" 

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
    const [categories, setCategories] = useState<any[]>([]);

    // Documents State
    const queryClient = useQueryClient();
    const [activeUpgradeSection, setActiveUpgradeSection] = useState<'verified' | 'certified' | null>('verified');
    const [isUploadingDocument, setIsUploadingDocument] = useState<string | null>(null);
    const [uploadingFile, setUploadingFile] = useState<File | null>(null);
    const [isSubmittingIdentity, setIsSubmittingIdentity] = useState(false);

    // Identity Query
    const { data: identity, isLoading: isLoadingIdentity } = useQuery({
        queryKey: ['identity'],
        queryFn: async () => {
            const response = await IdentityAPI.getMyIdentity();
            return response.data as any;
        },
        retry: 1
    });

    const isLoadingDocuments = isLoadingIdentity;

     // Document lists
    const requiredDocuments = [
        { key: 'registreCommerceCarteAuto', label: t('profile.documents.registreCommerce') || 'Registre de Commerce / Carte Artisan', required: true, description: 'Format PDF ou Image' },
        { key: 'nifRequired', label: t('profile.documents.nif') || 'NIF', required: true, description: 'Numéro d\'Identification Fiscale' },
        { key: 'carteFellah', label: t('profile.documents.carteFellah') || 'Carte Fellah', required: true, description: 'Pour les agriculteurs' }
    ];

    const optionalDocuments = [
        { key: 'nis', label: t('profile.documents.nis') || 'NIS' },
        { key: 'art', label: t('profile.documents.art') || 'Article' },
        { key: 'c20', label: t('profile.documents.c20') || 'C20' },
        { key: 'misesAJourCnas', label: t('profile.documents.misesAJourCnas') || 'Mises à jour CNAS' },
        { key: 'last3YearsBalanceSheet', label: t('profile.documents.balanceSheet') || 'Bilans des 3 dernières années' },
        { key: 'certificates', label: t('profile.documents.certificates') || 'Certificats' },
        { key: 'identityCard', label: t('profile.documents.identityCard') || 'Carte d\'identité' }
    ];

    const handleFileSelect = (fieldKey: string, file: File) => {
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            enqueueSnackbar('Format de fichier non supporté. Utilisez JPG, PNG ou PDF.', { variant: 'error' });
            return;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            enqueueSnackbar('Fichier trop volumineux. Taille maximale: 5MB', { variant: 'error' });
            return;
        }

        setUploadingFile(file);
        uploadDocument(fieldKey, file);
    };

    const uploadDocument = async (fieldKey: string, file: File) => {
        try {
            setIsUploadingDocument(fieldKey);
            
            const formData = new FormData();
            formData.append(fieldKey, file);

            // If identity doesn't exist, create it with this document
            if (!identity || !identity._id) {
                const createResponse: any = await IdentityAPI.create(formData);
                if (createResponse && (createResponse._id || (createResponse.data && createResponse.data._id))) {
                    enqueueSnackbar('Document sauvegardé avec succès.', { variant: 'success' });
                    await queryClient.invalidateQueries({ queryKey: ['identity'] });
                } else {
                    throw new Error('Failed to create identity with document');
                }
            } else {
                const updateResponse = await IdentityAPI.updateDocument(identity._id, fieldKey, file);
                if (updateResponse && updateResponse.success) {
                    enqueueSnackbar('Document sauvegardé avec succès.', { variant: 'success' });
                    await queryClient.invalidateQueries({ queryKey: ['identity'] });
                } else {
                    throw new Error(updateResponse?.message || 'Upload failed');
                }
            }
        } catch (error: any) {
            console.error('Error uploading document:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la mise à jour du document';
            enqueueSnackbar(errorMessage, { variant: 'error' });
        } finally {
            setIsUploadingDocument(null);
            setUploadingFile(null);
        }
    };

    const handleSubmitIdentity = async () => {
        if (!identity || !identity._id) {
            enqueueSnackbar('Veuillez d\'abord télécharger au moins un document', { variant: 'warning' });
            return;
        }

        try {
            setIsSubmittingIdentity(true);
            const response = await IdentityAPI.submitIdentity(identity._id);
            if (response && response.success) {
                enqueueSnackbar(response.message || 'Documents soumis avec succès.', { variant: 'success' });
                await queryClient.invalidateQueries({ queryKey: ['identity'] });
            } else {
                throw new Error(response?.message || 'Failed to submit identity');
            }
        } catch (error: any) {
            console.error('Error submitting identity:', error);
            enqueueSnackbar(error.message || 'Erreur lors de la soumission', { variant: 'error' });
        } finally {
            setIsSubmittingIdentity(false);
        }
    };

    const getDocumentUrl = (document: any): string => {
        if (!document) return '';
        if (document.fullUrl) return normalizeImageUrl(document.fullUrl);
        if (document.url) return normalizeImageUrl(document.url);
        return '';
    };

    const getDocumentName = (document: any): string => {
        if (!document) return '';
        return document.filename || 'Document';
    };

    const renderDocumentCards = (documents: any[], sectionTitle: string, isRequired: boolean) => {
        return (
            <div className="modern-document-section">
                <div className="modern-document-section-header">
                    <h3 className="modern-document-section-title">
                        <i className={`bi-${isRequired ? 'exclamation-triangle-fill' : 'plus-circle-fill'}`}></i>
                        {sectionTitle}
                    </h3>
                    <div className={`modern-document-section-badge ${isRequired ? 'required' : 'optional'}`}>
                        {isRequired ? 'Obligatoire' : 'Facultatif'}
                    </div>
                </div>

                 {/* Note Box */}
                <div className="modern-document-optional-note">
                    <div className="modern-document-note-card">
                        <i className="bi-info-circle-fill"></i>
                        <div className="modern-document-note-content">
                            <h4>{isRequired ? (t("profile.documents.verificationNoteTitle") || "Vérification") : (t("profile.documents.certificationNoteTitle") || "Certification")}</h4>
                            <p>
                                {isRequired 
                                    ? (t("profile.documents.verificationRequirement") || "Fournir (RC/ Autres + NIF) ou (Carte Fellah uniquement).")
                                    : (t("profile.documents.certificationRequirement") || "Ajoutez ces documents pour la certification professionnelle.")}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="modern-document-grid">
                    {documents.map((field, index) => {
                        const document = identity ? (identity as any)[field.key] : null;
                        const isUploadingThisField = isUploadingDocument === field.key;
                        const hasDocument = document && document.url;

                        return (
                            <motion.div
                                key={field.key}
                                className={`modern-document-card ${hasDocument ? 'has-document' : 'no-document'} ${isUploadingThisField ? 'uploading' : ''}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="modern-document-header">
                                    <div className="modern-document-icon">
                                        <i className={hasDocument ? "bi-file-earmark-check-fill" : "bi-file-earmark-plus"}></i>
                                    </div>
                                    <div className="modern-document-info">
                                        <h3 className="modern-document-title">
                                            {field.label}
                                            {field.required && <span className="required-badge">*</span>}
                                        </h3>
                                        <p className="modern-document-description">{field.description}</p>
                                    </div>
                                </div>

                                {hasDocument && (
                                    <div className="modern-document-preview">
                                        <div className="modern-document-file">
                                             <div className="modern-document-icon">
                                                <i className={`bi-${document.mimetype?.includes('pdf') ? 'file-earmark-pdf' : 'file-earmark-image'}`}></i>
                                            </div>
                                            <div className="modern-document-info-text">
                                                <span className="modern-document-name">{getDocumentName(document)}</span>
                                                <span className="modern-document-type">{document.mimetype || 'Document'}</span>
                                            </div>
                                        </div>
                                        <div className="modern-document-actions">
                                            <a
                                                href={getDocumentUrl(document)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="modern-btn modern-btn-outline modern-btn-sm"
                                            >
                                                <i className="bi-eye"></i>
                                                Voir
                                            </a>
                                        </div>
                                    </div>
                                )}

                                <div className="modern-document-upload-area">
                                    <input
                                        type="file"
                                        id={`file-${field.key}`}
                                        className="hidden-file-input"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                handleFileSelect(field.key, e.target.files[0]);
                                            }
                                        }}
                                        disabled={isUploadingThisField}
                                        style={{ display: 'none' }}
                                    />
                                    <label 
                                        htmlFor={`file-${field.key}`} 
                                        className={`modern-upload-btn ${hasDocument ? 'update' : 'upload'}`}
                                    >
                                        {isUploadingThisField ? (
                                            <>
                                                <div className="modern-spinner-sm"></div>
                                                <span>Importation...</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className={`bi-${hasDocument ? 'arrow-repeat' : 'cloud-upload'}`}></i>
                                                <span>{hasDocument ? 'Remplacer' : 'Importer'}</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
                 {/* Submit Button for this section if needed, though usually one global submit */}
            </div>
        );
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const response = await CategoryAPI.getCategories();
            if (response && Array.isArray(response)) {
                setCategories(response);
            } else if (response?.data && Array.isArray(response.data)) {
                setCategories(response.data);
            }
        } catch (error) {
            console.error("Error loading categories", error);
        }
    };

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

    const handleVisibilityToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.checked;
        
        // Optimistic update
        setFormData(prev => ({
            ...prev,
            isProfileVisible: newValue
        }));

        try {
            await UserAPI.updateProfile({ isProfileVisible: newValue });
            enqueueSnackbar(newValue ? "Profil visible" : "Profil masqué", { variant: "success" });
            
            // Update auth user context if needed
            if (auth.user) {
                const mergedUser = { ...auth.user, isProfileVisible: newValue };
                set({ user: mergedUser, tokens: auth.tokens });
            }
        } catch (error) {
            console.error('Error updating profile visibility:', error);
            // Revert on error
            setFormData(prev => ({
                ...prev,
                isProfileVisible: !newValue
            }));
            enqueueSnackbar("Erreur lors de la mise à jour", { variant: "error" });
        }
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
                                { id: "documents", icon: "bi-file-earmark-text-fill", label: t("dashboard.profile.tabs.documents") || "Documents" },
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
                                                            <select
                                                                id="activitySector"
                                                                name="activitySector"
                                                                value={formData.activitySector}
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
                                                                <option value="">{t("profile.personalInfo.selectSector") || "Sélectionner un secteur"}</option>
                                                                {categories.map((cat) => (
                                                                    <option key={cat._id} value={cat.name}>
                                                                        {cat.name}
                                                                    </option>
                                                                ))}
                                                            </select>
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
                                                            background: 'white',
                                                            padding: '1.25rem',
                                                            borderRadius: '16px',
                                                            border: '1px solid #e2e8f0',
                                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                                                        }}>
                                                            <div style={{ maxWidth: '80%' }}>
                                                                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
                                                                    {t("profile.personalInfo.isProfileVisible") || "Informations personnelles visibles"}
                                                                </h4>
                                                                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', lineHeight: '1.4' }}>
                                                                    {t("profile.personalInfo.isProfileVisibleDesc") || "Rendre vos informations personnelles visibles aux autres utilisateurs"}
                                                                </p>
                                                            </div>
                                                            
                                                            <label style={{ position: 'relative', width: '52px', height: '32px', cursor: 'pointer', display: 'block' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    id="isProfileVisible"
                                                                    name="isProfileVisible"
                                                                    checked={!!formData.isProfileVisible}
                                                                    onChange={handleVisibilityToggle}
                                                                    style={{ opacity: 0, width: 0, height: 0 }}
                                                                />
                                                                <span style={{
                                                                    position: 'absolute',
                                                                    cursor: 'pointer',
                                                                    top: 0, 
                                                                    left: 0, 
                                                                    right: 0, 
                                                                    bottom: 0,
                                                                    backgroundColor: formData.isProfileVisible ? '#4f46e5' : '#cbd5e1',
                                                                    borderRadius: '34px',
                                                                    transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
                                                                }}></span>
                                                                <span style={{
                                                                    position: 'absolute',
                                                                    content: '""',
                                                                    height: '24px',
                                                                    width: '24px',
                                                                    left: formData.isProfileVisible ? '24px' : '4px',
                                                                    bottom: '4px',
                                                                    backgroundColor: 'white',
                                                                    transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                    borderRadius: '50%',
                                                                    boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.2)'
                                                                }}></span>
                                                            </label>
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

                                {activeTab === "documents" && (
                                    <motion.div
                                        key="documents"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <div className="modern-section-card" style={{ padding: 0, overflow: 'hidden' }}>
                                            {isLoadingDocuments ? (
                                                <div className="modern-loading" style={{ padding: '40px' }}>
                                                    <div className="modern-spinner"></div>
                                                    <p>Chargement des documents...</p>
                                                </div>
                                            ) : (
                                                <div style={{ padding: '20px' }}>
                                                    <div className="modern-upgrade-buttons" style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                                                        <motion.button
                                                            className={`modern-upgrade-btn ${activeUpgradeSection === 'verified' ? 'active' : ''}`}
                                                            onClick={() => setActiveUpgradeSection(activeUpgradeSection === 'verified' ? null : 'verified')}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            style={{
                                                                flex: 1,
                                                                padding: '15px',
                                                                borderRadius: '12px',
                                                                border: '1px solid #e2e8f0',
                                                                background: activeUpgradeSection === 'verified' ? '#eff6ff' : 'white',
                                                                color: activeUpgradeSection === 'verified' ? '#2563eb' : '#64748b',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '10px',
                                                                cursor: 'pointer',
                                                                fontWeight: 600
                                                            }}
                                                        >
                                                            <i className="bi bi-shield-check"></i>
                                                            {t('dashboard.profile.documents.switchToVerified') || "Vérification (Obligatoire)"}
                                                        </motion.button>
                                                        <motion.button
                                                            className={`modern-upgrade-btn ${activeUpgradeSection === 'certified' ? 'active' : ''}`}
                                                            onClick={() => setActiveUpgradeSection(activeUpgradeSection === 'certified' ? null : 'certified')}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            style={{
                                                                flex: 1,
                                                                padding: '15px',
                                                                borderRadius: '12px',
                                                                border: '1px solid #e2e8f0',
                                                                background: activeUpgradeSection === 'certified' ? '#f5f3ff' : 'white',
                                                                color: activeUpgradeSection === 'certified' ? '#7c3aed' : '#64748b',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '10px',
                                                                cursor: 'pointer',
                                                                fontWeight: 600
                                                            }}
                                                        >
                                                            <i className="bi bi-award"></i>
                                                            {t('dashboard.profile.documents.switchToCertified') || "Certification (Optionnel)"}
                                                        </motion.button>
                                                    </div>

                                                    <AnimatePresence>
                                                        {activeUpgradeSection === 'verified' && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                            >
                                                                {renderDocumentCards(requiredDocuments, t('dashboard.profile.documents.verificationTitle') || "Documents Requis", true)}
                                                            </motion.div>
                                                        )}
                                                        {activeUpgradeSection === 'certified' && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                            >
                                                                {renderDocumentCards(optionalDocuments, t('dashboard.profile.documents.certificationInfoTitle') || "Documents Optionnels", false)}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                     
                                                    <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', marginTop: '20px' }}>
                                                         <button
                                                             onClick={handleSubmitIdentity}
                                                             disabled={isSubmittingIdentity}
                                                             className="modern-btn primary"
                                                             style={{ padding: '12px 24px' }}
                                                         >
                                                             {isSubmittingIdentity ? (
                                                                 <>
                                                                     <div className="modern-spinner-sm"></div>
                                                                     <span>Envoi en cours...</span>
                                                                 </>
                                                             ) : (
                                                                 <>
                                                                    <i className="bi bi-send"></i>
                                                                    <span>Soumettre pour vérification</span>
                                                                 </>
                                                             )}
                                                         </button>
                                                    </div>
                                                </div>
                                            )}
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
