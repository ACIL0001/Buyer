import { create } from 'zustand';
import app from '@/config';
import { normalizeImageUrl } from '@/utils/url';

interface SettingsState {
    logoUrl: string | null;
    tenderColor: string;
    auctionColor: string;
    directSaleColor: string;
    fetchSettings: () => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    logoUrl: null,
    tenderColor: '#27F5CC',
    auctionColor: '#2453D4',
    directSaleColor: '#D8762D',
    isLoading: false,
    error: null,

    fetchSettings: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${app.baseURL}settings`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();

            let fullLogoUrl = data.logoUrl ? normalizeImageUrl(data.logoUrl) : null;
            if (fullLogoUrl?.includes('undefined') || data.logoUrl?.includes('undefined')) {
                fullLogoUrl = null;
            }

            set({
                logoUrl: fullLogoUrl || null,
                tenderColor: data.tenderColor || '#27F5CC',
                auctionColor: data.auctionColor || '#2453D4',
                directSaleColor: data.directSaleColor || '#D8762D',
                isLoading: false
            });
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            set({ error: (error as Error).message, isLoading: false });
        }
    },
}));
