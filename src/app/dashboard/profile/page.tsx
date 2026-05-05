"use client"

import React, { useState, useEffect, useRef } from "react"
import Header from "@/components/header/Header"
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

    const [activeTab, setActiveTab] = useState("compte");
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
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
            enqueueSnackbar("Vous n'avez apporté aucune modification à votre profil.", { variant: "info" });
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

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            enqueueSnackbar(t("profile.passwordsDoNotMatch") || "Les mots de passe ne correspondent pas", { variant: "error" });
            return;
        }

        if (passwordData.newPassword.length < 8) {
            enqueueSnackbar(t("profile.passwordTooShort") || "Le mot de passe doit contenir au moins 8 caractères", { variant: "error" });
            return;
        }

        setIsSubmittingPassword(true);

        try {
            const response = await UserAPI.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            
            if (response && response.success) {
                enqueueSnackbar(response.message || t("profile.passwordChanged") || "Mot de passe mis à jour avec succès", { variant: "success" });
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                throw new Error(response.message || 'Failed to update password');
            }
        } catch (error: any) {
            console.error('❌ Error changing password:', error);
            const errorMessage = error.response?.data?.message || error.message || t("profile.passwordChangeError") || "Erreur lors de la mise à jour du mot de passe";
            enqueueSnackbar(errorMessage, { variant: "error" });
        } finally {
            setIsSubmittingPassword(false);
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
                <div style={{ paddingTop: '30px', minHeight: '80vh' }}>
                    <ProfileSkeleton />
                </div>
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
            <main className="figma-profile-page" style={{ paddingTop: '30px' }}>
                <div className="figma-profile-container">
                    <motion.div 
                        className="figma-profile-hero"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        {/* Combined Cover and Avatar Div */}
                        <div className="figma-hero-header">
                            <div className="figma-cover-dashed" onClick={handleCoverClick}>
                                {auth.user?.coverPhotoURL ? (
                                    <img 
                                        key={coverKey}
                                        src={`${getImageUrl(auth.user.coverPhotoURL)}${getImageUrl(auth.user.coverPhotoURL)?.includes('?') ? '&' : '?'}t=${coverKey}`} 
                                        alt="Cover" 
                                        className="figma-cover-img"
                                    />
                                ) : (
                                    <div className="figma-cover-placeholder">
                                        {isUploadingCover ? (
                                            <motion.i className="bi bi-arrow-repeat" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                                        ) : (
                                            <i className="bi bi-image" style={{ marginRight: '8px', fontSize: '20px' }}></i>
                                        )}
                                        <span>{t("profile.addCoverPhoto") || "Cliquez pour ajouter une photo de couverture"}</span>
                                    </div>
                                )}
                            </div>

                            <div className="figma-avatar-container">
                                <div className="figma-avatar-circle" onClick={handleAvatarClick}>
                                    <img key={avatarKey} src={avatarSrc} alt="Avatar" className="figma-avatar-img" onError={(e) => {
                                        const target = e.currentTarget as HTMLImageElement;
                                        if (!target.src.includes('avatar.jpg')) target.src = '/assets/images/avatar.jpg';
                                    }} />
                                    {isUploadingAvatar && (
                                        <div className="figma-avatar-uploading-overlay">
                                            <motion.i className="bi bi-arrow-repeat" style={{ fontSize: '24px', color: '#0066FF' }} animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                                        </div>
                                    )}
                                </div>
                                <div className="figma-avatar-badges">
                                    <div className="figma-badge top-left"><i className="bi bi-check-circle-fill"></i></div>
                                    <div className="figma-badge top-right"><i className="bi bi-stars"></i></div>
                                    <div className="figma-badge bottom-left"><i className="bi bi-award-fill"></i></div>
                                    <div className="figma-badge bottom-right"><i className="bi bi-shield-fill-check"></i></div>
                                </div>
                            </div>
                        </div>

                        {/* Hidden Inputs */}
                        <input type="file" ref={coverInputRef} style={{ display: "none" }} accept="image/*" onChange={handleCoverChange} />
                        <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*" onChange={handleAvatarChange} />
                    </motion.div>

                    <div className="figma-tabs-container">
                        <div className="figma-tabs-pill">
                            {[
                                { id: "compte", label: "Compte" },
                                { id: "securite", label: "Sécurité" },
                                { id: "documents", label: "Vérification de documents" },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    className={`figma-tab-btn ${activeTab === tab.id ? "active" : ""}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="figma-tab-content">
                        <AnimatePresence mode="wait">
                            {activeTab === "compte" && (
                                <motion.div key="compte" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                                    <form onSubmit={handleSubmit}>
                                        <div className="figma-card figma-card-personal" style={{ marginBottom: '24px' }}>
                                            <div className="figma-card-header">
                                                <div className="figma-card-title-box">
                                                    <h3 className="figma-card-title">Informations personnelles</h3>
                                                    <p className="figma-card-description">Gérez vos informations personnelles et les détails de votre profil</p>
                                                </div>
                                            </div>
                                            
                                            <div className="figma-form-row">
                                                <div className="figma-input-field">
                                                    <label className="figma-input-label">Nom</label>
                                                    <div className={`figma-form-field ${!isEditing ? 'readonly' : ''}`}>
                                                        <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} disabled={!isEditing} placeholder="Nom" required />
                                                    </div>
                                                </div>
                                                <div className="figma-input-field">
                                                    <label className="figma-input-label">Prénom</label>
                                                    <div className={`figma-form-field ${!isEditing ? 'readonly' : ''}`}>
                                                        <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} disabled={!isEditing} placeholder="Prénom" required />
                                                    </div>
                                                </div>
                                                <div className="figma-input-field">
                                                    <label className="figma-input-label">Email</label>
                                                    <div className={`figma-form-field ${!isEditing ? 'readonly' : ''}`}>
                                                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} disabled={!isEditing} placeholder="Email" required />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="figma-input-field" style={{ width: '100%' }}>
                                                <label className="figma-input-label">Nom de l'entreprise</label>
                                                <div className={`figma-form-field ${!isEditing ? 'readonly' : ''}`}>
                                                    <input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} disabled={!isEditing} placeholder="Nom de l'entreprise" />
                                                </div>
                                            </div>

                                            <div className="figma-cta-group figma-cta-group-personal">
                                                {!isEditing ? (
                                                    <button type="button" onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setIsEditing(true);
                                                        // Use a small timeout to ensure the input is enabled before focusing
                                                        setTimeout(() => {
                                                            const firstInput = document.querySelector('input[name="lastName"]') as HTMLInputElement;
                                                            if (firstInput) firstInput.focus();
                                                        }, 100);
                                                    }} className="figma-btn-primary">
                                                        Modifier
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button type="submit" disabled={isLoading} className="figma-btn-primary">
                                                            {isLoading ? "Enregistrement..." : "Enregistrer"}
                                                        </button>
                                                        <button type="button" onClick={() => setIsEditing(false)} className="figma-btn-secondary">Annuler</button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="figma-card figma-card-additional">
                                            <div className="figma-card-header">
                                                <div className="figma-card-title-box">
                                                    <h3 className="figma-card-title">Details supplementaires</h3>
                                                </div>
                                                {!isEditing && (
                                                    <button type="button" onClick={() => setIsEditing(true)} className="figma-btn-edit-v2">
                                                        <span>Editer</span>
                                                        <i className="bi bi-pencil-square"></i>
                                                    </button>
                                                )}
                                            </div>
                                            
                                            <div className="figma-form-row">
                                                <div className="figma-input-field">
                                                    <label className="figma-input-label">Numéro de téléphone</label>
                                                    <div className={`figma-form-field ${!isEditing ? 'readonly' : ''}`}>
                                                        <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} disabled={!isEditing} placeholder="Téléphone" />
                                                    </div>
                                                </div>
                                                <div className="figma-input-field">
                                                    <label className="figma-input-label">Pays / Wilaya</label>
                                                    <div className={`figma-form-field ${!isEditing ? 'readonly' : ''}`}>
                                                        <select name="wilaya" value={formData.wilaya} onChange={handleInputChange} disabled={!isEditing} style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontFamily: 'inherit', fontWeight: 700, fontSize: '14px', color: '#454545' }}>
                                                            <option value="">Sélectionner</option>
                                                            {WILAYAS.map((w, i) => <option key={i} value={w}>{w}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="figma-input-field">
                                                    <label className="figma-input-label">Addresse / Secteur</label>
                                                    <div className={`figma-form-field ${!isEditing ? 'readonly' : ''}`}>
                                                        <input type="text" name="activitySector" value={formData.activitySector} onChange={handleInputChange} disabled={!isEditing} placeholder="Adresse" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </motion.div>
                            )}

                            {activeTab === "securite" && (
                                <motion.div key="securite" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                                    <div className="figma-card figma-card-security">
                                        <div className="figma-card-header">
                                            <div className="figma-card-title-box">
                                                <h3 className="figma-card-title">Mot de passe</h3>
                                            </div>
                                        </div>
                                        
                                        <form onSubmit={handlePasswordChange} style={{ width: '100%' }}>
                                            <div className="figma-form-row">
                                                <div className="figma-input-field">
                                                    <label className="figma-input-label">Ancien mot de passe</label>
                                                    <div className="figma-form-field">
                                                        <input type={showPassword ? "text" : "password"} placeholder="••••••••••••" value={passwordData.currentPassword} onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} required />
                                                        <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} style={{ cursor: 'pointer', color: '#737373' }} onClick={() => setShowPassword(!showPassword)}></i>
                                                    </div>
                                                </div>
                                                <div className="figma-input-field">
                                                    <label className="figma-input-label">Nouveau mot de passe</label>
                                                    <div className="figma-form-field">
                                                        <input type={showPassword ? "text" : "password"} placeholder="••••••••••••" value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} required />
                                                        <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} style={{ cursor: 'pointer', color: '#737373' }} onClick={() => setShowPassword(!showPassword)}></i>
                                                    </div>
                                                </div>
                                                <div className="figma-input-field">
                                                    <label className="figma-input-label">Confirmez</label>
                                                    <div className="figma-form-field">
                                                        <input type={showPassword ? "text" : "password"} placeholder="••••••••••••" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} required />
                                                        <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} style={{ cursor: 'pointer', color: '#737373' }} onClick={() => setShowPassword(!showPassword)}></i>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <ul className="figma-checklist">
                                                <li className="figma-checklist-item">
                                                    <div className="figma-checklist-icon"><i className="bi bi-check-circle"></i></div>
                                                    <span className="figma-checklist-text">8 characters au minimum.</span>
                                                </li>
                                                <li className="figma-checklist-item">
                                                    <div className="figma-checklist-icon"><i className="bi bi-check-circle"></i></div>
                                                    <span className="figma-checklist-text">Utilisez une combinaison de majuscule minuscule</span>
                                                </li>
                                                <li className="figma-checklist-item">
                                                    <div className="figma-checklist-icon"><i className="bi bi-check-circle"></i></div>
                                                    <span className="figma-checklist-text">Utilisez des caractères (e.g., !, @, #, $, %)</span>
                                                </li>
                                            </ul>
                                            
                                            <div className="figma-cta-group figma-cta-group-security">
                                                <button type="submit" disabled={isSubmittingPassword} className="figma-btn-password-update">
                                                    {isSubmittingPassword ? "..." : "Mettre à jour mot de passe"}
                                                </button>
                                                <button type="button" onClick={() => setPasswordData({currentPassword: "", newPassword: "", confirmPassword: ""})} className="figma-btn-secondary">Annuler</button>
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === "documents" && (
                                <motion.div key="documents" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                                    <div className="figma-card figma-card-verification">
                                        <div className="figma-card-header" style={{ marginBottom: '32px' }}>
                                            <div className="figma-card-title-box" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
                                                <h3 className="figma-card-title" style={{ fontSize: '24px', fontFamily: 'Inter', fontWeight: 600 }}>Documents obligatoires pour vérification</h3>
                                                <i className="bi bi-exclamation-diamond-fill" style={{ color: '#F87171', fontSize: '24px' }}></i>
                                            </div>
                                        </div>
                                        
                                        <div className="figma-verify-status-container">
                                            <div className="figma-status-card active">
                                                <div className="figma-status-info">
                                                    <span className="figma-status-step">ÉTAPE 1</span>
                                                    <h4 className="figma-status-name">VÉRIFIÉ</h4>
                                                    <p className="figma-status-desc">Passer à Vérifié pour débloquer les ventes de base</p>
                                                </div>
                                                <i className="bi bi-patch-check figma-status-icon-v2"></i>
                                            </div>
                                            <div className="figma-status-card inactive">
                                                <div className="figma-status-info">
                                                    <span className="figma-status-step">ÉTAPE 2</span>
                                                    <h4 className="figma-status-name">CERTIFIÉ</h4>
                                                    <p className="figma-status-desc">Passer à Certifié</p>
                                                </div>
                                                <i className="bi bi-lock figma-status-icon-v2"></i>
                                            </div>
                                        </div>

                                        <div className="figma-alert-box-v3">
                                            <i className="bi bi-exclamation-circle figma-alert-icon-v3"></i>
                                            <div className="figma-alert-content-v2">
                                                <h4 className="figma-alert-title-v3">Vérification</h4>
                                                <p className="figma-alert-desc-v3">
                                                    Fournir (RC/ Autres + NIF) ou (Carte Fellah uniquement).<br />
                                                    Cliquez sur "Soumettre" pour envoyer à l'administrateur.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="figma-doc-grid-v2">
                                            {requiredDocuments.map((doc, index) => {
                                                const document = identity ? (identity as any)[doc.key] : null;
                                                const hasDocument = document && document.url;
                                                const isUploadingThisField = isUploadingDocument === doc.key;
                                                
                                                return (
                                                    <div className={`figma-doc-card-v2 figma-card-${doc.key.toLowerCase()}`} key={doc.key}>
                                                        <div className="figma-doc-header-v2">
                                                            <i className="bi bi-file-earmark-plus figma-doc-icon-v2"></i>
                                                            <h4 className="figma-doc-title-v2">
                                                                {doc.label} <span className="required">*</span>
                                                            </h4>
                                                        </div>
                                                        <p className="figma-doc-subtitle-v2">{doc.description}</p>
                                                        
                                                        <input
                                                            ref={el => { documentFileInputRefs.current[doc.key] = el; }}
                                                            type="file"
                                                            accept=".jpg,.jpeg,.png,.pdf"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) handleFileSelect(doc.key, file);
                                                            }}
                                                            style={{ display: 'none' }}
                                                        />
                                                        <button 
                                                            className="figma-doc-btn-v2"
                                                            onClick={() => documentFileInputRefs.current[doc.key]?.click()}
                                                            disabled={isUploadingThisField}
                                                        >
                                                            {isUploadingThisField ? '...' : 'Ajouter'}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="figma-cta-group figma-cta-group-verification" style={{ justifyContent: 'center' }}>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
            
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
