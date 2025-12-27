"use client"

import React, { useState, useEffect, useRef } from "react"
import Header from "@/components/header/Header"
import Footer from "@/components/footer/Footer"
import useAuth from "@/hooks/useAuth"
import { useSnackbar } from "notistack"
import RequestProvider from "@/contexts/RequestContext"
import SocketProvider from "@/contexts/socket"
import { motion, AnimatePresence } from "framer-motion"
import "./modern-styles.css"
import { UserAPI } from "@/app/api/users"
import { IdentityAPI } from "@/app/api/identity"
import { useIdentityStatus } from "@/hooks/useIdentityStatus"
import { useRouter } from "next/navigation"
import HistoryPage from "./history/HistoryPage"
import { useTranslation } from "react-i18next"
import { authStore } from "@/contexts/authStore"
import { WILAYAS } from "@/constants/wilayas"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import ProfileSkeleton from "@/components/skeletons/ProfileSkeleton"
import VerificationPopup from "@/components/VerificationPopup"

const ProfilePageWrapper = () => {
    const [show, setShow] = useState(false)
    const [check, setCheck] = useState(false)

    return (
        <SocketProvider setShow={setShow} setCheck={setCheck}>
            <div className={`${show && "AllPages"}`}>
                <RequestProvider>
                    <ProfilePage />
                </RequestProvider>
            </div>
        </SocketProvider>
    )
}

interface ProfileFormData {
    firstName: string
    lastName: string
    email: string
    phone: string
    rate: number
    wilaya: string
    secteur: string
    socialReason: string
    jobTitle: string
    entity: string
}

interface AvatarData {
    fullUrl?: string;
    url?: string;
    _id?: string;
    filename?: string;
    [key: string]: any; // Allow any additional properties
}

// import app, { getSellerUrl } from '@/config';
import app, { getSellerUrl, DEV_SERVER_URL } from '@/config';

const API_BASE_URL = app.baseURL;
const STATIC_URL = app.route;
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const DEV_SERVER_PATTERN = new RegExp(escapeRegExp(DEV_SERVER_URL), 'g');

const getImageUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('http')) {
         // Fix localhost without port if appearing (backend bug workaround)
         if (url.startsWith('http://localhost/')) {
             return url.replace('http://localhost/', 'http://localhost:3000/');
         }
         return url;
    }
    // If relative path /static/...
    if (url.startsWith('/static')) {
        // API_BASE_URL likely ends with /
        return `${API_BASE_URL}${url.startsWith('/') ? url.slice(1) : url}`;
    }
    return url;
};

