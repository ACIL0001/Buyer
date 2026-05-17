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

        const maxAttempts = 5;
        const baseDelayMs = 800;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const response = await fetch(`${app.baseURL}settings`);
                if (!response.ok) {
                    throw new Error(`Network response was not ok (${response.status})`);
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
                    isLoading: false,
                    error: null,
                });
                return;
            } catch (error) {
                if (attempt === maxAttempts) {
                    // Defaults in initial state remain in effect; this is non-fatal.
                    // Use warn (not error) so Next.js dev overlay does not block the page.
                    console.warn(
                        `Settings fetch failed after ${maxAttempts} attempts; using defaults.`,
                        error
                    );
                    set({ error: (error as Error).message, isLoading: false });
                    return;
                }
                await new Promise((resolve) =>
                    setTimeout(resolve, baseDelayMs * 2 ** (attempt - 1))
                );
            }
        }
    },
}));
