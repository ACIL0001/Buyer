"use client";

import { useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";
import tracker from "@/utils/analytics/tracker";
import { authStore } from "@/contexts/authStore";

import { API_BASE_URL } from "@/config";

// Remove trailing slash if exists to avoid double slashes in paths
const API_BASE = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

/**
 * AnalyticsProvider initializes the MazadClick tracker SDK.
 * Wrap this around your app (inside Providers.tsx) to enable:
 * - Automatic session management
 * - Page view tracking on route changes
 * - User identification after login
 * - Scroll depth, rage click, and dead click detection
 */
export default function AnalyticsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const user = authStore((state) => (state as any).user);

  // ── Initialize tracker once ──
  useEffect(() => {
    tracker.init({
      endpoint: `${API_BASE}/analytics/ingest`,
      sessionEndpoint: `${API_BASE}/analytics/session`,
      heatmapEndpoint: `${API_BASE}/analytics/heatmap`,
      userId: user?._id || null,
      userType: user?.type || "guest",
      userWilaya: user?.wilaya || user?.address?.wilaya || "Unknown",
      consentKey: "mc_consent",
    });

    return () => {
      tracker.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Track page views on route change ──
  useEffect(() => {
    if (pathname) {
      tracker.trackPageView(pathname);
    }
  }, [pathname]);

  // ── Identify user after login ──
  useEffect(() => {
    if (user?._id) {
      tracker.identify(user._id, user.type || "client");
    }
  }, [user?._id, user?.type]);

  return <>{children}</>;
}