function ProfilePage() {
    const { t } = useTranslation();
    const { auth, isLogged, isReady, initializeAuth, set, fetchFreshUserData } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const { identityStatus, isLoading: isLoadingIdentity } = useIdentityStatus();
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordChanging, setIsPasswordChanging] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isUploadingCover, setIsUploadingCover] = useState(false);
    const [coverKey, setCoverKey] = useState(Date.now());
    const [avatarKey, setAvatarKey] = useState(Date.now());
    const [activeTab, setActiveTab] = useState("personal-info");
    const [formData, setFormData] = useState<ProfileFormData>({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        rate: 0,
        wilaya: "",
        secteur: "",
        socialReason: "",
        jobTitle: "",
        entity: "",
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    // Document management state
    // Refactored to React Query
    const queryClient = useQueryClient();
    const { data: identityData, isLoading: isLoadingDocuments } = useQuery({
        queryKey: ['identity'],
        queryFn: async () => {
            try {
                const response = await IdentityAPI.getMyIdentity();
                if (response.success) return response.data || null;
                return null;
            } catch (error: any) {
                // If 404 or just validation error, return null to show "start verification" UI
                if (error.response?.status === 404) return null;
                // Otherwise throw to let React Query handle error state (or ignore if you want to mask it)
                // For now, returning null on error to match previous behavior of "not found" = "clean state"
                return null;
            }
        },
        enabled: activeTab === 'documents',
        staleTime: Infinity,
    });
    const identity = (identityData || null) as any;

    // Remove: const [identity, setIdentity] = useState<any>(null);
    // Remove: const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
    const [isUploadingDocument, setIsUploadingDocument] = useState<string | null>(null);
    const [uploadingFile, setUploadingFile] = useState<File | null>(null);
    const documentFileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
    const [activeUpgradeSection, setActiveUpgradeSection] = useState<'verified' | 'certified' | null>(null);
    const [isSubmittingIdentity, setIsSubmittingIdentity] = useState(false);
    const [showVerificationPopup, setShowVerificationPopup] = useState(false);

    // Document field configurations
    const requiredDocuments = [
        {
            key: 'registreCommerceCarteAuto',
            label: t('profile.documents.rcOthers') || 'RC/ Autres',
            description: t('profile.documents.rcOthersDesc') || 'Registre de commerce ou autres documents (requis avec NIF/N° Articles)',
            required: true
        },
        {
            key: 'nifRequired',
            label: t('profile.documents.nifArticles') || 'NIF/N° Articles',
            description: t('profile.documents.nifArticlesDesc') || 'NIF ou Numéro d\'articles (requis avec RC/ Autres)',
            required: true
        },
        {
            key: 'carteFellah',
            label: t('profile.documents.carteFellah') || 'Carte Fellah',
            description: t('profile.documents.carteFellahDesc') || 'Carte Fellah pour agriculteurs (peut être fournie seule)',
            required: true
        }
    ];

    const optionalDocuments = [
        {
            key: 'nis',
            label: t('profile.documents.nis') || 'NIS',
            description: t('profile.documents.nisDesc') || 'Numéro d\'identification sociale',
            required: false
        },
        {
            key: 'numeroArticle',
            label: t('profile.documents.articleNumber') || 'Numéro d\'article',
            description: t('profile.documents.articleNumberDesc') || 'Numéro d\'article fiscal',
            required: false
        },
        {
            key: 'c20',
            label: t('profile.documents.certificateC20') || 'Certificat C20',
            description: t('profile.documents.certificateC20Desc') || 'Document C20',
            required: false
        },
        {
            key: 'misesAJourCnas',
            label: t('profile.documents.cnasUpdates') || 'Mises à jour CNAS/CASNOS',
            description: t('profile.documents.cnasUpdatesDesc') || 'Mises à jour CNAS/CASNOS et CACOBAPT',
            required: false
        },
        {
            key: 'last3YearsBalanceSheet',
            label: t('profile.documents.last3YearsBalance') || 'Bilans des 3 dernières années',
            description: t('profile.documents.last3YearsBalanceDesc') || 'Bilans financiers des trois dernières années',
            required: false
        },
        {
            key: 'certificates',
            label: t('profile.documents.certificates') || 'Certificats',
            description: t('profile.documents.certificatesDesc') || 'Certificats professionnels ou autres documents complémentaires',
            required: false
        },
        {
            key: 'paymentProof',
            label: t('profile.documents.paymentProof') || 'Preuve de paiement',
            description: t('profile.documents.paymentProofDesc') || 'Justificatif de paiement de souscription',
            required: false
        }
    ];

    // Initialize form data when auth.user changes
    useEffect(() => {
        if (auth.user) {
            setFormData({
                firstName: auth.user.firstName || "",
                lastName: auth.user.lastName || "",
                email: auth.user.email || "",
                phone: auth.user.phone || "",
                rate: auth.user.rate || 0,
                wilaya: auth.user.wilaya || "",
                secteur: auth.user.secteur || "",
                socialReason: auth.user.socialReason || "",
                jobTitle: auth.user.jobTitle || "",
                entity: auth.user.entity || "",
            });
        }
    }, [auth.user]);

    // Check for first-login verification popup flag
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const shouldShowPopup = localStorage.getItem('showVerificationPopup');
            if (shouldShowPopup === 'true') {
                setShowVerificationPopup(true);
                localStorage.removeItem('showVerificationPopup');
            }
        }
    }, []);

    const getAvatarUrl = (avatar: AvatarData | string): string => {
        if (typeof avatar === 'string') {
            // Handle string avatar (direct URL or path)
            if (avatar.startsWith('http')) {
                // Full URL - replace localhost with production API URL from config
                // return avatar.replace('http://localhost:3000', API_BASE_URL.replace(/\/$/, ''));
                return avatar.replace(DEV_SERVER_URL, API_BASE_URL.replace(/\/$/, ''));
            } else {
                // Relative path - ensure we use the correct base URL
                const cleanPath = avatar.startsWith('/') ? avatar.substring(1) : avatar;
                return `${API_BASE_URL}/static/${cleanPath}`;
            }
        }

        if (avatar?.fullUrl) {
            // return avatar.fullUrl.replace('http://localhost:3000', API_BASE_URL.replace(/\/$/, ''));
            return avatar.fullUrl.replace(DEV_SERVER_URL, API_BASE_URL.replace(/\/$/, ''));
        }

        if (avatar?.url) {
            if (avatar.url.startsWith('http')) {
                // return avatar.url.replace('http://localhost:3000', API_BASE_URL.replace(/\/$/, ''));
                return avatar.url.replace(DEV_SERVER_URL, API_BASE_URL.replace(/\/$/, ''));
            } else {
                // Ensure proper URL construction
                const cleanPath = avatar.url.startsWith('/') ? avatar.url.substring(1) : avatar.url;
                return `${API_BASE_URL}/static/${cleanPath}`;
            }
        }

        if (avatar?.filename) {
            return `${API_BASE_URL}/static/${avatar.filename}`;
        }

        return '/assets/images/avatar.jpg';
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const handleCoverClick = () => {
        if (coverInputRef.current) {
            coverInputRef.current.click();
        }
    };

    const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (e.g., max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            enqueueSnackbar(t("profile.imageTooLarge") || "Image too large (max 5MB)", { variant: "error" });
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            enqueueSnackbar(t("profile.invalidFileType") || "Please upload an image file", { variant: "error" });
            return;
        }

        setIsUploadingCover(true);
        try {
            const formDataToUpload = new FormData();
            formDataToUpload.append('cover', file);

            const response = await UserAPI.uploadCover(formDataToUpload);

            if (response.success) {
                enqueueSnackbar(t("profile.coverUpdated") || "Cover photo updated successfully", { variant: "success" });
                setCoverKey(Date.now()); // Force refresh
                await fetchFreshUserData(); // Refresh user data
            }
        } catch (error: any) {
            console.error("Cover upload error:", error);
            enqueueSnackbar(error.message || t("profile.coverUpdateFailed") || "Failed to update cover photo", { variant: "error" });
        } finally {
            setIsUploadingCover(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            console.log('🔄 Updating profile with data:', formData);

            const response = await UserAPI.updateProfile(formData);
            console.log('✅ Profile update response:', response);

            if (response) {
                let updatedUser;

                if (response.user) {
                    updatedUser = response.user;
                } else if (response.data) {
                    updatedUser = response.data as any;
                } else {
                    updatedUser = response as any;
                }

                if (updatedUser) {
                    const currentUser = auth.user;

                    const mergedUser = {
                        ...currentUser,
                        _id: updatedUser._id || updatedUser.id || currentUser?._id,
                        firstName: updatedUser.firstName || formData.firstName || currentUser?.firstName || '',
                        lastName: updatedUser.lastName || formData.lastName || currentUser?.lastName || '',
                        email: updatedUser.email || currentUser?.email || '',
                        type: updatedUser.accountType || updatedUser.type || currentUser?.type || 'CLIENT',
                        phone: updatedUser.phone || formData.phone || currentUser?.phone,
                        wilaya: updatedUser.wilaya || formData.wilaya || currentUser?.wilaya,
                        secteur: updatedUser.secteur || formData.secteur || currentUser?.secteur,
                        socialReason: updatedUser.socialReason || formData.socialReason || currentUser?.socialReason,
                        jobTitle: updatedUser.jobTitle || formData.jobTitle || currentUser?.jobTitle,
                        entity: updatedUser.entity || formData.entity || currentUser?.entity,
                        avatar: updatedUser.avatar || currentUser?.avatar,
                        rate: currentUser?.rate || 1,
                        isPhoneVerified: (currentUser as any)?.isPhoneVerified,
                        isVerified: (currentUser as any)?.isVerified,
                        isCertified: (currentUser as any)?.isCertified,
                        isHasIdentity: currentUser?.isHasIdentity,
                        isActive: (currentUser as any)?.isActive,
                        isBanned: (currentUser as any)?.isBanned,
                        photoURL: currentUser?.photoURL,
                        fullName: (currentUser as any)?.fullName
                    };

                    console.log('👤 Merged user data:', mergedUser);

                    set({
                        tokens: auth.tokens,
                        user: mergedUser
                    });

                    enqueueSnackbar(t('profile.updateSuccess') || 'Profile updated successfully', { variant: 'success' });
                    setIsEditing(false);
                }
            } else {
                console.error('❌ No response received from updateProfile');
                throw new Error('No response from server');
            }
        } catch (error: any) {
            console.error('❌ Error updating profile:', error);

            if (error.response?.status === 401) {
                enqueueSnackbar(t('profile.sessionExpired') || 'Session expired', { variant: 'error' });
                set({ tokens: undefined, user: undefined });
                router.push("/auth/login");
            } else {
                const errorMessage = error.response?.data?.message || error.message || t('profile.updateFailed') || 'Failed to update profile';
                enqueueSnackbar(errorMessage, { variant: "error" });
            }
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
            console.log('🔐 Changing password...');

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
            console.error('❌ Error changing password:', error);

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

    const handleAvatarClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            console.log('❌ No file selected');
            return;
        }

        console.log('📄 Selected file:', {
            name: file.name,
            size: file.size,
            type: file.type
        });

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            enqueueSnackbar('File size too large. Please select an image smaller than 5MB', { variant: 'error' });
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            enqueueSnackbar('Please select a valid image file (JPEG, PNG, GIF, WebP)', { variant: 'error' });
            return;
        }

        setIsUploadingAvatar(true);

        try {
            console.log('🖼️ Uploading avatar...');

            const formDataToUpload = new FormData();
            formDataToUpload.append('avatar', file);
            const response = await UserAPI.uploadAvatar(formDataToUpload);

                console.log('✅ Avatar upload response:', response);
                console.log('📦 Avatar user data:', response?.user?.avatar);

                if (response && response.success) {
                    // Clear the input immediately to prevent re-triggering
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }

                    // Get the updated user data
                    const updatedUser = response.user || response.data;
                    const responseWithAttachment = response as any; // Type assertion for attachment property
                    console.log('✅ Avatar uploaded successfully. Updated user:', updatedUser);
                    console.log('✅ Updated user avatar:', updatedUser?.avatar);
                    console.log('✅ Response attachment:', (response as any)?.attachment);

                    // Update auth state with new user data including avatar
                    if (updatedUser) {
                        const currentUser = auth.user;
                        
                        // Ensure avatar has proper URL format
                        let avatarObj = updatedUser.avatar;
                        
                        // If response has attachment info, use it to construct proper avatar URL
                        if (responseWithAttachment?.attachment) {
                            const attachment = responseWithAttachment.attachment;
                        const normalizedUrl = attachment.url?.startsWith('http') 
                            ? attachment.url 
                            : `${API_BASE_URL.replace(/\/$/, '')}${attachment.url?.startsWith('/') ? attachment.url : '/static/' + attachment.url}`;
                        
                        avatarObj = {
                            _id: attachment._id,
                            url: attachment.url,
                            filename: attachment.filename,
                            fullUrl: attachment.fullUrl ? normalizeUrl(attachment.fullUrl) : normalizedUrl
                        };
                    }
                    
                    // Construct photoURL from avatar if not present
                    let photoURL = updatedUser.photoURL;
                    if (!photoURL && avatarObj) {
                        const avatar = avatarObj as any;
                        if (avatar.fullUrl) {
                            photoURL = normalizeUrl(avatar.fullUrl);
                        } else if (avatar.url) {
                            photoURL = normalizeUrl(avatar.url);
                        } else if (avatar.filename) {
                            photoURL = normalizeUrl(avatar.filename);
                        }
                    } else if (photoURL) {
                        photoURL = normalizeUrl(photoURL);
                    }
                    
                    const mergedUser = {
                        ...currentUser,
                        ...updatedUser,
                        avatar: avatarObj || currentUser?.avatar,
                        photoURL: photoURL || currentUser?.photoURL,
                        type: (updatedUser.type || updatedUser.accountType || currentUser?.type || 'CLIENT') as any,
                    };
                    
                    console.log('👤 Merged user with avatar:', mergedUser);
                    console.log('👤 Merged user avatar:', mergedUser.avatar);
                    console.log('👤 Merged user photoURL:', mergedUser.photoURL);
                    
                    set({
                        user: mergedUser as any,
                        tokens: auth.tokens
                    });
                }

                // Force a cache-bust for the avatar by updating the key
                setAvatarKey(Date.now());

                // Show success message
                enqueueSnackbar(response.message || t("avatarUpdated") || "Avatar updated successfully", { variant: "success" });

                // Fetch fresh user data to ensure consistency
                setTimeout(async () => {
                    try {
                await fetchFreshUserData();
                    } catch (err) {
                        console.warn('⚠️ Error refreshing user data after avatar upload:', err);
                    }
                }, 500);
            } else {
                console.error('❌ Upload response indicates failure:', response);
                enqueueSnackbar(response?.message || 'Avatar upload failed - no success response', { variant: "error" });
            }
        } catch (error: any) {
            console.error('❌ Error uploading avatar:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to upload avatar';
            enqueueSnackbar(errorMessage, { variant: "error" });
        } finally {
            setIsUploadingAvatar(false);
            // Ensure input is cleared
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleStartResellerConversion = () => {
        router.push("/become-reseller");
    };

    // Document management functions
    // fetchIdentity removed in favor of useQuery

    const handleFileSelect = (fieldKey: string, file: File) => {
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            enqueueSnackbar('Format de fichier non supporté. Utilisez JPG, PNG ou PDF.', { variant: 'error' });
            return;
        }

        // Validate file size (5MB max)
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
                // Create identity with this document (allow incremental uploads)
                const createResponse: any = await IdentityAPI.create(formData);
                
                if (createResponse && (createResponse._id || (createResponse.data && createResponse.data._id))) {
                    enqueueSnackbar('Document sauvegardé avec succès. L\'identité a été créée. Cliquez sur "Soumettre" pour envoyer pour vérification.', { variant: 'success' });
                    // Invalidating query to refresh data
                    await queryClient.invalidateQueries({ queryKey: ['identity'] });
                } else {
                    throw new Error('Failed to create identity with document');
                }
            } else {
                // Update existing identity
                const updateResponse = await IdentityAPI.updateDocument(identity._id, fieldKey, file);
                
                if (updateResponse && updateResponse.success) {
                    enqueueSnackbar('Document sauvegardé avec succès. Cliquez sur "Soumettre" pour envoyer pour vérification.', { variant: 'success' });
                    // Invalidating query to refresh data
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

    const getDocumentUrl = (document: any): string => {
        if (!document) return '';
        if (document.fullUrl) return document.fullUrl;
        if (document.url) {
            if (document.url.startsWith('http')) {
                return document.url;
            }
            // Remove leading slash from document.url to avoid double slashes
            const cleanUrl = document.url.startsWith('/') ? document.url.substring(1) : document.url;
            return `${API_BASE_URL}${cleanUrl}`;
        }
        return '';
    };

    const getDocumentName = (document: any): string => {
        if (!document) return '';
        return document.filename || 'Document';
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Load identity when documents tab is active - managed by useQuery enabled prop
    /* useEffect(() => {
        if (activeTab === 'documents' && !identity) {
            fetchIdentity();
        }
    }, [activeTab]); */

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
                await queryClient.invalidateQueries({ queryKey: ['identity'] }); // Refresh to get updated status
            } else {
                throw new Error(response?.message || 'Failed to submit identity');
            }
        } catch (error: any) {
            console.error('Error submitting identity:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la soumission des documents';
            enqueueSnackbar(errorMessage, { variant: 'error' });
        } finally {
            setIsSubmittingIdentity(false);
        }
    };

    // Helper function to render document cards
    const renderDocumentCards = (documents: any[], sectionTitle: string, isRequired: boolean) => {
        return (
            <div className="modern-document-section">
                <div className="modern-document-section-header">
                    <h3 className="modern-document-section-title">
                        <i className={`bi-${isRequired ? 'exclamation-triangle-fill' : 'plus-circle-fill'}`}></i>
                        {sectionTitle}
                    </h3>
                    <div className={`modern-document-section-badge ${isRequired ? 'required' : 'required'}`}>
                        {isRequired ? 'Obligatoire' : 'Requis'}
                    </div>
                </div>
                
                {isRequired && (
                    <div className="modern-document-optional-note">
                        <div className="modern-document-note-card">
                            <i className="bi-info-circle-fill"></i>
                            <div className="modern-document-note-content">
                                <h4>{t("profile.documents.verificationNoteTitle") || "Vérification"}</h4>
                                <p>
                                    {t("profile.documents.verificationRequirement") || "Fournir (RC/ Autres + NIF) ou (Carte Fellah uniquement)."}
                                </p>
                                <p>
                                    {t("profile.documents.verificationSaveNote") || "Cliquez sur \"Soumettre\" pour envoyer à l'administrateur."}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                
                {!isRequired && (
                    <div className="modern-document-optional-note">
                        <div className="modern-document-note-card">
                            <i className="bi-info-circle-fill"></i>
                            <div className="modern-document-note-content">
                                <h4>{t("profile.documents.certificationNoteTitle") || "Certification"}</h4>
                                <p>
                                    {t("profile.documents.certificationRequirement") || "Ajoutez ces documents pour la certification professionnelle."}
                                </p>
                                <p>
                                    {t("profile.documents.certificationSaveNote") || "Cliquez sur \"Soumettre\" pour envoyer à l'administrateur."}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="modern-document-grid">
                    {documents.map((field, index) => {
                        const document = identity ? identity[field.key] : null;
                        const isUploadingThisField = isUploadingDocument === field.key;
                        const hasDocument = document && document.url;

                        return (
                            <motion.div
                                key={field.key}
                                className={`modern-document-card ${hasDocument ? 'has-document' : 'no-document'} ${isUploadingThisField ? 'uploading' : ''} ${isRequired ? 'required-card' : 'optional-card'}`}
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
                                            {document.mimetype?.startsWith('image/') ? (
                                                <div className="modern-document-image-preview">
                                                    <img 
                                                        src={getDocumentUrl(document)} 
                                                        alt={getDocumentName(document)}
                                                        className="modern-document-thumbnail"
                                                        onClick={() => window.open(getDocumentUrl(document), '_blank')}
                                                        onError={(e) => {
                                                            // Fallback to icon if image fails to load
                                                            e.currentTarget.style.display = 'none';
                                                            if (e.currentTarget.nextElementSibling) {
                                                                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                                            }
                                                        }}
                                                    />
                                                    <div className="modern-document-icon-fallback" style={{ display: 'none' }}>
                                                        <i className="bi-file-earmark-image"></i>
                                                    </div>
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
                                        ref={el => { documentFileInputRefs.current[field.key] = el; }}
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
                                                Upload en cours...
                                            </>
                                        ) : hasDocument ? (
                                            <>
                                                <i className="bi-arrow-clockwise"></i>
                                                Remplacer
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi-upload"></i>
                                                Ajouter
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

                {/* Submit button for required documents section - only show when documents are ready */}
                {isRequired && identity && identity._id && (() => {
                    const hasRc = identity.registreCommerceCarteAuto && ((identity.registreCommerceCarteAuto as any).url || (identity.registreCommerceCarteAuto as any).fullUrl);
                    const hasNif = identity.nifRequired && ((identity.nifRequired as any).url || (identity.nifRequired as any).fullUrl);
                    const hasCarteFellah = identity.carteFellah && ((identity.carteFellah as any).url || (identity.carteFellah as any).fullUrl);
                    const canSubmit = (hasRc && hasNif) || hasCarteFellah;
                    
                    // Don't show button if documents aren't ready for submission
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
                                        Soumission...
                                    </>
                                ) : identity?.status === 'WAITING' ? (
                                    <>
                                        <i className="bi-clock-history" style={{ marginRight: '0.5rem' }}></i>
                                        En attente de vérification
                                    </>
                                ) : identity?.status === 'DONE' ? (
                                    <>
                                        <i className="bi-check-circle-fill" style={{ marginRight: '0.5rem' }}></i>
                                        Vérifié
                                    </>
                                ) : (
                                    <>
                                        <i className="bi-send-fill" style={{ marginRight: '0.5rem' }}></i>
                                        Soumettre pour vérification
                                    </>
                                )}
                            </motion.button>
                        </div>
                    );
                })()}

                {/* Submit button for optional documents section - show when at least one optional document is uploaded */}
                {!isRequired && identity && identity._id && (() => {
                    // Check if any optional document is uploaded
                    const optionalDocKeys = ['nis', 'numeroArticle', 'c20', 'misesAJourCnas', 'last3YearsBalanceSheet', 'certificates', 'identityCard'];
                    const hasAnyOptionalDoc = optionalDocKeys.some(key => {
                        const doc = identity[key];
                        return doc && ((doc as any).url || (doc as any).fullUrl);
                    });
                    
                    // Don't show button if no optional documents are uploaded
                    if (!hasAnyOptionalDoc) return null;
                    
                    const certificationStatus = (identity as any).certificationStatus || 'DRAFT';
                    const isCertificationWaiting = certificationStatus === 'WAITING';
                    const isCertificationDone = certificationStatus === 'DONE';
                    
                    return (
                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                            <motion.button
                                className="modern-btn modern-btn-primary"
                                onClick={async () => {
                                    if (!identity || !identity._id) {
                                        enqueueSnackbar('Veuillez d\'abord télécharger au moins un document', { variant: 'warning' });
                                        return;
                                    }

                                    try {
                                        setIsSubmittingIdentity(true);
                                    const response = await IdentityAPI.submitCertification(identity._id);
                                        
                                        if (response && response.success) {
                                            enqueueSnackbar(
                                                response.message || 'Documents de certification soumis avec succès. En attente de vérification par l\'administrateur.',
                                                { variant: 'success' }
                                            );
                                            await queryClient.invalidateQueries({ queryKey: ['identity'] }); // Refresh to get updated status
                                        } else {
                                            throw new Error(response?.message || 'Failed to submit certification');
                                        }
                                    } catch (error: any) {
                                        console.error('Error submitting certification:', error);
                                        const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la soumission des documents de certification';
                                        enqueueSnackbar(errorMessage, { variant: 'error' });
                                    } finally {
                                        setIsSubmittingIdentity(false);
                                    }
                                }}
                                disabled={isSubmittingIdentity || isCertificationWaiting || isCertificationDone}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    padding: '0.8rem 2rem',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    minWidth: '200px',
                                    opacity: (isCertificationWaiting || isCertificationDone) ? 0.6 : 1,
                                    cursor: (isCertificationWaiting || isCertificationDone) ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {isSubmittingIdentity ? (
                                    <>
                                        <div className="modern-spinner-sm" style={{ marginRight: '0.5rem' }}></div>
                                        Soumission...
                                    </>
                                ) : isCertificationWaiting ? (
                                    <>
                                        <i className="bi-clock-history" style={{ marginRight: '0.5rem' }}></i>
                                        {t("profile.documents.pendingCertification") || "En attente de certification"}
                                    </>
                                ) : isCertificationDone ? (
                                    <>
                                        <i className="bi-award-fill" style={{ marginRight: '0.5rem' }}></i>
                                        {t("profile.documents.certified") || "Certifié"}
                                    </>
                                ) : (
                                    <>
                                        <i className="bi-send-fill" style={{ marginRight: '0.5rem' }}></i>
                                        {t("profile.documents.submitForCertification") || "Soumettre pour certification"}
                                    </>
                                )}
                            </motion.button>
                        </div>
                    );
                })()}
            </div>
        );
    };

    // Helper to normalize URL - always return full URL with correct port
    const normalizeUrl = React.useCallback((url: string): string => {
        if (!url || url.trim() === '') return '';
        
        const cleanUrl = url.trim();
        const apiBase = API_BASE_URL.replace(/\/$/, '');

        // Check if URL is from localhost (various ports)
        if (cleanUrl.match(/http:\/\/localhost:\d+/) || cleanUrl.startsWith('http://localhost')) {
            // Extract the path from the localhost URL
            try {
                // If it's a full URL, parse it to get the pathname
                if (cleanUrl.startsWith('http')) {
                    const urlObj = new URL(cleanUrl);
                    return `${apiBase}${urlObj.pathname}`;
                }
            } catch (e) {
                console.error('Failed to parse URL:', cleanUrl);
            }
            // Fallback for malformed but localhost-containing strings
            return cleanUrl.replace(/http:\/\/localhost:\d+/, apiBase)
                          .replace('http://localhost', apiBase);
        }
        
        // If already a full HTTP/HTTPS URL (and not localhost), return it
        if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
            return cleanUrl;
        }
        
        // Handle relative paths
        if (cleanUrl.startsWith('/static/')) {
            return `${apiBase}${cleanUrl}`;
        }
        
        if (cleanUrl.startsWith('/')) {
            return `${apiBase}/static${cleanUrl}`;
        }
        
        // If no leading slash, assume it's a filename
        return `${apiBase}/static/${cleanUrl}`;
    }, []);

    // Construct avatar source with multiple fallback options
    const getAvatarSrc = () => {
        if (!auth.user) return '/assets/images/avatar.jpg';
        
        console.log('🖼️ Constructing avatar URL from:', auth.user);
        console.log('🖼️ Avatar object:', auth.user.avatar);
        console.log('🖼️ photoURL:', auth.user.photoURL);
        
        // Priority 1: photoURL (direct from backend)
        if (auth.user.photoURL && auth.user.photoURL.trim() !== "") {
            const cleanUrl = normalizeUrl(auth.user.photoURL);
            if (cleanUrl && !cleanUrl.includes('mock-images')) {
                console.log('📸 Using photoURL:', cleanUrl);
                return `${cleanUrl}?v=${avatarKey}`;
            }
        }
        
        // Priority 2: avatar object with fullUrl
        if (auth.user.avatar && 'fullUrl' in auth.user.avatar && auth.user.avatar.fullUrl) {
            const avatarUrl = normalizeUrl((auth.user.avatar as any).fullUrl);
            if (avatarUrl && !avatarUrl.includes('mock-images')) {
                console.log('📸 Using avatar.fullUrl:', avatarUrl);
                return `${avatarUrl}?v=${avatarKey}`;
            }
        }
        
        // Priority 3: avatar.url
        if (auth.user.avatar?.url) {
            const avatarUrl = normalizeUrl(auth.user.avatar.url);
            if (avatarUrl && !avatarUrl.includes('mock-images')) {
                console.log('📸 Using avatar.url:', avatarUrl);
                return `${avatarUrl}?v=${avatarKey}`;
            }
        }
        
        // Priority 4: avatar.filename
        if (auth.user.avatar?.filename) {
            const avatarUrl = normalizeUrl(auth.user.avatar.filename);
            if (avatarUrl && !avatarUrl.includes('mock-images')) {
                console.log('📸 Using avatar.filename:', avatarUrl);
                return `${avatarUrl}?v=${avatarKey}`;
            }
        }
        
        // Priority 5: fallback
        console.log('📸 Using local default avatar');
        return '/assets/images/avatar.jpg';
    };
    
    const avatarSrc = getAvatarSrc();

    // Show skeleton loading while authenticating
    if (!isReady) {
        return (
            <>
                <Header />
                <div style={{ paddingTop: '100px', minHeight: '80vh' }}>
                    <ProfileSkeleton />
                </div>
                <Footer />
            </>
        );
    }

    // Show login prompt if not logged in
    if (isReady && !isLogged) {
        return (
            <div className="profile-login-required">
                <div className="login-prompt">
                    <h2>Authentication Required</h2>
                    <p>Please log in to access your profile.</p>
                    <button onClick={() => router.push("/auth/login")}>Go to Login</button>
                </div>
            </div>
        );
    }

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

                {/* Page Header with Title */}
                <div className="modern-profile-container">
                    {/* New Profile Cover Section */}
                    <motion.div 
                        className="profile-cover-wrapper"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        style={{ marginBottom: '1rem', position: 'relative' }}
                    >
                        {/* Cover Photo */}
                        <div className="profile-cover-photo" style={{ 
                            height: '250px', 
                            width: '100%', 
                            borderRadius: '16px',
                            overflow: 'hidden',
                            position: 'relative',
                            backgroundColor: '#f3f4f6',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}>
                            {auth.user?.coverPhotoURL ? (
                                <>
                                <img 
                                    key={coverKey}
                                    src={`${getImageUrl(auth.user.coverPhotoURL)}${getImageUrl(auth.user.coverPhotoURL)?.includes('?') ? '&' : '?'}t=${coverKey}`} 
                                    alt="Cover" 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                />
                                </>
                            ) : (
                                <div 
                                    onClick={handleCoverClick}
                                    style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        background: '#f8fafc', // Very light slate/gray, almost white but distinct from paper
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#94a3b8',
                                        fontSize: '1.2rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        border: '2px dashed #e2e8f0',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#f1f5f9';
                                        e.currentTarget.style.borderColor = '#cbd5e1';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#f8fafc';
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                    }}
                                >
                                    <i className="bi bi-camera" style={{ marginRight: '8px', fontSize: '1.5rem' }}></i>
                                    <span>{t("profile.addCoverPhoto") || "Click to add cover photo"}</span>
                                </div>
                            )}

                            <input
                                type="file"
                                ref={coverInputRef}
                                style={{ display: "none" }}
                                accept="image/*"
                                onChange={handleCoverChange}
                            />

                            <motion.button
                                onClick={handleCoverClick}
                                disabled={isUploadingCover}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    position: 'absolute',
                                    top: '16px',
                                    right: '16px',
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    backdropFilter: 'blur(8px)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 16px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#1f2937',
                                    zIndex: 10
                                }}
                            >
                                {isUploadingCover ? (
                                    <motion.i 
                                        className="bi bi-arrow-repeat"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                    ></motion.i>
                                ) : (
                                    <i className="bi bi-camera-fill"></i>
                                )}
                                <span>{auth.user?.coverPhotoURL ? (t("profile.changeCover") || "Change Cover") : (t("profile.addCover") || "Add Cover")}</span>
                            </motion.button>
                        </div>

                        {/* Profile Bar (Avatar + Info) */}
                        <div className="profile-info-bar" style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            padding: '0 20px',
                            marginTop: '-40px',
                            position: 'relative',
                            zIndex: 20
                        }}>
                            {/* Avatar */}
                            <div className="profile-avatar-wrapper" style={{ position: 'relative', marginRight: '24px' }}>
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
                                        key={avatarKey}
                                        src={avatarSrc} 
                                        alt="Avatar" 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        onError={(e) => {
                                            const target = e.currentTarget;
                                            if (!target.src.includes('avatar.jpg')) {
                                                target.src = '/assets/images/avatar.jpg';
                                            }
                                        }}
                                    />
                                </div>

                                {/* Golden Rating Badge - Restored Position */}
                                {auth.user?.rate && auth.user.rate > 0 && (
                                     <motion.div
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                                        style={{
                                            position: 'absolute',
                                            top: '0',
                                            right: '0',
                                            transform: 'translate(15%, -15%)',
                                            zIndex: 25
                                        }}
                                     >
                                         <div style={{
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
                                            fontWeight: '700'
                                         }}>
                                             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
                                                <i className="bi bi-star-fill" style={{ fontSize: '10px', marginBottom: '1px' }}></i>
                                                <span>{Math.round(auth.user.rate * 10) / 10}</span>
                                             </div>
                                         </div>
                                     </motion.div>
                                )}
                                
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: "none" }}
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                />
                                
                                <motion.button
                                    onClick={handleAvatarClick}
                                    disabled={isUploadingAvatar}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    style={{
                                        position: 'absolute',
                                        bottom: '6px',
                                        right: '6px',
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '50%',
                                        background: '#4f46e5',
                                        border: '3px solid #ffffff',
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    {isUploadingAvatar ? (
                                        <motion.i 
                                            className="bi bi-arrow-repeat" 
                                            style={{ fontSize: '16px' }}
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                        ></motion.i>
                                    ) : (
                                        <i className="bi bi-camera-fill" style={{ fontSize: '16px' }}></i>
                                    )}
                                </motion.button>
                            </div>

                            {/* User Info */}
                            <div className="user-info-content" style={{ paddingBottom: '0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <h1 style={{ 
                                    fontSize: '28px', 
                                    fontWeight: '800', 
                                    color: '#111827',
                                    margin: 0,
                                    lineHeight: 1.2,
                                    textShadow: '0 1px 2px rgba(255,255,255,1)'
                                }}>
                                    {auth.user?.socialReason || `${auth.user?.firstName} ${auth.user?.lastName}`}
                                </h1>
                                
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    {/* Badges */}
                                    {auth.user?.type === "PROFESSIONAL" && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '4px 10px',
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                color: 'white',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                                            }}
                                        >
                                            <i className="bi bi-star-fill" style={{ fontSize: '10px' }}></i>
                                            <span>PRO</span>
                                        </motion.div>
                                    )}
                                    
                                    {(auth.user as any)?.isVerified && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '4px 10px',
                                                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                                color: 'white',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                boxShadow: '0 2px 8px rgba(17, 153, 142, 0.3)'
                                            }}
                                        >
                                            <i className="bi bi-check-circle-fill" style={{ fontSize: '10px' }}></i>
                                            <span>VERIFIED</span>
                                        </motion.div>
                                    )}

                                    

                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Main Content Grid */}
                    <div className="modern-content-grid">
                        {/* Reseller Status Cards Section */}
                        {/* <motion.div
                            className="modern-reseller-section"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.0 }}
                        >
                            {/* Case 1: User is already a RESELLER */}
                            {/* {auth.user?.type === "RESELLER" && (
                                <motion.div
                                    className="modern-status-card reseller-active"
                                    whileHover={{
                                        scale: 1.02,
                                        boxShadow: "0 25px 50px rgba(34, 197, 94, 0.15)"
                                    }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <div className="card-background">
                                        <div className="success-gradient"></div>
                                    </div>
                                    <div className="card-content">
                                        <motion.div
                                            className="status-icon success"
                                            animate={{
                                                boxShadow: [
                                                    "0 0 0 0 rgba(34, 197, 94, 0.4)",
                                                    "0 0 0 20px rgba(34, 197, 94, 0)",
                                                    "0 0 0 0 rgba(34, 197, 94, 0)"
                                                ]
                                            }}
                                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                                        >
                                            <i className="bi bi-check-circle-fill"></i>
                                        </motion.div>
                                        <div className="status-text">
                                            <h3>You're a reseller</h3>
                                            <p>You have access to reseller features</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )} */}

                            {/* Case 2: User has identity but is NOT RESELLER - Wait for support */}
                            {/* {auth.user?.type !== "RESELLER" && auth.user?.isHasIdentity && (
                                <motion.div
                                    className="modern-status-card pending"
                                    whileHover={{
                                        scale: 1.02,
                                        boxShadow: "0 25px 50px rgba(245, 158, 11, 0.15)"
                                    }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <div className="card-background">
                                        <div className="warning-gradient"></div>
                                    </div>
                                    <div className="card-content">
                                        <motion.div
                                            className="status-icon warning"
                                            animate={{
                                                rotate: [0, 5, -5, 0]
                                            }}
                                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                                        >
                                            <i className="bi bi-clock-history"></i>
                                        </motion.div>
                                        <div className="status-text">
                                            <h3>Identity verified</h3>
                                            <p>Please wait while we upgrade your account</p>
                                        </div>
                                    </div>
                                    <div className="status-details">
                                        <div className="detail-item">
                                            <i className="bi bi-check-circle"></i>
                                            <span>Identity verification completed</span>
                                        </div>
                                        <div className="detail-item">
                                            <i className="bi bi-hourglass-split"></i>
                                            <span>Account upgrade in progress</span>
                                        </div>
                                        <div className="detail-item">
                                            <i className="bi bi-headset"></i>
                                            <span>We'll notify you when ready</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )} */}

                            {/* Case 3: User does NOT have identity and is NOT RESELLER - Show become reseller button */}
                            {/* {auth.user?.type !== "RESELLER" && !auth.user?.isHasIdentity && !isLoadingIdentity && (
                                <motion.div
                                    className="modern-status-card action-needed"
                                    whileHover={{
                                        scale: 1.02,
                                        boxShadow: "0 25px 50px rgba(59, 130, 246, 0.15)"
                                    }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <div className="card-background">
                                        <div className="primary-gradient"></div>
                                    </div>
                                    <div className="card-content">
                                        <motion.div
                                            className="status-icon primary"
                                            animate={{
                                                scale: [1, 1.05, 1]
                                            }}
                                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                                        >
                                            <i className="bi bi-arrow-up-circle"></i>
                                        </motion.div>
                                        <div className="status-text">
                                            <h3>Upgrade to reseller</h3>
                                            <p>Start selling and earning</p>
                                        </div>
                                    </div>
                                    <motion.button
                                        onClick={handleStartResellerConversion}
                                        className="modern-upgrade-btn"
                                        whileHover={{
                                            scale: 1.05,
                                            boxShadow: "0 15px 30px rgba(59, 130, 246, 0.3)"
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                        transition={{ type: "spring", stiffness: 400 }}
                                    >
                                        <span className="btn-text">Change account to reseller</span>
                                        <motion.i
                                            className="bi bi-arrow-right"
                                            animate={{ x: [0, 5, 0] }}
                                            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                                        />
                                    </motion.button>
                                </motion.div>
                            )} */}
                        {/* </motion.div> */}

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
                                    { id: "personal-info", icon: "bi-person-circle", label: t("profile.tabs.personalInfo") || "Personal information" },
                                    { id: "security", icon: "bi-shield-lock-fill", label: t("profile.tabs.security") || "Security" },
                                    { id: "documents", icon: "bi-file-earmark-text-fill", label: t("profile.tabs.documents") || "Documents" },
                                    { id: "notifications", icon: "bi-bell-fill", label: t("profile.tabs.notifications") || "Notifications" },
                                    { id: "history", icon: "bi-clock-history", label: t("profile.tabs.history") || "Offer history" }
                                ].map((tab, index) => (
                                    <motion.button
                                        key={tab.id}
                                        className={`modern-tab-btn ${activeTab === tab.id ? "active" : ""}`}
                                        onClick={() => setActiveTab(tab.id)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1.3 + (index * 0.1), type: "spring" }}
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

                            {/* Tab Content */}
                            <div className="modern-tab-content">
                                <AnimatePresence mode="wait">
                                    {/* Personal Info Tab */}
                                    {activeTab === "personal-info" && (
                                        <motion.div
                                            key="personal-info"
                                            className="modern-tab-content"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.6, type: "spring" }}
                                        >
                                            <div className="modern-section-card">
                                                <div className="section-header">
                                                    <div className="header-content">
                                                        <motion.div
                                                            className="header-icon"
                                                            whileHover={{ rotate: 10, scale: 1.1 }}
                                                            transition={{ type: "spring", stiffness: 300 }}
                                                        >
                                                            <i className="bi bi-person-circle"></i>
                                                        </motion.div>
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
                                                        transition={{ type: "spring", stiffness: 400 }}
                                                    >
                                                        <motion.i
                                                            className={`bi ${isEditing ? 'bi-x-circle' : 'bi-pencil-square'}`}
                                                            animate={{ rotate: isEditing ? 180 : 0 }}
                                                            transition={{ duration: 0.3 }}
                                                        />
                                                        <span>{isEditing ? t("common.cancel") : t("common.edit")}</span>
                                                    </motion.button>
                                                </div>

                                                <motion.form
                                                    onSubmit={handleSubmit}
                                                    className="modern-profile-form"
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.6, delay: 0.5 }}
                                                >
                                                    <div className="modern-form-grid">
                                                        <motion.div
                                                            className="modern-form-field"
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ duration: 0.5, delay: 0.6 }}
                                                        >
                                                            <label htmlFor="firstName">{t("profile.firstName") || "First name"}</label>
                                                            <input
                                                                type="text"
                                                                id="firstName"
                                                                name="firstName"
                                                                value={formData.firstName}
                                                                onChange={handleInputChange}
                                                                disabled={!isEditing}
                                                                required
                                                                placeholder="Enter your first name"
                                                            />
                                                        </motion.div>

                                                        <motion.div
                                                            className="modern-form-field"
                                                            initial={{ opacity: 0, x: 20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ duration: 0.5, delay: 0.7 }}
                                                        >
                                                            <label htmlFor="lastName">{t("profile.lastName") || "Last name"}</label>
                                                            <input
                                                                type="text"
                                                                id="lastName"
                                                                name="lastName"
                                                                value={formData.lastName}
                                                                onChange={handleInputChange}
                                                                disabled={!isEditing}
                                                                required
                                                                placeholder="Enter your last name"
                                                            />
                                                        </motion.div>

                                                        {/* Wilaya Field - Using Select from Constants */}
                                                        <motion.div
                                                            className="modern-form-field"
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ duration: 0.5, delay: 0.8 }}
                                                        >
                                                            <label htmlFor="wilaya">{t("profile.wilaya") || "Wilaya"}</label>
                                                            <select
                                                                id="wilaya"
                                                                name="wilaya"
                                                                value={formData.wilaya}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setFormData(prev => ({ ...prev, wilaya: val }));
                                                                }}
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
                                                                    transition: 'all 0.2s',
                                                                    cursor: isEditing ? 'pointer' : 'default',
                                                                    height: '48px'
                                                                }}
                                                            >
                                                                <option value="">Select Wilaya</option>
                                                                {WILAYAS.map((w, index) => (
                                                                    <option key={index} value={w}>{w}</option>
                                                                ))}
                                                            </select>
                                                        </motion.div>

                                                        {/* Social Reason */}
                                                        <motion.div
                                                            className="modern-form-field"
                                                            initial={{ opacity: 0, x: 20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ duration: 0.5, delay: 0.85 }}
                                                        >
                                                            <label htmlFor="socialReason">{t("profile.socialReason") || "Social Reason / Enterprise"}</label>
                                                            <input
                                                                type="text"
                                                                id="socialReason"
                                                                name="socialReason"
                                                                value={formData.socialReason}
                                                                onChange={handleInputChange}
                                                                disabled={!isEditing}
                                                                placeholder="Enter enterprise name"
                                                            />
                                                        </motion.div>

                                                        {/* Job Title */}
                                                        <motion.div
                                                            className="modern-form-field"
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ duration: 0.5, delay: 0.9 }}
                                                        >
                                                            <label htmlFor="jobTitle">{t("profile.jobTitle") || "Job Title"}</label>
                                                            <input
                                                                type="text"
                                                                id="jobTitle"
                                                                name="jobTitle"
                                                                value={formData.jobTitle}
                                                                onChange={handleInputChange}
                                                                disabled={!isEditing}
                                                                placeholder="Enter job title"
                                                            />
                                                        </motion.div>

                                                        {/* Secteur */}
                                                        <motion.div
                                                            className="modern-form-field"
                                                            initial={{ opacity: 0, x: 20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ duration: 0.5, delay: 0.95 }}
                                                        >
                                                            <label htmlFor="secteur">{t("profile.secteur") || "Sector"}</label>
                                                            <input
                                                                type="text"
                                                                id="secteur"
                                                                name="secteur"
                                                                value={formData.secteur}
                                                                onChange={handleInputChange}
                                                                disabled={!isEditing}
                                                                placeholder="Enter sector"
                                                            />
                                                        </motion.div>

                                                        {/* Entity */}
                                                        <motion.div
                                                            className="modern-form-field"
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ duration: 0.5, delay: 0.98 }}
                                                        >
                                                            <label htmlFor="entity">{t("profile.entity") || "Entity"}</label>
                                                            <input
                                                                type="text"
                                                                id="entity"
                                                                name="entity"
                                                                value={formData.entity}
                                                                onChange={handleInputChange}
                                                                disabled={!isEditing}
                                                                placeholder="Enter entity"
                                                            />
                                                        </motion.div>

                                                        <motion.div
                                                            className="modern-form-field"
                                                            initial={{ opacity: 0, x: 20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ duration: 0.5, delay: 0.9 }}
                                                        >
                                                            <label htmlFor="phone">{t("profile.phone") || "Phone"}</label>
                                                            <input
                                                                type="tel"
                                                                id="phone"
                                                                name="phone"
                                                                value={formData.phone}
                                                                onChange={handleInputChange}
                                                                disabled={!isEditing}
                                                                placeholder="Enter your phone number"
                                                            />
                                                        </motion.div>
                                                    </div>

                                                    {isEditing && (
                                                        <motion.div
                                                            className="modern-actions"
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ duration: 0.5, delay: 1.0 }}
                                                        >
                                                            <motion.button
                                                                type="button"
                                                                onClick={() => setIsEditing(false)}
                                                                className="modern-btn secondary"
                                                                whileHover={{ scale: 1.02 }}
                                                                whileTap={{ scale: 0.98 }}
                                                            >
                                                                <i className="bi bi-x-circle"></i>
                                                                <span>{t("common.cancel")}</span>
                                                            </motion.button>

                                                            <motion.button
                                                                type="submit"
                                                                disabled={isLoading}
                                                                className="modern-btn primary"
                                                                whileHover={{ scale: 1.02 }}
                                                                whileTap={{ scale: 0.98 }}
                                                            >
                                                                {isLoading ? (
                                                                    <>
                                                                        <div className="loading-spinner-lg"></div>
                                                                        <span>{t("profile.saving") || "Saving..."}</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <i className="bi bi-check-circle"></i>
                                                                        <span>{t("profile.saveChanges") || "Save changes"}</span>
                                                                    </>
                                                                )}
                                                            </motion.button>
                                                        </motion.div>
                                                    )}
                                                </motion.form>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Security Tab */}
                                    {activeTab === "security" && (
                                        <motion.div
                                            key="security"
                                            className="modern-tab-content"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.6, type: "spring" }}
                                        >
                                            <div className="modern-section-card">
                                                <div className="section-header">
                                                    <div className="header-content">
                                                        <motion.div
                                                            className="header-icon"
                                                            whileHover={{ rotate: 10, scale: 1.1 }}
                                                            transition={{ type: "spring", stiffness: 300 }}
                                                        >
                                                            <i className="bi bi-shield-lock-fill"></i>
                                                        </motion.div>
                                                        <div className="header-text">
                                                            <h2>Security</h2>
                                                            <p>Update your password and security settings</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <motion.form
                                                    onSubmit={handlePasswordSubmit}
                                                    className="modern-profile-form"
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.6, delay: 0.3 }}
                                                >
                                                    <div className="modern-form-grid">
                                                        {[
                                                            { name: "currentPassword", label: t("profile.currentPassword") || "Current password", icon: "bi-lock" },
                                                            { name: "newPassword", label: t("profile.newPassword") || "New password", icon: "bi-key" },
                                                            { name: "confirmPassword", label: t("profile.confirmPassword") || "Confirm password", icon: "bi-check-circle" }
                                                        ].map((field, index) => (
                                                            <motion.div
                                                                key={field.name}
                                                                className="modern-form-field"
                                                                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ duration: 0.5, delay: 0.4 + (index * 0.1) }}
                                                            >
                                                                <label htmlFor={field.name}>{field.label}</label>
                                                                <input
                                                                    type="password"
                                                                    id={field.name}
                                                                    name={field.name}
                                                                    value={passwordData[field.name as keyof typeof passwordData]}
                                                                    onChange={handlePasswordChange}
                                                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                                                />
                                                            </motion.div>
                                                        ))}
                                                    </div>

                                                    <motion.div
                                                        className="modern-actions"
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.5, delay: 0.8 }}
                                                    >
                                                        <motion.button
                                                            type="submit"
                                                            disabled={isPasswordChanging}
                                                            className="modern-btn primary"
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                        >
                                                            {isPasswordChanging ? (
                                                                <>
                                                                    <div className="loading-spinner-lg"></div>
                                                                    <span>Updating...</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <i className="bi bi-shield-check"></i>
                                                                    <span>Update password</span>
                                                                </>
                                                            )}
                                                        </motion.button>
                                                    </motion.div>
                                                </motion.form>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Documents Tab */}
                                    {activeTab === "documents" && (
                                        <motion.div
                                            key="documents"
                                            className="modern-tab-content"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.6, type: "spring" }}
                                        >
                                            <div className="modern-section">
                                                <div className="modern-section-header">
                                                    <h2 className="modern-section-title">
                                                        <i className="bi-file-earmark-text-fill"></i>
                                                        {t("profile.documents.management") || "Gestion des Documents"}
                                                    </h2>
                                                    <p className="modern-section-description">
                                                        {t("profile.documents.managementDesc") || "Gérez vos documents d'identité. Vous pouvez remplacer les documents existants ou ajouter de nouveaux documents optionnels."}
                                                    </p>
                                                </div>

                                                {isLoadingDocuments ? (
                                                    <div className="modern-loading">
                                                        <div className="modern-spinner"></div>
                                                        <p>{t("profile.documents.loading") || "Chargement des documents..."}</p>
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
                                                                {t("profile.documents.upgradeToVerified") || "Passer à Vérifié"}
                                                            </motion.button>
                                                            <motion.button
                                                                className={`modern-upgrade-btn ${activeUpgradeSection === 'certified' ? 'active' : ''}`}
                                                                onClick={() => setActiveUpgradeSection(activeUpgradeSection === 'certified' ? null : 'certified')}
                                                                whileHover={{ scale: 1.02 }}
                                                                whileTap={{ scale: 0.98 }}
                                                            >
                                                                <i className="bi-award"></i>
                                                                {t("profile.documents.upgradeToCertified") || "Passer à Certifié"}
                                                            </motion.button>
                                                        </div>

                                                        <AnimatePresence>
                                                            {activeUpgradeSection === 'verified' && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: 'auto' }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    transition={{ duration: 0.3 }}
                                                                >
                                                                    {renderDocumentCards(requiredDocuments, t("profile.documents.requiredForVerification") || "Documents Obligatoires pour Vérification", true)}
                                                                </motion.div>
                                                            )}
                                                            {activeUpgradeSection === 'certified' && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: 'auto' }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    transition={{ duration: 0.3 }}
                                                                >
                                                                    {renderDocumentCards(optionalDocuments, t("profile.documents.requiredForCertification") || "Documents requis pour certification", false)}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                        
                                                        {identity && (
                                                        <div className="modern-document-footer">
                                                            <div className="modern-document-status">
                                                                    <div className={`modern-status-badge ${identity.status?.toLowerCase() || 'waiting'}`}>
                                                                    <i className={`bi-${identity.status === 'DONE' ? 'check-circle-fill' : identity.status === 'REJECTED' ? 'x-circle-fill' : 'clock-fill'}`}></i>
                                                                    {t("profile.documents.status") || "Statut"}: {identity.status === 'DONE' ? t("profile.documents.approved") || 'Approuvé' : identity.status === 'REJECTED' ? t("profile.documents.rejected") || 'Rejeté' : t("profile.documents.pending") || 'En attente'}
                                                                </div>
                                                            </div>
                                                            <p className="modern-document-note">
                                                                <i className="bi-info-circle"></i>
                                                                {t("profile.documents.note") || "Les documents marqués d'un astérisque (*) sont obligatoires. Vous pouvez remplacer ou ajouter des documents à tout moment."}
                                                            </p>
                                                        </div>
                                                        )}
                                                        {!identity && (
                                                            <div className="modern-document-footer">
                                                                <p className="modern-document-note">
                                                                    <i className="bi-info-circle"></i>
                                                                    {t("profile.documents.clickButtonsNote") || "Cliquez sur les boutons ci-dessus pour voir les documents requis pour chaque niveau de vérification."}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* History Tab */}
                                    {activeTab === "history" && (
                                        <motion.div
                                            key="history"
                                            className="modern-tab-content"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.6, type: "spring" }}
                                        >
                                            <HistoryPage />
                                        </motion.div>
                                    )}

                                    {/* Notifications Tab */}
                                    {activeTab === "notifications" && (
                                        <motion.div
                                            key="notifications"
                                            className="modern-tab-content"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.6, type: "spring" }}
                                        >
                                            <div className="modern-section-card">
                                                <div className="section-header">
                                                    <div className="header-content">
                                                        <motion.div
                                                            className="header-icon"
                                                            whileHover={{ rotate: 10, scale: 1.1 }}
                                                            transition={{ type: "spring", stiffness: 300 }}
                                                        >
                                                            <i className="bi bi-bell-fill"></i>
                                                        </motion.div>
                                                        <div className="header-text">
                                                            <h2 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Notifications</h2>
                                                            <p style={{ fontSize: '0.75rem' }}>Manage your notification preferences</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <motion.div
                                                    className="modern-notifications-grid"
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.6, delay: 0.3 }}
                                                >
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
                                                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            transition={{
                                                                duration: 0.6,
                                                                delay: 0.4 + index * 0.15,
                                                                type: "spring",
                                                                stiffness: 100
                                                            }}
                                                            whileHover={{
                                                                scale: 1.03,
                                                                boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
                                                                y: -5
                                                            }}
                                                            whileTap={{ scale: 0.98 }}
                                                        >
                                                            <div className="notification-card-background">
                                                                <div
                                                                    className="card-gradient"
                                                                    style={{ background: notification.gradient }}
                                                                ></div>
                                                            </div>

                                                            <div className="notification-content">
                                                                <motion.div
                                                                    className={`notification-icon ${notification.color}`}
                                                                    whileHover={{
                                                                        rotate: 10,
                                                                        scale: 1.1
                                                                    }}
                                                                    transition={{ type: "spring", stiffness: 300 }}
                                                                >
                                                                    <motion.i
                                                                        className={notification.icon}
                                                                        animate={{
                                                                            scale: [1, 1.1, 1],
                                                                        }}
                                                                        transition={{
                                                                            duration: 2,
                                                                            repeat: Number.POSITIVE_INFINITY,
                                                                            delay: index * 0.3
                                                                        }}
                                                                    />
                                                                </motion.div>

                                                                <div className="notification-text">
                                                                    <motion.h3
                                                                        initial={{ opacity: 0, x: -10 }}
                                                                        animate={{ opacity: 1, x: 0 }}
                                                                        transition={{ delay: 0.5 + index * 0.1 }}
                                                                    >
                                                                        {notification.title}
                                                                    </motion.h3>
                                                                    <motion.p
                                                                        initial={{ opacity: 0, x: -10 }}
                                                                        animate={{ opacity: 1, x: 0 }}
                                                                        transition={{ delay: 0.6 + index * 0.1 }}
                                                                    >
                                                                        {notification.desc}
                                                                    </motion.p>
                                                                </div>
                                                            </div>

                                                            <motion.div
                                                                className="modern-switch-container"
                                                                whileHover={{ scale: 1.05 }}
                                                            >
                                                                <label className="modern-switch">
                                                                    <input
                                                                        type="checkbox"
                                                                        defaultChecked
                                                                        className="switch-input"
                                                                    />
                                                                    <motion.span
                                                                        className="switch-slider"
                                                                        whileTap={{ scale: 0.95 }}
                                                                    >
                                                                        <motion.span
                                                                            className="switch-thumb"
                                                                            layout
                                                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                                        />
                                                                    </motion.span>
                                                                </label>
                                                                <motion.div
                                                                    className="switch-glow"
                                                                    animate={{
                                                                        opacity: [0.5, 1, 0.5]
                                                                    }}
                                                                    transition={{
                                                                        duration: 2,
                                                                        repeat: Number.POSITIVE_INFINITY,
                                                                        delay: index * 0.5
                                                                    }}
                                                                />
                                                            </motion.div>
                                                        </motion.div>
                                                    ))}
                                                </motion.div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
            <Footer />
            
            {/* First-login verification popup */}
            {showVerificationPopup && (
                <VerificationPopup
                    onClose={() => setShowVerificationPopup(false)}
                    onContinue={() => {
                        setShowVerificationPopup(false);
                        setActiveTab('documents');
                    }}
                />
            )}
        </div>
    );
}

export default ProfilePageWrapper;
