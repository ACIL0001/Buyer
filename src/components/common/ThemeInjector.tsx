"use client";

import { useEffect } from 'react';
import { useSettingsStore } from '../../contexts/settingsStore';

export default function ThemeInjector() {
  const { tenderColor, auctionColor, directSaleColor, fetchSettings } = useSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-tender-color', tenderColor);
    root.style.setProperty('--primary-auction-color', auctionColor);
    root.style.setProperty('--primary-ds-color', directSaleColor);
  }, [tenderColor, auctionColor, directSaleColor]);

  return null; // This component strictly injects CSS variables, it doesn't render anything visible
}
