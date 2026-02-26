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
// import { useIdentityStatus } from "@/hooks/useIdentityStatus"
import { useRouter } from "next/navigation"
// import HistoryPage from "./history/HistoryPage"
import { useTranslation } from "react-i18next"
import { authStore } from "@/contexts/authStore"
import { WILAYAS } from "@/constants/wilayas"
import { CategoryAPI } from "@/services/category"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import ProfileSkeleton from "@/components/skeletons/ProfileSkeleton"
import VerificationPopup from "@/components/VerificationPopup"
import UserActivitiesSection from "@/components/profile/UserActivitiesSection"
import ImageCropper from "@/components/common/ImageCropper"
import { normalizeImageUrl } from "@/utils/url"

// Local constants removed in favor of @/utils/url
const getImageUrl = normalizeImageUrl;

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





// ... existing code ...

function ProfilePage() {
    const { t } = useTranslation();
    const auth = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const router = useRouter();
    const queryClient = useQueryClient();
    const set = authStore((state: any) => state.set);
    const [isReady, setIsReady] = useState(false);
    const isLogged = !!auth.user;

    // Wait for hydration
    useEffect(() => {
        setIsReady(true);
    }, []);
    
    // Identity Query
    const { data: identity, isLoading: isLoadingIdentity } = useQuery({
        queryKey: ['identity'],
        queryFn: async () => {
            const response = await IdentityAPI.getMyIdentity();
            const data = response.data as any;
            if (data && !initialIdentity) {
                setInitialIdentity(data);
            }
            return data;
        },
        retry: 1
    });

    const [activeTab, setActiveTab] = useState("activities");
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isUploadingCover, setIsUploadingCover] = useState(false);
    const [coverKey, setCoverKey] = useState(Date.now());

    const [avatarKey, setAvatarKey] = useState(Date.now());

    // Personal Info State
    const [isEditing, setIsEditing] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
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

    const [initialFormData, setInitialFormData] = useState({
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
    
    // Document Upload States
    const [uploadingFile, setUploadingFile] = useState<File | null>(null);
    const [isUploadingDocument, setIsUploadingDocument] = useState<string | null>(null);
    const [isSubmittingIdentity, setIsSubmittingIdentity] = useState(false);
    const [initialIdentity, setInitialIdentity] = useState<any>(null);
    const [showVerificationPopup, setShowVerificationPopup] = useState(false);
    
    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const documentFileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    // Cropper State
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [cropType, setCropType] = useState<'avatar' | 'cover'>('avatar');

    // Document Handling State & Logic
    const [activeUpgradeSection, setActiveUpgradeSection] = useState<'verified' | 'certified' | null>('verified');

    const isLoadingDocuments = isLoadingIdentity;

    // Document lists
    const requiredDocuments = [
        { key: 'registreCommerceCarteAuto', label: t('profile.documents.registreCommerce') || 'Registre de Commerce / Carte Artisan', required: true, description: 'Format PDF ou Image' },
        { key: 'nifRequired', label: t('profile.documents.nif') || 'NIF', required: true, description: 'Numéro d\'Identification Fiscale' },
        { key: 'carteFellah', label: t('profile.documents.carteFellah') || 'Carte Fellah', required: true, description: 'Pour les agriculteurs' }
    ];

    const optionalDocuments = [
        { key: 'nis', label: t('profile.documents.nis') || 'NIS' },
        { key: 'c20', label: t('profile.documents.c20') || 'C20' },
        { key: 'misesAJourCnas', label: t('profile.documents.misesAJourCnas') || 'Mises à jour CNAS' },
        { key: 'last3YearsBalanceSheet', label: t('profile.documents.balanceSheet') || 'Bilans des 3 dernières années' },
        { key: 'certificates', label: t('profile.documents.certificates') || 'Certificats' },
        { key: 'identityCard', label: t('profile.documents.identityCard') || 'Carte d\'identité' }
    ];



    const handleCropSave = async (croppedBlob: Blob) => {
        setIsCropping(false);
        if (cropType === 'avatar') {
            await uploadAvatar(croppedBlob);
        } else {
            await uploadCover(croppedBlob);
        }
    };

    const uploadCover = async (fileBlob: Blob) => {
        setIsUploadingCover(true);
        const formData = new FormData();
        formData.append("cover", fileBlob, "cover.jpg");

        try {
            const response = await UserAPI.uploadCover(formData);
            if (response.success) {
                enqueueSnackbar(t("profile.hero.coverSuccess") || "Cover updated successfully", { variant: "success" });
                await auth.fetchFreshUserData();
                setCoverKey(Date.now());
            } else {
                 enqueueSnackbar(t("profile.hero.coverError") || "Failed to update cover", { variant: "error" });
            }
        } catch (error) {
            console.error("Cover upload error:", error);
            enqueueSnackbar(t("profile.hero.coverError") || "Failed to update cover", { variant: "error" });
        } finally {
             setIsUploadingCover(false);
        }
    };

    const uploadAvatar = async (fileBlob: Blob) => {
        setIsUploadingAvatar(true);

        try {
            console.log('🖼️ Uploading avatar...');
            const formDataToUpload = new FormData();
            formDataToUpload.append('avatar', fileBlob, "avatar.jpg");
            const response = await UserAPI.uploadAvatar(formDataToUpload);

            console.log('✅ Avatar upload response:', response);

            if (response && response.success && (response.user || response.data)) {
                const updatedUser = (response.user || response.data) as any;
                const responseWithAttachment = response as any;
                
                // Get the updated user data and merge
                let avatarObj = updatedUser.avatar;
                if (responseWithAttachment?.attachment) {
                    const attachment = responseWithAttachment.attachment;
                    const normalizedUrl = normalizeImageUrl(attachment.url);
                    avatarObj = {
                        _id: attachment._id,
                        url: attachment.url,
                        filename: attachment.filename,
                        fullUrl: attachment.fullUrl ? normalizeImageUrl(attachment.fullUrl) : normalizedUrl
                    };
                }

                let photoURL = updatedUser.photoURL;
                if (!photoURL && avatarObj) {
                    const avatar = avatarObj as any;
                    if (avatar.fullUrl) photoURL = normalizeImageUrl(avatar.fullUrl);
                    else if (avatar.url) photoURL = normalizeImageUrl(avatar.url);
                    else if (avatar.filename) photoURL = normalizeImageUrl(avatar.filename);
                } else if (photoURL) {
                     photoURL = normalizeImageUrl(photoURL);
                }

                const mergedUser = {
                    ...auth.user,
                    ...updatedUser,
                    avatar: avatarObj || auth.user?.avatar,
                    photoURL: photoURL || auth.user?.photoURL,
                    type: (updatedUser.type || updatedUser.accountType || auth.user?.type || 'CLIENT') as any,
                };

                set({
                    user: mergedUser as any,
                    tokens: auth.tokens
                });

                setAvatarKey(Date.now());
                enqueueSnackbar(response.message || t("avatarUpdated") || "Avatar updated successfully", { variant: "success" });

                // Refresh fresh data
                setTimeout(async () => {
                    try {
                        await fetchFreshUserData();
                    } catch (err) {
                        console.warn('⚠️ Error refreshing user data after avatar upload:', err);
                    }
                }, 500);
            } else {
                enqueueSnackbar(response?.message || 'Avatar upload failed', { variant: "error" });
            }
        } catch (error: any) {
            console.error('❌ Error uploading avatar:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to upload avatar';
            enqueueSnackbar(errorMessage, { variant: "error" });
        } finally {
            setIsUploadingAvatar(false);
        }
    };



    // Helper to refresh user data
    const fetchFreshUserData = async () => {
        try {
             // Re-fetch user profile
             if (auth.user) {
                  const response = await UserAPI.getMe();
                  const userData = response.user || response.data;
                  // Merge with existing token
                  set({ user: userData, tokens: auth.tokens });
             }
        } catch (e) {
            console.error("Failed to refresh user data", e);
        }
    };

    const [showCompleteProfile, setShowCompleteProfile] = useState(false); 
    
    console.log('🏗️ ProfilePage Rendering', { 
        showCompleteProfile, 
        hasUser: !!auth.user, 
        loginCount: auth.user?.loginCount 
    });

    // ... existing refs ...

    // Initialize form data when auth.user changes
    useEffect(() => {
        console.log('🔄 useEffect [auth.user] triggered', { 
            hasUser: !!auth.user, 
            loginCount: auth.user?.loginCount 
        });

        if (auth.user) {
            const initialData = {
                firstName: auth.user.firstName || "",
                lastName: auth.user.lastName || "",
                email: auth.user.email || "",
                phone: auth.user.phone || "",
                wilaya: auth.user.wilaya || "",
                activitySector: Array.isArray((auth.user as any).activitySector) 
                    ? (auth.user as any).activitySector.join(', ') 
                    : (auth.user as any).activitySector || (auth.user as any).secteur || "",
                companyName: (auth.user as any).companyName || (auth.user as any).socialReason || "",
                jobTitle: auth.user.jobTitle || "",
                isProfileVisible: (auth.user as any).isProfileVisible !== undefined ? (auth.user as any).isProfileVisible : true,
            };
            setFormData(initialData);
            setInitialFormData(initialData);
        }
        
        // DEVELOPMENT: Force show for testing
        if (typeof window !== 'undefined' && sessionStorage.getItem('force_show_profile_note') === 'true') {
            console.log('🔧 FORCE SHOW ACTIVE via sessionStorage');
            setShowCompleteProfile(true);
            return;
        }

        // Check for Complete Profile Note
        checkProfileCompletion(auth.user);
    }, [auth.user]);

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const target = e.target as HTMLInputElement;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;

        setFormData(prev => ({
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

    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!hasChanges) {
            enqueueSnackbar(t("noChangesDetected") || "Aucune modification détectée", { variant: "info" });
            setIsEditing(false);
            return;
        }

        setIsLoading(true);

        try {
            const updatePayload = { 
                ...formData,
                phone: formData.phone?.replace(/\s/g, '') || ''
            };

            console.log('📤 Submitting profile update payload:', updatePayload);
            const response = await UserAPI.updateProfile(updatePayload);
            
            enqueueSnackbar(t("profileUpdated") || "Profile updated successfully", { variant: "success" });
            setIsEditing(false);

            if (auth.user && response.data) {
                const mergedUser = { ...auth.user, ...response.data };
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

    const checkProfileCompletion = (user: any) => {
        console.log('🎯 ===== PROFILE COMPLETION CHECK STARTED =====');
        console.log('🔍 Initial check:', {
            hasUser: !!user,
            userObject: user,
            loginCount: user?.loginCount,
            dismissed: user?.profileCompletionNote?.dismissed,
        });
        
        console.log('💾 SessionStorage state:', {
            profile_note_shown: sessionStorage.getItem('profile_note_shown_session'),
            allKeys: Object.keys(sessionStorage),
            allValues: Object.entries(sessionStorage).reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {})
        });

        console.log('👤 Full user data:', {
            firstName: user?.firstName,
            lastName: user?.lastName,
            email: user?.email,
            phone: user?.phone,
            wilaya: user?.wilaya,
            type: user?.type,
            companyName: user?.companyName,
            activitySector: user?.activitySector,
            post: user?.post,
            isVerified: user?.isVerified,
            isCertified: user?.isCertified,
            isHasIdentity: user?.isHasIdentity,
        });

        if (!user) {
            console.log('❌ BLOCKED: No user object');
            setShowCompleteProfile(false);
            return;
        }

        // 1. Check if user has permanently dismissed
        if (user.profileCompletionNote?.dismissed) {
            console.log('❌ BLOCKED: Profile notice permanently dismissed');
            setShowCompleteProfile(false);
            return;
        }

        // 2. Check login count limit from database
        // Show notice for first 5 logins (handle undefined as 0)
        const loginCount = user.loginCount ?? 0;
        console.log('📊 Login count check:', { 
            loginCount, 
            isUndefined: user.loginCount === undefined,
            shouldShow: loginCount <= 5 
        });
        
        if (loginCount > 5) {
             console.log('❌ BLOCKED: Login count exceeded limit (> 5)');
             setShowCompleteProfile(false);
             return;
        }

        // 3. Check if user postponed in this SPECIFIC login session
        // We compare the postponed login count with the current login count
        const lastPostponedCount = sessionStorage.getItem('profile_note_postponed_logincount');
        const currentLoginCount = user.loginCount ?? 0;
        
        if (lastPostponedCount && parseInt(lastPostponedCount) === currentLoginCount) {
            console.log('❌ BLOCKED: User postponed in this specific login session (Count: ' + currentLoginCount + ')');
            setShowCompleteProfile(false);
            return;
        }

        // 4. Determine what to show based on profile status
        const isProfessional = user.type === 'PROFESSIONAL';
        
        // Check all personal information fields
        const basicFieldsMissing = !user.firstName || 
                                   !user.lastName || 
                                   !user.email || 
                                   !user.phone || 
                                   !user.wilaya;
        
        // Additional checks for professional users
        const professionalFieldsMissing = isProfessional && (
            !user.companyName || 
            !user.activitySector ||
            !user.post
        );
        
        const isProfileIncomplete = basicFieldsMissing || professionalFieldsMissing;
        const isVerified = user.isVerified || false;
        const isCertified = user.isCertified || false;
        const hasIdentity = user.isHasIdentity || false;
        
        console.log('📋 Profile status check:', {
            isProfessional,
            basicFieldsMissing,
            professionalFieldsMissing,
            isProfileIncomplete,
            isVerified,
            isCertified,
            hasIdentity
        });

        // Always show notice for first 5 logins, but with different messages
        setShowCompleteProfile(true);
        // sessionStorage.setItem('profile_note_shown_session', 'true'); // No longer automatically creating session block
        console.log('✅ ===== NOTICE WILL BE DISPLAYED =====');
        console.log('✅ Session storage set to prevent re-display this session');
    };

    // Get dynamic notice content based on profile status
    const getNoticeContent = () => {
        if (!auth.user) return null;
        
        const isProfessional = auth.user.type === 'PROFESSIONAL';
        
        // Check all personal information fields
        const basicFieldsMissing = !auth.user.firstName || 
                                   !auth.user.lastName || 
                                   !auth.user.email || 
                                   !auth.user.phone || 
                                   !auth.user.wilaya;
        
        // Additional checks for professional users
        const professionalFieldsMissing = isProfessional && (
            !auth.user.companyName || 
            !auth.user.secteur ||
            !auth.user.jobTitle
        );
        
        const isProfileIncomplete = basicFieldsMissing || professionalFieldsMissing;
        const isVerified = auth.user.isVerified || false;
        const isCertified = auth.user.isCertified || false;
        const hasIdentity = auth.user.isHasIdentity || false;

        // Priority 1: Incomplete profile - personal information missing
        if (isProfileIncomplete) {
            const message = isProfessional 
                ? 'Ajoutez vos informations (nom, prénom, téléphone, localisation, entreprise, poste) pour vérifier votre compte.'
                : 'Ajoutez vos informations (nom, prénom, téléphone, localisation) pour vérifier votre compte.';
            
            return {
                icon: 'bi-person-lines-fill',
                title: 'Complétez vos informations personnelles',
                message: message,
                primaryButton: { text: 'Compléter', action: 'complete' as const },
                gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
            };
        }
        
        // Priority 2: No identity documents
        if (!hasIdentity) {
            return {
                icon: 'bi-file-earmark-text',
                title: 'Vérifiez votre compte',
                message: 'Soumettez vos documents d\'identité pour la vérification.',
                primaryButton: { text: 'Compléter', action: 'complete' as const },
                gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
            };
        }
        
        // Priority 3: Not verified
        if (!isVerified) {
            return {
                icon: 'bi-shield-check',
                title: 'Vérification en attente',
                message: 'Vos documents sont en cours de révision par notre équipe.',
                primaryButton: { text: 'Voir statut', action: 'complete' as const },
                gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
            };
        }
        
        // Priority 4: Verified but not certified
        if (!isCertified) {
            return {
                icon: 'bi-award',
                title: 'Obtenir la certification',
                message: 'Votre compte est vérifié ! Demandez la certification pour plus de crédibilité.',
                primaryButton: { text: 'Demander certification', action: 'complete' as const },
                gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
            };
        }
        
        // Priority 5: Everything complete!
        return {
            icon: 'bi-check-circle-fill',
            title: 'Bienvenue !',
            message: 'Votre profil est complet et vérifié. Explorez toutes nos fonctionnalités.',
            primaryButton: { text: 'Explorer', action: 'postpone' as const },
            gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
        };
    };

    const handleNoteAction = async (action: 'complete' | 'postpone' | 'dismiss') => {
        if (action === 'complete') {
             const user = auth.user;
             if (!user) return;

             const isProfessional = user.type === 'PROFESSIONAL';
             
             // Check personal info fields
             const basicFieldsMissing = !user.firstName || !user.lastName || !user.email || !user.phone || !user.wilaya;
             const professionalFieldsMissing = isProfessional && (!user.companyName || !(user as any).secteur && !(user as any).activitySector || !user.jobTitle);
             const isProfileIncomplete = basicFieldsMissing || professionalFieldsMissing;

             if (isProfileIncomplete) {
                 setActiveTab('personal-info');
             } else if (!user.isHasIdentity || !user.isVerified) {
                 setActiveTab('documents');
             } else if (!user.isCertified) {
                 setActiveTab('documents');
                 // Also ensure the Certified section is active if they go there for certification
                 if (user.isVerified) {
                     setActiveUpgradeSection('certified');
                 }
             } else {
                 setActiveTab('personal-info');
             }

             setShowCompleteProfile(false);
             
             // Scroll to content
             setTimeout(() => {
                 const tabsElement = document.querySelector('.modern-tabs-section') || document.querySelector('.modern-content-grid');
                 if (tabsElement) {
                     tabsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                 }
             }, 100);
        } else if (action === 'dismiss') {
             // "Jamais" - Dismiss forever via backend API
             try {
                 await UserAPI.updateProfileCompletionNote('dismiss');
                 setShowCompleteProfile(false);
                 // Refresh user data to get updated profileCompletionNote
                 await fetchFreshUserData();
                 enqueueSnackbar('Notification désactivée définitivement', { variant: 'success' });
             } catch (error) {
                 console.error('Error dismissing completion note:', error);
                 enqueueSnackbar('Erreur lors de la désactivation de la notification', { variant: 'error' });
             }
        } else {
             // "Plus tard" - Hide for this session ONLY (bound to login count)
             if (auth.user) {
                 const currentCount = auth.user.loginCount ?? 0;
                 sessionStorage.setItem('profile_note_postponed_logincount', currentCount.toString());
             }
             setShowCompleteProfile(false);
        }
    };

    const handleCoverClick = () => {
        coverInputRef.current?.click();
    };

    const handleCoverChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            enqueueSnackbar(t("profile.hero.maxFileSize") || "File size too large (max 5MB)", { variant: "error" });
            return;
        }

        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setCropImageSrc(reader.result?.toString() || '');
            setCropType('cover');
            setIsCropping(true);
        });
        reader.readAsDataURL(file);
        
        // Reset input
        event.target.value = '';
    };





    // ... existing code ...
    
    // In handleSubmit:
    // Ensure we send correct keys


    const handleAvatarClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            enqueueSnackbar('File size too large. Please select an image smaller than 5MB', { variant: 'error' });
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            enqueueSnackbar('Please select a valid image file (JPEG, PNG, GIF, WebP)', { variant: 'error' });
            return;
        }

        const reader = new FileReader();
        reader.addEventListener('load', () => {
             setCropImageSrc(reader.result?.toString() || '');
             setCropType('avatar');
             setIsCropping(true);
        });
        reader.readAsDataURL(file);

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
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
        if (document.fullUrl) return normalizeImageUrl(document.fullUrl);
        if (document.url) {
            return normalizeImageUrl(document.url);
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

    const hasIdentityChanges = JSON.stringify(identity) !== JSON.stringify(initialIdentity);
    const canSubmitIdentity = identity && 
        identity._id && 
        (identity.status !== 'PENDING' && identity.status !== 'VERIFIED') &&
        (hasIdentityChanges || (identity.status === 'REJECTED' || identity.status === 'NOT_SUBMITTED' || !identity.status));

    const handleSubmitIdentity = async () => {
        if (!identity || !identity._id) {
            enqueueSnackbar('Veuillez d\'abord télécharger au moins un document', { variant: 'warning' });
            return;
        }

        if (identity.status === 'PENDING') {
            enqueueSnackbar('Votre demande est déjà en cours de vérification', { variant: 'info' });
            return;
        }

        if (!canSubmitIdentity && identity.status !== 'REJECTED') {
             enqueueSnackbar('Aucune modification détectée dans vos documents', { variant: 'info' });
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
                        const document = identity ? (identity as any)[field.key] : null;
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
                    const optionalDocKeys = ['nis', 'art', 'c20', 'misesAJourCnas', 'last3YearsBalanceSheet', 'certificates', 'identityCard'];
                    const hasAnyOptionalDoc = optionalDocKeys.some(key => {
                        const doc = (identity as any)[key];
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

    // normalizeUrl hook removed - using imported normalizeImageUrl directly
    const normalizeUrl = normalizeImageUrl;

    // Construct avatar source with multiple fallback options
    const getAvatarSrc = () => {
        if (!auth.user) return '/assets/images/avatar.jpg';
        
        console.log('🖼️ Constructing avatar URL from:', auth.user);
        console.log('🖼️ Avatar object:', auth.user.avatar);
        console.log('🖼️ photoURL:', auth.user.photoURL);
        // Priority 0: avatar string (from registration)
        const avatarAny = auth.user.avatar as any;
        if (typeof avatarAny === 'string' && avatarAny.trim() !== '') {
             const avatarUrl = normalizeUrl(avatarAny);
             if (avatarUrl && !avatarUrl.includes('mock-images')) {
                 console.log('📸 Using avatar string:', avatarUrl);
                 return `${avatarUrl}?v=${avatarKey}`;
             }
        }
        
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
            // Check if filename is a full URL or needs prepending
            const filename = auth.user.avatar.filename;
            let avatarUrl;
            
            if (filename.startsWith('http') || filename.startsWith('/')) {
                 avatarUrl = normalizeImageUrl(filename);
            } else {
                 // Use normalizeImageUrl which handles bare filenames by assuming static
                 avatarUrl = normalizeImageUrl(filename);
            }

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
                                        animate={{ 
                                            opacity: 1, 
                                            scale: 1,
                                            boxShadow: ["0 0 0 0 rgba(245, 158, 11, 0.7)", "0 0 0 8px rgba(245, 158, 11, 0)"] 
                                        }}
                                        transition={{ 
                                            boxShadow: { duration: 2, repeat: Number.POSITIVE_INFINITY },
                                            default: { duration: 0.5 }
                                        }}
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
                                            color: '#f59e0b',
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
                                                <span>+{Math.round(auth.user.rate * 10) / 10}</span>
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
                            <div className="user-info-content" style={{ paddingBottom: '25px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                                    
                                    {(auth.user as any)?.isCertified && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '4px 10px',
                                                background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                                                color: 'white',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                                            }}
                                        >
                                            <i className="bi bi-shield-check-fill" style={{ fontSize: '10px' }}></i>
                                            <span>CERTIFIED</span>
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
                       {/* Complete Profile Note */}
                       {showCompleteProfile && (
                           <div 
                             className="modern-alert-note"
                             style={{ 
                                 gridColumn: '1 / -1',
                                  background: getNoticeContent()?.gradient || 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                 borderRadius: '16px',
                                 padding: '20px',
                                 marginBottom: '30px',
                                 color: 'white',
                                 display: 'flex',
                                 justifyContent: 'space-between',
                                 alignItems: 'center',
                                 boxShadow: '0 10px 25px rgba(79, 70, 229, 0.2)'
                             }}
                           >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                  <div style={{ 
                                      background: 'rgba(255,255,255,0.2)', 
                                      borderRadius: '50%', 
                                      padding: '10px',
                                      display: 'flex'
                                  }}>
                                       <i className={`bi ${getNoticeContent()?.icon || 'bi-person-lines-fill'}`} style={{ fontSize: '24px' }}></i>
                                   </div>
                                   <div>
                                       <h4 style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem' }}>{getNoticeContent()?.title}</h4>
                                       <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>{getNoticeContent()?.message}</p>
                                   </div>
                               </div>
                               <div style={{ display: 'flex', gap: '10px' }}>
                                   <button 
                                     onClick={() => handleNoteAction(getNoticeContent()?.primaryButton.action || 'complete')}
                                     style={{ 
                                         padding: '8px 16px', 
                                         borderRadius: '8px', 
                                         border: 'none', 
                                         background: 'white', 
                                         color: '#4f46e5', 
                                         fontWeight: 600, 
                                         cursor: 'pointer' 
                                     }}
                                   >
                                     {getNoticeContent()?.primaryButton.text}
                                   </button>
                                   <button 
                                     onClick={() => handleNoteAction('postpone')}
                                     style={{ 
                                         padding: '8px 16px', 
                                         borderRadius: '8px', 
                                         border: '1px solid rgba(255,255,255,0.3)', 
                                         background: 'rgba(255,255,255,0.1)', 
                                         color: 'white', 
                                         cursor: 'pointer' 
                                     }}
                                   >
                                     Plus tard
                                   </button>
                                    <button 
                                     onClick={() => handleNoteAction('dismiss')}
                                     style={{ 
                                         padding: '8px 16px', 
                                         borderRadius: '8px', 
                                         border: 'none', 
                                         background: 'transparent', 
                                         color: 'rgba(255,255,255,0.7)', 
                                         cursor: 'pointer' 
                                     }}
                                   >
                                     Jamais
                                   </button>
                               </div>
                           </div>
                       )}
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
                                    { id: "activities", icon: "bi-activity", label: t("profile.tabs.myActivities") || "Mes Activités" },
                                    { id: "personal-info", icon: "bi-person-circle", label: t("profile.personalInfo.title") || "Infos Personnelles" },
                                    { id: "documents", icon: "bi-file-earmark-text-fill", label: t("dashboard.profile.tabs.documents") || "Documents" },
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
                                    {/* Activities Tab */}
                                    {/* Activities Tab */}
                                    {activeTab === "activities" && (
                                        <motion.div
                                            key="activities"
                                            className="modern-tab-content"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.6, type: "spring" }}
                                        >
                                            <UserActivitiesSection userId={auth.user?._id || (auth.user as any)?.id || ''} />
                                        </motion.div>
                                    )}





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
                                                                <input
                                                                    type="text"
                                                                    id="firstName"
                                                                    name="firstName"
                                                                    value={formData.firstName}
                                                                    onChange={handleInputChange}
                                                                    disabled={!isEditing}
                                                                    required
                                                                />
                                                                <div className="modern-input-icon">
                                                                    <i className="bi bi-person"></i>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="modern-form-field">
                                                            <label htmlFor="lastName">{t("profile.lastName") || "Nom"}</label>
                                                            <div className="input-with-icon">
                                                                <input
                                                                    type="text"
                                                                    id="lastName"
                                                                    name="lastName"
                                                                    value={formData.lastName}
                                                                    onChange={handleInputChange}
                                                                    disabled={!isEditing}
                                                                    required
                                                                />
                                                                <div className="modern-input-icon">
                                                                    <i className="bi bi-person"></i>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="modern-form-field">
                                                            <label htmlFor="wilaya">{t("profile.wilaya") || "Wilaya"}</label>
                                                            <div className="input-with-icon">
                                                                <select
                                                                    id="wilaya"
                                                                    name="wilaya"
                                                                    value={formData.wilaya}
                                                                    onChange={handleInputChange}
                                                                    disabled={!isEditing}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '12px 16px',
                                                                        paddingLeft: '50px',
                                                                        borderRadius: '12px',
                                                                        border: '1px solid #e2e8f0',
                                                                        backgroundColor: isEditing ? '#ffffff' : '#f8fafc',
                                                                        color: '#1e293b',
                                                                        fontSize: '14px',
                                                                        outline: 'none',
                                                                        height: '54px',
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
                                                                <div className="modern-input-icon">
                                                                    <i className="bi bi-geo-alt"></i>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="modern-form-field">
                                                            <label htmlFor="companyName">{t("profile.personalInfo.companyName") || "Nom de l'entreprise"}</label>
                                                            <div className="input-with-icon">
                                                                <input
                                                                    type="text"
                                                                    id="companyName"
                                                                    name="companyName"
                                                                    value={formData.companyName}
                                                                    onChange={handleInputChange}
                                                                    disabled={!isEditing}
                                                                />
                                                                <div className="modern-input-icon">
                                                                    <i className="bi bi-building"></i>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="modern-form-field">
                                                            <label htmlFor="jobTitle">{t("profile.personalInfo.jobTitle") || "Poste actuel"}</label>
                                                            <div className="input-with-icon">
                                                                <input
                                                                    type="text"
                                                                    id="jobTitle"
                                                                    name="jobTitle"
                                                                    value={formData.jobTitle}
                                                                    onChange={handleInputChange}
                                                                    disabled={!isEditing}
                                                                />
                                                                <div className="modern-input-icon">
                                                                    <i className="bi bi-person-workspace"></i>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="modern-form-field">
                                                            <label htmlFor="activitySector">{t("profile.personalInfo.secteur") || "Secteur d'activité"}</label>
                                                            <div className="input-with-icon">
                                                                <select
                                                                    id="activitySector"
                                                                    name="activitySector"
                                                                    value={formData.activitySector}
                                                                    onChange={handleInputChange}
                                                                    disabled={!isEditing}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '12px 16px',
                                                                        paddingLeft: '50px',
                                                                        borderRadius: '12px',
                                                                        border: '1px solid #e2e8f0',
                                                                        backgroundColor: isEditing ? '#ffffff' : '#f8fafc',
                                                                        color: '#1e293b',
                                                                        fontSize: '14px',
                                                                        outline: 'none',
                                                                        height: '54px',
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
                                                                <div className="modern-input-icon">
                                                                    <i className="bi bi-activity"></i>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="modern-form-field">
                                                            <label htmlFor="phone">{t("profile.personalInfo.phone") || "Téléphone"}</label>
                                                            <div className="input-with-icon">
                                                                <input
                                                                    type="tel"
                                                                    id="phone"
                                                                    name="phone"
                                                                    value={formData.phone}
                                                                    onChange={handleInputChange}
                                                                    disabled={!isEditing}
                                                                />
                                                                <div className="modern-input-icon">
                                                                    <i className="bi bi-telephone"></i>
                                                                </div>
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
                                                    


                                                    {isEditing && (
                                                        <div className="modern-actions" style={{
                                                            marginTop: '2rem',
                                                            display: 'flex',
                                                            justifyContent: 'flex-end',
                                                            gap: '1rem'
                                                        }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => setIsEditing(false)}
                                                                className="modern-btn secondary"
                                                                style={{
                                                                    padding: '0.75rem 1.5rem',
                                                                    borderRadius: '10px',
                                                                    border: '1px solid #e2e8f0',
                                                                    backgroundColor: 'white',
                                                                    color: '#64748b',
                                                                    fontWeight: 600,
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.5rem'
                                                                }}
                                                            >
                                                                <i className="bi bi-x-circle"></i>
                                                                <span>{t("common.cancel")}</span>
                                                            </button>

                                                            <button
                                                                type="submit"
                                                                disabled={isLoading || !hasChanges}
                                                                className="modern-btn primary"
                                                                style={{
                                                                    padding: '0.75rem 1.5rem',
                                                                    borderRadius: '10px',
                                                                    border: 'none',
                                                                    background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                                                                    color: 'white',
                                                                    fontWeight: 600,
                                                                    cursor: isLoading || !hasChanges ? 'not-allowed' : 'pointer',
                                                                    opacity: isLoading || !hasChanges ? 0.7 : 1,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.5rem',
                                                                    boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
                                                                }}
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
                                                        <div className="modern-upgrade-buttons">
                                                            <motion.button
                                                                className={`modern-upgrade-btn verified ${activeUpgradeSection === 'verified' ? 'active' : ''}`}
                                                                onClick={() => setActiveUpgradeSection(activeUpgradeSection === 'verified' ? null : 'verified')}
                                                                whileHover={{ scale: 1.02 }}
                                                                whileTap={{ scale: 0.98 }}
                                                            >
                                                                <i className="bi bi-shield-check"></i>
                                                                {t('dashboard.profile.documents.switchToVerified') || "Vérification (Obligatoire)"}
                                                            </motion.button>
                                                            <motion.button
                                                                className={`modern-upgrade-btn certified ${activeUpgradeSection === 'certified' ? 'active' : ''}`}
                                                                onClick={() => {
                                                                    if (!auth.user?.isVerified) {
                                                                        enqueueSnackbar("Vous devez être vérifié pour accéder à la certification", { variant: 'warning' });
                                                                        return;
                                                                    }
                                                                    setActiveUpgradeSection(activeUpgradeSection === 'certified' ? null : 'certified')
                                                                }}
                                                                disabled={!auth.user?.isVerified}
                                                                whileHover={auth.user?.isVerified ? { scale: 1.02 } : {}}
                                                                whileTap={auth.user?.isVerified ? { scale: 0.98 } : {}}
                                                            >
                                                                <i className="bi bi-award"></i>
                                                                {t('dashboard.profile.documents.switchToCertified') || "Certification (Optionnel)"}
                                                                {!auth.user?.isVerified && <i className="bi bi-lock-fill"></i>}
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
                                                                 disabled={isSubmittingIdentity || !canSubmitIdentity}
                                                                 className="modern-btn primary"
                                                                 style={{ 
                                                                     padding: '12px 24px',
                                                                     cursor: (isSubmittingIdentity || !canSubmitIdentity) ? 'not-allowed' : 'pointer',
                                                                     opacity: (isSubmittingIdentity || !canSubmitIdentity) ? 0.7 : 1
                                                                 }}
                                                             >
                                                                 {isSubmittingIdentity ? (
                                                                     <>
                                                                         <div className="modern-spinner-sm"></div>
                                                                         <span>Envoi en cours...</span>
                                                                     </>
                                                                 ) : (
                                                                     <>
                                                                        <i className="bi bi-send"></i>
                                                                        <span>
                                                                            {identity?.status === 'PENDING' ? 'En cours de vérification' : 
                                                                             identity?.status === 'VERIFIED' ? 'Déjà vérifié' : 
                                                                             'Soumettre pour vérification'}
                                                                        </span>
                                                                     </>
                                                                 )}
                                                             </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* History Tab */}



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
                        router.push('/settings');
                    }}
                />
            )}

            {/* Image Cropper Modal */}
            {isCropping && cropImageSrc && (
                <ImageCropper
                    imageSrc={cropImageSrc}
                    aspectRatio={cropType === 'avatar' ? 1 : 16/9}
                    cropShape={cropType === 'avatar' ? 'round' : 'rect'}
                    onCancel={() => setIsCropping(false)}
                    onCropComplete={handleCropSave}
                />
            )}
        </div>
    );
}

export default ProfilePageWrapper;
