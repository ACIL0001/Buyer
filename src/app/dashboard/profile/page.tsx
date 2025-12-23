'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSnackbar } from 'notistack';
import useAuth from '@/hooks/useAuth';
import { authStore } from '@/contexts/authStore';
import { UserAPI } from '@/services/user';
import { IdentityAPI } from '@/services/identity';
import app from '@/config';
import './style.css';

interface ProfileFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    rate: number;
}

interface AvatarData {
    fullUrl?: string;
    url?: string;
    _id?: string;
    filename?: string;
    [key: string]: any;
}

const API_BASE_URL = app.baseURL;

export default function ProfilePage() {
    const router = useRouter();
    const { auth, isLogged, isReady, set } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const { t } = useTranslation();

    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordChanging, setIsPasswordChanging] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [avatarKey, setAvatarKey] = useState(Date.now());
    const [activeTab, setActiveTab] = useState('personal-info');
    const [formData, setFormData] = useState<ProfileFormData>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        rate: 0,
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Document management state
    const [identity, setIdentity] = useState<any>(null);
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
    const [isUploadingDocument, setIsUploadingDocument] = useState<string | null>(null);
    const [uploadingFile, setUploadingFile] = useState<File | null>(null);
    const documentFileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
    const [activeUpgradeSection, setActiveUpgradeSection] = useState<'verified' | 'certified' | null>(null);

    // Document field configurations
    const requiredDocuments = [
        {
            key: 'registreCommerceCarteAuto',
            label: t('dashboard.profile.documentLabels.registreCommerceCarteAuto'),
            description: t('dashboard.profile.documentLabels.registreCommerceCarteAutoDesc'),
            required: true,
        },
        {
            key: 'nifRequired',
            label: t('dashboard.profile.documentLabels.nifRequired'),
            description: t('dashboard.profile.documentLabels.nifRequiredDesc'),
            required: true,
        },
        {
            key: 'carteFellah',
            label: t('dashboard.profile.documentLabels.carteFellah'),
            description: t('dashboard.profile.documentLabels.carteFellahDesc'),
            required: true,
        },
    ];

    const optionalDocuments = [
        {
            key: 'nis',
            label: t('dashboard.profile.documentLabels.nis'),
            description: t('dashboard.profile.documentLabels.nisDesc'),
            required: false,
        },
        {
            key: 'numeroArticle',
            label: t('dashboard.profile.documentLabels.numeroArticle'),
            description: t('dashboard.profile.documentLabels.numeroArticleDesc'),
            required: false,
        },
        {
            key: 'c20',
            label: t('dashboard.profile.documentLabels.c20'),
            description: t('dashboard.profile.documentLabels.c20Desc'),
            required: false,
        },
        {
            key: 'misesAJourCnas',
            label: t('dashboard.profile.documentLabels.misesAJourCnas'),
            description: t('dashboard.profile.documentLabels.misesAJourCnasDesc'),
            required: false,
        },
        {
            key: 'last3YearsBalanceSheet',
            label: t('dashboard.profile.documentLabels.last3YearsBalanceSheet'),
            description: t('dashboard.profile.documentLabels.last3YearsBalanceSheetDesc'),
            required: false,
        },
        {
            key: 'certificates',
            label: t('dashboard.profile.documentLabels.certificates'),
            description: t('dashboard.profile.documentLabels.certificatesDesc'),
            required: false,
        },
    ];

    // Initialize form data when auth.user changes
    useEffect(() => {
        if (auth.user) {
            setFormData({
                firstName: auth.user.firstName || '',
                lastName: auth.user.lastName || '',
                email: auth.user.email || '',
                phone: auth.user.phone || '',
                rate: auth.user.rate || 0,
            });
            
            if (auth.user.avatar || (auth.user as any).photoURL) {
                setAvatarKey(Date.now());
            }
        }
    }, [auth.user]);

    const getAvatarUrl = (avatar: AvatarData | string): string => {
        if (typeof avatar === 'string') {
            if (avatar.startsWith('http')) {
                return avatar.replace('http://localhost:3000', API_BASE_URL.replace(/\/$/, ''));
            } else {
                const cleanPath = avatar.startsWith('/') ? avatar.substring(1) : avatar;
                return `${API_BASE_URL}/static/${cleanPath}`;
            }
        }

        if (avatar?.fullUrl) {
            return avatar.fullUrl.replace('http://localhost:3000', API_BASE_URL.replace(/\/$/, ''));
        }

        if (avatar?.url) {
            if (avatar.url.startsWith('http')) {
                return avatar.url.replace('http://localhost:3000', API_BASE_URL.replace(/\/$/, ''));
            } else {
                const cleanUrl = avatar.url.startsWith('/') ? avatar.url.substring(1) : avatar.url;
                return `${API_BASE_URL}/static/${cleanUrl}`;
            }
        }

        if (avatar?.filename) {
            return `${API_BASE_URL}/static/${avatar.filename}`;
        }

        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.user?.firstName || 'User'}`;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await UserAPI.updateProfile(formData);

            if (response) {
                let updatedUser = response.user || response.data || response;

                if (updatedUser) {
                    const currentUser = auth.user;
                    const mergedUser = {
                        ...currentUser,
                        _id: updatedUser._id || updatedUser.id || currentUser?._id,
                        firstName: updatedUser.firstName || formData.firstName || currentUser?.firstName || '',
                        lastName: updatedUser.lastName || formData.lastName || currentUser?.lastName || '',
                        email: updatedUser.email || currentUser?.email || '',
                        type: updatedUser.accountType || updatedUser.type || currentUser?.type || 'PROFESSIONAL',
                        phone: updatedUser.phone || formData.phone || currentUser?.phone,
                        avatar: updatedUser.avatar || currentUser?.avatar,
                        rate: currentUser?.rate || 1,
                        isPhoneVerified: (updatedUser as any)?.isPhoneVerified ?? (currentUser as any)?.isPhoneVerified,
                        isVerified: (updatedUser as any)?.isVerified ?? (currentUser as any)?.isVerified,
                        isCertified: (updatedUser as any)?.isCertified ?? (currentUser as any)?.isCertified ?? false,
                    };

                    set({
                        tokens: auth.tokens,
                        user: mergedUser,
                    });

                    enqueueSnackbar(t('dashboard.profile.notifications.profileUpdateSuccess'), { variant: 'success' });
                    setIsEditing(false);
                }
            }
        } catch (error: any) {
            if (error.response?.status === 401) {
                enqueueSnackbar('Session expirée', { variant: 'error' });
                set({ tokens: undefined, user: undefined });
                router.push('/login');
            } else {
                const errorMessage = error.response?.data?.message || error.message || t('dashboard.profile.notifications.profileUpdateError');
                enqueueSnackbar(errorMessage, { variant: 'error' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            enqueueSnackbar(t('dashboard.profile.notifications.passwordMismatch'), { variant: 'error' });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            enqueueSnackbar(t('dashboard.profile.notifications.passwordTooShort'), { variant: 'error' });
            return;
        }

        setIsPasswordChanging(true);

        try {
            const response = await UserAPI.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });

            enqueueSnackbar(response.message || t('dashboard.profile.notifications.passwordUpdateSuccess'), { variant: 'success' });

            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (error: any) {
            if (error.response?.status === 401) {
                enqueueSnackbar('Session expirée', { variant: 'error' });
                set({ tokens: undefined, user: undefined });
                router.push('/login');
            } else {
                const errorMessage = error.message || t('dashboard.profile.notifications.passwordUpdateError');
                enqueueSnackbar(errorMessage, { variant: 'error' });
            }
        } finally {
            setIsPasswordChanging(false);
        }
    };

    const handleAvatarClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            enqueueSnackbar('Fichier trop volumineux. Veuillez sélectionner une image plus petite que 5MB', { variant: 'error' });
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            enqueueSnackbar('Veuillez sélectionner un fichier image valide (JPEG, PNG, GIF, WebP)', { variant: 'error' });
            return;
        }

        setIsUploadingAvatar(true);

        try {
            const formDataToUpload = new FormData();
            formDataToUpload.append('avatar', file);
            const response = await UserAPI.uploadAvatar(formDataToUpload);

            if (response && (response.success || response.user || response.data)) {
                if (fileInputRef.current) fileInputRef.current.value = '';

                const updatedUser = response.user || response.data || response;
                const currentUser = auth.user;
                
                const mergedUser: any = { ...currentUser };
                
                if (updatedUser) {
                    Object.keys(updatedUser).forEach(key => {
                        const value = (updatedUser as any)[key];
                        if (value !== undefined && value !== null) {
                            mergedUser[key] = value;
                        }
                    });
                }

                set({
                    user: mergedUser,
                    tokens: auth.tokens,
                });

                setAvatarKey(Date.now());
                enqueueSnackbar(response.message || 'Avatar mis à jour avec succès', { variant: 'success' });
            } else {
                enqueueSnackbar(response?.message || 'Échec du téléchargement de l\'avatar', { variant: 'error' });
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Échec du téléchargement de l\'avatar';
            enqueueSnackbar(errorMessage, { variant: 'error' });
        } finally {
            setIsUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Document management functions
    const fetchIdentity = async () => {
        try {
            setIsLoadingDocuments(true);
            const response = await IdentityAPI.getMy();
            if (response && (response.data || response)) {
                setIdentity(response.data || response);
            } else {
                setIdentity(null);
            }
        } catch (error: any) {
            if (error.response?.status !== 404 && !error.message?.includes('timeout')) {
                enqueueSnackbar('Erreur lors du chargement des documents', { variant: 'error' });
            }
            setIdentity(null);
        } finally {
            setIsLoadingDocuments(false);
        }
    };

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

            let response: any;
            
            if (!identity || !identity._id) {
                const formData = new FormData();
                formData.append(fieldKey, file);
                response = await IdentityAPI.create(formData);
                
                if (response && response._id) {
                    enqueueSnackbar('Document sauvegardé avec succès. Cliquez sur "Soumettre" pour envoyer pour vérification.', { variant: 'success' });
                    await fetchIdentity();
                }
            } else {
                response = await IdentityAPI.updateDocument(identity._id, fieldKey, file);

                if (response && (response.success || response.data)) {
                    enqueueSnackbar('Document sauvegardé avec succès. Cliquez sur "Soumettre" pour envoyer pour vérification.', { variant: 'success' });
                    setIdentity((prev: any) =>
                        prev ? { ...prev, [fieldKey]: response.data?.[fieldKey] || response[fieldKey] || prev[fieldKey] } : null
                    );
                    await fetchIdentity();
                }
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la mise à jour du document';
            enqueueSnackbar(errorMessage, { variant: 'error' });
        } finally {
            setIsUploadingDocument(null);
            setUploadingFile(null);
        }
    };

    const getDocumentUrl = (document: any): string => {
        if (!document) return '';
        if (document.fullUrl) return document.fullUrl;
        if (document.url) {
            if (document.url.startsWith('http')) return document.url;
            const cleanUrl = document.url.startsWith('/') ? document.url.substring(1) : document.url;
            return `${API_BASE_URL}${cleanUrl}`;
        }
        return '';
    };

    const getDocumentName = (document: any): string => {
        if (!document) return '';
        return document.filename || document.originalname || 'Document';
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    useEffect(() => {
        if (activeTab === 'documents' && !identity) {
            fetchIdentity();
        }
    }, [activeTab]);

    const normalizeUrl = React.useCallback((url: string): string => {
        if (!url || url.trim() === '') return '';
        let cleanUrl = url.trim();
        
        if (cleanUrl.includes('&') && !cleanUrl.includes('?')) {
            cleanUrl = cleanUrl.replace('&', '?');
        }
        
        if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
            let normalized = cleanUrl
                .replace(/http:\/\/localhost:3000/g, API_BASE_URL.replace(/\/$/, ''))
                .replace(/http:\/\/localhost\//g, API_BASE_URL.replace(/\/$/, '') + '/')
                .replace(/http:\/\/localhost$/g, API_BASE_URL.replace(/\/$/, ''));
            
            if (normalized.startsWith('http://localhost')) {
                try {
                    const urlObj = new URL(cleanUrl);
                    const pathWithQuery = urlObj.pathname + (urlObj.search || '');
                    normalized = `${API_BASE_URL.replace(/\/$/, '')}${pathWithQuery}`;
                } catch (e) {
                    console.warn('Failed to parse URL:', cleanUrl);
                }
            }
            
            return normalized;
        }
        
        if (cleanUrl.startsWith('/static/')) {
            return `${API_BASE_URL.replace(/\/$/, '')}${cleanUrl}`;
        }
        
        if (cleanUrl.startsWith('/')) {
            return `${API_BASE_URL.replace(/\/$/, '')}/static${cleanUrl}`;
        }
        
        return `${API_BASE_URL.replace(/\/$/, '')}/static/${cleanUrl}`;
    }, []);

    const appendCacheBuster = (url: string) => {
        if (!url) return url;
        let cleaned = url.replace(/[?&]v=\d+/g, '');
        cleaned = cleaned.replace(/\?&/g, '?').replace(/&&+/g, '&');
        cleaned = cleaned.replace(/[?&]+$/, '');
        const hasQuery = cleaned.includes('?');
        const separator = hasQuery ? '&' : '?';
        return cleaned + separator + `v=${avatarKey}`;
    };

    const getAvatarSrc = () => {
        if (!auth.user) return `https://api.dicebear.com/7.x/avataaars/svg?seed=User`;

        if ((auth.user as any).photoURL && (auth.user as any).photoURL.trim() !== '') {
            const cleanUrl = normalizeUrl((auth.user as any).photoURL);
            if (cleanUrl && !cleanUrl.includes('mock-images')) {
                return appendCacheBuster(cleanUrl);
            }
        }

        if (auth.user.avatar) {
            const avatar = auth.user.avatar as any;
            
            if (avatar.fullUrl && avatar.fullUrl.trim() !== '') {
                const cleanUrl = normalizeUrl(avatar.fullUrl);
                if (cleanUrl && !cleanUrl.includes('mock-images')) {
                    return appendCacheBuster(cleanUrl);
                }
            }
            
            if (avatar.url && avatar.url.trim() !== '') {
                const cleanUrl = normalizeUrl(avatar.url);
                if (cleanUrl && !cleanUrl.includes('mock-images')) {
                    return appendCacheBuster(cleanUrl);
                }
            }
            
            if (avatar.filename && avatar.filename.trim() !== '') {
                const cleanUrl = normalizeUrl(avatar.filename);
                if (cleanUrl && !cleanUrl.includes('mock-images')) {
                    return appendCacheBuster(cleanUrl);
                }
            }
        }

        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.user?.firstName || 'User'}`;
    };

    const avatarSrc = getAvatarSrc();
    const [stableAvatarSrc, setStableAvatarSrc] = useState<string>('');
    const [isSubmittingIdentity, setIsSubmittingIdentity] = useState(false);

    useEffect(() => {
        if (avatarSrc && !avatarSrc.includes('/assets/images/avatar.jpg')) {
            setStableAvatarSrc(avatarSrc);
        }
    }, [avatarSrc, auth.user?.avatar, (auth.user as any)?.photoURL]);

    if (isReady && !isLogged) {
        return (
            <div className="profile-login-required">
                <div className="login-prompt">
                    <h2>Authentification requise</h2>
                    <p>Veuillez vous connecter pour accéder à votre profil.</p>
                    <button onClick={() => router.push('/login')}>Aller à la connexion</button>
                </div>
            </div>
        );
    }



    const handleSubmitIdentity = async () => {
        if (!identity || !identity._id) {
            enqueueSnackbar('Veuillez d\'abord télécharger au moins un document', { variant: 'warning' });
            return;
        }

        try {
            setIsSubmittingIdentity(true);
            const response = await IdentityAPI.submitIdentity(identity._id);
            
            if (response && response.success) {
                enqueueSnackbar(
                    response.message || 'Documents soumis avec succès. En attente de vérification par l\'administrateur.',
                    { variant: 'success' }
                );
                await fetchIdentity();
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la soumission des documents';
            enqueueSnackbar(errorMessage, { variant: 'error' });
        } finally {
            setIsSubmittingIdentity(false);
        }
    };

    const renderDocumentCards = (documents: any[], sectionTitle: string, isRequired: boolean) => {
        return (
            <div className="modern-document-section">
                <div className="modern-document-section-header">
                    <h3 className="modern-document-section-title">
                        <i className={`bi-${isRequired ? 'exclamation-triangle-fill' : 'plus-circle-fill'}`}></i>
                        {sectionTitle}
                    </h3>
                    <div className={`modern-document-section-badge ${isRequired ? 'required' : 'required'}`}>
                        {isRequired ? t('dashboard.profile.documents.mandatory') : t('dashboard.profile.documents.required')}
                    </div>
                </div>

                {isRequired && (
                    <div className="modern-document-optional-note">
                        <div className="modern-document-note-card">
                            <i className="bi-info-circle-fill"></i>
                            <div className="modern-document-note-content">
                                <h4>{t('dashboard.profile.documents.verificationInfoTitle')}</h4>
                                <p>{t('dashboard.profile.documents.verificationInfoBody1')}</p>
                                <p>{t('dashboard.profile.documents.verificationInfoBody2')}</p>
                            </div>
                        </div>
                    </div>
                )}

                {!isRequired && (
                    <div className="modern-document-optional-note">
                        <div className="modern-document-note-card">
                            <i className="bi-info-circle-fill"></i>
                            <div className="modern-document-note-content">
                                <h4>{t('dashboard.profile.documents.certificationInfoTitle')}</h4>
                                <p>{t('dashboard.profile.documents.certificationInfoBody1')}</p>
                                <p>{t('dashboard.profile.documents.certificationInfoBody2')}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="modern-document-grid">
                    {documents.map((field, index) => {
                        const document = identity?.[field.key];
                        const isUploadingThisField = isUploadingDocument === field.key;
                        const hasDocument = document && ((document as any).url || (document as any).fullUrl);

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
                                        <i className={hasDocument ? 'bi-file-earmark-check-fill' : 'bi-file-earmark-plus'}></i>
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
                                            {document.mimetype?.startsWith('image/') ? (
                                                <div className="modern-document-image-preview">
                                                    <img
                                                        src={getDocumentUrl(document)}
                                                        alt={getDocumentName(document)}
                                                        className="modern-document-thumbnail"
                                                        onClick={() => window.open(getDocumentUrl(document), '_blank')}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="modern-document-icon">
                                                    <i className={`bi-${document.mimetype?.includes('pdf') ? 'file-earmark-pdf' : 'file-earmark-text'}`}></i>
                                                </div>
                                            )}
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

                                <div className="modern-document-upload">
                                    <input
                                        ref={(el) => {
                                            documentFileInputRefs.current[field.key] = el;
                                        }}
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                handleFileSelect(field.key, file);
                                            }
                                        }}
                                        style={{ display: 'none' }}
                                    />

                                    <motion.button
                                        className={`modern-btn ${hasDocument ? 'modern-btn-outline' : 'modern-btn-primary'} modern-btn-full`}
                                        onClick={() => documentFileInputRefs.current[field.key]?.click()}
                                        disabled={isUploadingThisField}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {isUploadingThisField ? (
                                            <>
                                                <div className="modern-spinner-sm"></div>
                                                {t('dashboard.profile.documents.submitting')}
                                            </>
                                        ) : hasDocument ? (
                                            <>
                                                <i className="bi-arrow-clockwise"></i>
                                                {t('dashboard.profile.documents.replace')}
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi-upload"></i>
                                                {t('dashboard.profile.documents.add')}
                                            </>
                                        )}
                                    </motion.button>
                                </div>

                                {isUploadingThisField && uploadingFile && (
                                    <div className="modern-upload-progress">
                                        <div className="modern-upload-info">
                                            <span className="modern-upload-filename">{uploadingFile.name}</span>
                                            <span className="modern-upload-size">{formatFileSize(uploadingFile.size)}</span>
                                        </div>
                                        <div className="modern-progress-bar">
                                            <div className="modern-progress-fill"></div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {isRequired && identity && identity._id && (() => {
                    const hasRc = identity.registreCommerceCarteAuto && ((identity.registreCommerceCarteAuto as any).url || (identity.registreCommerceCarteAuto as any).fullUrl);
                    const hasNif = identity.nifRequired && ((identity.nifRequired as any).url || (identity.nifRequired as any).fullUrl);
                    const hasCarteFellah = identity.carteFellah && ((identity.carteFellah as any).url || (identity.carteFellah as any).fullUrl);
                    const canSubmit = (hasRc && hasNif) || hasCarteFellah;
                    
                    if (!canSubmit) return null;
                    
                    return (
                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                            <motion.button
                                className="modern-btn modern-btn-primary"
                                onClick={handleSubmitIdentity}
                                disabled={isSubmittingIdentity || identity?.status === 'WAITING' || identity?.status === 'DONE'}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    padding: '0.8rem 2rem',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    minWidth: '200px',
                                    opacity: (identity?.status === 'WAITING' || identity?.status === 'DONE') ? 0.6 : 1,
                                    cursor: (identity?.status === 'WAITING' || identity?.status === 'DONE') ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {isSubmittingIdentity ? (
                                    <>
                                        <div className="modern-spinner-sm" style={{ marginRight: '0.5rem' }}></div>
                                        {t('dashboard.profile.documents.submitting')}
                                    </>
                                ) : identity?.status === 'WAITING' ? (
                                    <>
                                        <i className="bi-clock-history" style={{ marginRight: '0.5rem' }}></i>
                                        {t('dashboard.profile.documents.waiting')}
                                    </>
                                ) : identity?.status === 'DONE' ? (
                                    <>
                                        <i className="bi-check-circle-fill" style={{ marginRight: '0.5rem' }}></i>
                                        {t('dashboard.profile.documents.verified')}
                                    </>
                                ) : (
                                    <>
                                        <i className="bi-send-fill" style={{ marginRight: '0.5rem' }}></i>
                                        {t('dashboard.profile.documents.submit')}
                                    </>
                                )}
                            </motion.button>
                        </div>
                    );
                })()}

                {!isRequired && identity && identity._id && (() => {
                    const optionalDocKeys = ['nis', 'numeroArticle', 'c20', 'misesAJourCnas', 'last3YearsBalanceSheet', 'certificates'];
                    const hasAnyOptionalDoc = optionalDocKeys.some(key => {
                        const doc = identity[key];
                        return doc && ((doc as any).url || (doc as any).fullUrl);
                    });
                    
                    if (!hasAnyOptionalDoc) return null;
                    
                    const certificationStatus = (identity as any).certificationStatus || 'DRAFT';
                    
                    return (
                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                            <motion.button
                                className="modern-btn modern-btn-primary"
                                onClick={async () => {
                                    try {
                                        setIsSubmittingIdentity(true);
                                        const response = await IdentityAPI.submitCertification(identity._id);
                                        
                                        if (response && response.success) {
                                            enqueueSnackbar(
                                                response.message || 'Documents de certification soumis avec succès.',
                                                { variant: 'success' }
                                            );
                                            await fetchIdentity();
                                        }
                                    } catch (error: any) {
                                        const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la soumission';
                                        enqueueSnackbar(errorMessage, { variant: 'error' });
                                    } finally {
                                        setIsSubmittingIdentity(false);
                                    }
                                }}
                                disabled={isSubmittingIdentity || certificationStatus === 'WAITING' || certificationStatus === 'DONE'}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    padding: '0.8rem 2rem',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    minWidth: '200px',
                                }}
                            >
                                {isSubmittingIdentity ? (
                                    <>
                                        <div className="modern-spinner-sm" style={{ marginRight: '0.5rem' }}></div>
                                        Soumission...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi-send-fill" style={{ marginRight: '0.5rem' }}></i>
                                        {t('dashboard.profile.documents.submit')}
                                    </>
                                )}
                            </motion.button>
                        </div>
                    );
                })()}
            </div>
        );
    };

    return (
        <main className="modern-profile-page">
            {/* Animated Background */}
            <div className="profile-background">
                <div className="gradient-orb orb-1"></div>
                <div className="gradient-orb orb-2"></div>
                <div className="gradient-orb orb-3"></div>
            </div>

            {/* Page Header with Title */}
            <motion.div
                className="profile-page-header"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
            >
                <div className="profile-header-content">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="profile-page-title"
                    >
                        {t('dashboard.profile.personalInfo.title')}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="profile-page-subtitle"
                    >
                        {t('dashboard.profile.personalInfo.subtitle')}
                    </motion.p>
                </div>
            </motion.div>

            <div className="modern-profile-container">
                {/* Hero Section - Full Width */}
                <motion.div
                    className="modern-profile-hero"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                >
                    <motion.div
                        className="hero-content"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                    >
                        {/* Profile Avatar Card - Centered */}
                        <div className="hero-avatar-card" style={{ boxShadow: 'none' }}>
                            <div className="avatar-container">
                                <div className="avatar-wrapper" style={{ position: 'relative' }}>
                                    <div className="avatar-frame" style={{
                                        boxShadow: '0 0 0 2px #e5e7eb',
                                        border: '4px solid #fff',
                                        background: '#fff',
                                        borderRadius: '50%',
                                        padding: 0,
                                        overflow: 'hidden'
                                    }}>
                                        <img
                                            key={`avatar-${avatarKey}-${auth.user?._id || 'default'}`}
                                            src={stableAvatarSrc || avatarSrc}
                                            alt="Profile"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                borderRadius: '50%',
                                                display: 'block'
                                            }}
                                            loading="lazy"
                                            onError={(e) => {
                                                const target = e.currentTarget as HTMLImageElement;
                                                if (!target.src.includes('avatar.jpg')) {
                                                    target.src = '/assets/images/avatar.jpg';
                                                }
                                            }}
                                        />
                                    </div>
                                    {auth.user?.rate && auth.user.rate > 0 && (
                                        <div
                                            className="rating-badge-avatar"
                                            style={{
                                                position: 'absolute',
                                                top: '-8px',
                                                right: '-8px',
                                                background: 'transparent',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                zIndex: 10,
                                            }}
                                        >
                                            <span style={{
                                                fontSize: '18px',
                                                fontWeight: '800',
                                                color: '#FFD700',
                                                textShadow: '0 0 10px rgba(255, 215, 0, 0.6)',
                                            }}>
                                                +{Math.round(auth.user.rate)}
                                            </span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                        onChange={handleAvatarChange}
                                    />

                                    <button
                                        className="modern-avatar-btn"
                                        onClick={handleAvatarClick}
                                        disabled={isUploadingAvatar}
                                    >
                                        {isUploadingAvatar ? (
                                            <div className="loading-spinner">
                                                <i className="bi bi-arrow-clockwise"></i>
                                            </div>
                                        ) : (
                                            <i className="bi bi-camera-fill"></i>
                                        )}
                                    </button>
                                </div>

                                <div className="avatar-info">
                                    <motion.h3
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 1.1 }}
                                    >
                                        {auth.user?.firstName} {auth.user?.lastName || 'Utilisateur'}
                                    </motion.h3>
                                    <motion.p
                                        className="user-email"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 1.2 }}
                                    >
                                        {auth.user?.email}
                                    </motion.p>

                                    {/* Professional and Verified Badges */}
                                    <motion.div
                                        className="user-badges-container"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 1.3 }}
                                        style={{
                                            display: 'flex',
                                            gap: '6px',
                                            marginTop: '4px',
                                            flexWrap: 'wrap',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {auth.user?.type === 'PROFESSIONAL' && (
                                            <motion.div
                                                className="user-badge professional"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '3px',
                                                    padding: '3px 6px',
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    color: 'white',
                                                    borderRadius: '10px',
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                }}
                                            >
                                                <i className="bi bi-star-fill" style={{ fontSize: '9px' }}></i>
                                                <span>PRO</span>
                                            </motion.div>
                                        )}

                                        {(auth.user as any)?.isVerified && (
                                            <motion.div
                                                className="user-badge verified"
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '3px',
                                                    padding: '3px 6px',
                                                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                                    color: 'white',
                                                    borderRadius: '10px',
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                }}
                                            >
                                                <i className="bi bi-check-circle-fill" style={{ fontSize: '9px' }}></i>
                                                <span>VERIFIED</span>
                                            </motion.div>
                                        )}
                                        {(auth.user as any)?.isCertified && (
                                            <motion.div
                                                className="user-badge certified"
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '3px',
                                                    padding: '3px 6px',
                                                    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                                                    color: 'white',
                                                    borderRadius: '10px',
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                }}
                                            >
                                                <i className="bi bi-award-fill" style={{ fontSize: '9px' }}></i>
                                                <span>CERTIFIÉ</span>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Main Content Grid */}
                <div className="modern-content-grid">
                    {/* Profile Tabs Section */}
                    <motion.div
                        className="modern-tabs-section"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 1.2 }}
                    >
                        {/* Tab Navigation */}
                        <div className="modern-tab-nav">
                            {[
                                { id: 'personal-info', icon: 'bi-person-circle', label: t('dashboard.profile.tabs.personalInfo') },
                                { id: 'security', icon: 'bi-shield-lock-fill', label: t('dashboard.profile.tabs.security') },
                                { id: 'documents', icon: 'bi-file-earmark-text-fill', label: t('dashboard.profile.tabs.documents') },
                            ].map((tab, index) => (
                                <motion.button
                                    key={tab.id}
                                    className={`modern-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
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
                                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </motion.button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="modern-tab-content">
                            <AnimatePresence mode="wait">
                                {/* Personal Info Tab */}
                                {activeTab === 'personal-info' && (
                                    <motion.div
                                        key="personal-info"
                                        className="modern-tab-content"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                    >
                                        <div className="modern-section-card">
                                            <div className="section-header">
                                                <div className="header-content">
                                                    <motion.div
                                                        className="header-icon"
                                                        whileHover={{ rotate: 10, scale: 1.1 }}
                                                    >
                                                        <i className="bi bi-person-circle"></i>
                                                    </motion.div>
                                                    <div className="header-text">
                                                        <h2>{t('dashboard.profile.personalInfo.title')}</h2>
                                                        <p>{t('dashboard.profile.personalInfo.subtitle')}</p>
                                                    </div>
                                                </div>
                                                <motion.button
                                                    className={`modern-edit-button ${isEditing ? 'editing' : ''}`}
                                                    onClick={() => setIsEditing(!isEditing)}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <i className={`bi ${isEditing ? 'bi-x-circle' : 'bi-pencil-square'}`} />
                                                    <span>{isEditing ? t('dashboard.profile.personalInfo.cancel') : t('dashboard.profile.personalInfo.edit')}</span>
                                                </motion.button>
                                            </div>

                                            <form onSubmit={handleSubmit}>
                                                <div className="modern-form-grid">
                                                    <div className="modern-form-field">
                                                        <label htmlFor="firstName">{t('dashboard.profile.personalInfo.firstName')}</label>
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
                                                        <label htmlFor="lastName">{t('dashboard.profile.personalInfo.lastName')}</label>
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
                                                        <label htmlFor="email">{t('dashboard.profile.personalInfo.email')}</label>
                                                        <input
                                                            type="email"
                                                            id="email"
                                                            name="email"
                                                            value={formData.email}
                                                            onChange={handleInputChange}
                                                            disabled={!isEditing}
                                                            required
                                                        />
                                                    </div>

                                                    <div className="modern-form-field">
                                                        <label htmlFor="phone">{t('dashboard.profile.personalInfo.phone')}</label>
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
                                                            <span>{t('dashboard.profile.personalInfo.cancel')}</span>
                                                        </button>

                                                        <button
                                                            type="submit"
                                                            disabled={isLoading}
                                                            className="modern-btn primary"
                                                        >
                                                            {isLoading ? (
                                                                <>
                                                                    <div className="loading-spinner-lg"></div>
                                                                    <span>{t('dashboard.profile.personalInfo.save')}...</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <i className="bi bi-check-circle"></i>
                                                                    <span>{t('dashboard.profile.personalInfo.save')}</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                            </form>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Security Tab */}
                                {activeTab === 'security' && (
                                    <motion.div
                                        key="security"
                                        className="modern-tab-content"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                    >
                                        <div className="modern-section-card">
                                            <div className="section-header">
                                                <div className="header-content">
                                                    <div className="header-icon">
                                                        <i className="bi bi-shield-lock-fill"></i>
                                                    </div>
                                                    <div className="header-text">
                                                        <h2>{t('dashboard.profile.security.title')}</h2>
                                                        <p>{t('dashboard.profile.security.subtitle')}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <form onSubmit={handlePasswordSubmit}>
                                                <div className="modern-form-grid">
                                                    {[
                                                        { name: 'currentPassword', label: t('dashboard.profile.security.currentPassword') },
                                                        { name: 'newPassword', label: t('dashboard.profile.security.newPassword') },
                                                        { name: 'confirmPassword', label: t('dashboard.profile.security.confirmPassword') },
                                                    ].map((field) => (
                                                        <div key={field.name} className="modern-form-field">
                                                            <label htmlFor={field.name}>{field.label}</label>
                                                            <input
                                                                type="password"
                                                                id={field.name}
                                                                name={field.name}
                                                                value={passwordData[field.name as keyof typeof passwordData]}
                                                                onChange={handlePasswordChange}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="modern-actions">
                                                    <button
                                                        type="submit"
                                                        disabled={isPasswordChanging}
                                                        className="modern-btn primary"
                                                    >
                                                        {isPasswordChanging ? (
                                                            <>
                                                                <div className="loading-spinner-lg"></div>
                                                                <span>Mise à jour...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="bi bi-shield-check"></i>
                                                                <span>{t('dashboard.profile.security.update')}</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Documents Tab */}
                                {activeTab === 'documents' && (
                                    <motion.div
                                        key="documents"
                                        className="modern-tab-content"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                    >
                                        <div className="modern-section">
                                            {isLoadingDocuments ? (
                                                <div className="modern-loading">
                                                    <div className="modern-spinner"></div>
                                                    <p>Chargement des documents...</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="modern-upgrade-buttons">
                                                        <motion.button
                                                            className={`modern-upgrade-btn ${activeUpgradeSection === 'verified' ? 'active' : ''}`}
                                                            onClick={() => setActiveUpgradeSection(activeUpgradeSection === 'verified' ? null : 'verified')}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                        >
                                                            <i className="bi-shield-check"></i>
                                                            {t('dashboard.profile.documents.switchToVerified')}
                                                        </motion.button>
                                                        <motion.button
                                                            className={`modern-upgrade-btn ${activeUpgradeSection === 'certified' ? 'active' : ''}`}
                                                            onClick={() => setActiveUpgradeSection(activeUpgradeSection === 'certified' ? null : 'certified')}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                        >
                                                            <i className="bi-award"></i>
                                                            {t('dashboard.profile.documents.switchToCertified')}
                                                        </motion.button>
                                                    </div>

                                                    <AnimatePresence>
                                                        {activeUpgradeSection === 'verified' && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                            >
                                                                {renderDocumentCards(requiredDocuments, t('dashboard.profile.documents.verificationTitle'), true)}
                                                            </motion.div>
                                                        )}
                                                        {activeUpgradeSection === 'certified' && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                            >
                                                                {renderDocumentCards(optionalDocuments, t('dashboard.profile.documents.certificationInfoTitle'), false)}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
