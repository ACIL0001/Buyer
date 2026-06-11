"use client";
import { useEffect, useRef } from "react";

const useWow = () => {
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (initialized.current) {
      return;
    }

    const initWow = async () => {
      // Only run in browser environment
      if (typeof window === "undefined") {
        return;
      }

      try {
        // Dynamically import wowjs
        const { WOW } = await import("wowjs");
        
        const wow = new WOW({
          boxClass: "wow",
          animateClass: "animated",
          offset: 80,
          mobile: true,
          live: false,
        });
        
        wow.init();
        console.log('WOW.js initialized successfully');
        initialized.current = true;
        
        // Store instance in window so handleRouteChange can sync it
        window.WOW = wow;
        
      } catch (error) {
        console.error('Error creating WOW instance:', error);
      }
    };
    
    if (typeof window !== "undefined") {
      // Small delay to ensure DOM is ready
      setTimeout(initWow, 100);

      // This logic helps re-sync animations on route changes. It's good to keep.
      const handleRouteChange = () => {
        if (typeof window.WOW !== "undefined" && window.WOW.sync) {
          // Re-initialize animations for new elements on the page
          window.WOW.sync();
        }
      };

      // Listen for route changes
      document.addEventListener("routeChangeComplete", handleRouteChange);

      // Cleanup listener on component unmount
      return () => {
        document.removeEventListener("routeChangeComplete", handleRouteChange);
      };
    }
  }, []); // Empty dependency array ensures this runs only once per component mount.
};

export default useWow;