"use client";

import { useEffect, useRef } from 'react';
import { authStore } from '@/contexts/authStore';
import { BidsCheck } from '@/app/api/checkBids';

export default function BidChecker() {
  const { auth, isLogged } = authStore();
  const isCheckingRef = useRef(false);

  useEffect(() => {
    if (!isLogged || !auth?.user) return;

    // checkBids function
    async function checkBids() {
      if (!auth || !auth.user) return;
      if (isCheckingRef.current) return;

      isCheckingRef.current = true;
      try {
        await BidsCheck.checkBids({ id: String(auth.user._id || '') });
        // console.log('Res Bid Check', res);
      } catch (error) {
        // console.error('Error checking bids:', error);
      } finally {
        isCheckingRef.current = false;
      }
    }

    // Initial check
    checkBids();

    // Set up interval to check bids every 60 seconds (increased from 5s)
    const interval = setInterval(() => {
      checkBids();
    }, 60000);

    // Cleanup interval on unmount
    return () => {
      clearInterval(interval);
    };
  }, [auth, isLogged]);

  return null; // This component doesn't render anything
}
