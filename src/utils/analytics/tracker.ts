/**
 * MazadClick Analytics Tracker SDK
 *
 * A lightweight, privacy-first analytics tracker that:
 * - Manages sessions (UUID stored in sessionStorage)
 * - Auto-tracks page views on route changes
 * - Detects rage clicks, dead clicks, and scroll depth
 * - Batches events and flushes every 5s or on page unload
 * - Respects cookie consent (checks localStorage 'mc_consent')
 * - Uses navigator.sendBeacon() for reliable delivery on unload
 */

type TrackerConfig = {
  endpoint: string;
  sessionEndpoint: string;
  heatmapEndpoint: string;
  userId: string | null;
  userType: string;
  userWilaya?: string;
  consentKey: string;
};

type AnalyticsEventPayload = {
  eventName: string;
  urlPath: string;
  pageTitle?: string;
  properties?: Record<string, any>;
  elementSelector?: string;
  position?: { x: number; y: number };
  referrer?: string;
  timestamp?: number;
};

type HeatmapInteraction = {
  urlPath: string;
  interactionType: 'click' | 'rage_click' | 'dead_click' | 'scroll';
  position: { x: number; y: number };
  elementSelector?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  scrollDepth?: number;
};

// ── Session ID Management ──
function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxx-xxxx-xxxx-xxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16),
  );
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem('mc_session_id');
  if (!sid) {
    sid = generateSessionId();
    sessionStorage.setItem('mc_session_id', sid);
  }
  return sid;
}

// ── CSS Selector Builder ──
function getCssSelector(el: Element | null): string {
  if (!el) return '';
  let text: string | null = (el as HTMLElement).innerText || (el as HTMLElement).textContent || null;
  if (!text || text.trim() === '') {
    text = el.getAttribute('aria-label') || el.getAttribute('title') || null;
  }
  if (text && text.trim().length > 0 && text.trim().length < 50) {
    return text.trim();
  }
  
  const parts: string[] = [];
  let current: Element | null = el;
  let depth = 0;
  while (current && depth < 5) {
    let selector = current.tagName.toLowerCase();
    if (current.id) {
      selector += `#${current.id}`;
      parts.unshift(selector);
      break;
    }
    if (current.className && typeof current.className === 'string') {
      const cls = current.className.trim().split(/\s+/).slice(0, 2).join('.');
      if (cls) selector += `.${cls}`;
    }
    parts.unshift(selector);
    current = current.parentElement;
    depth++;
  }
  return parts.join(' > ').slice(0, 200);
}

// ── Rage Click Detection ──
class RageClickDetector {
  private clicks: { x: number; y: number; t: number }[] = [];
  private readonly THRESHOLD = 3;
  private readonly TIME_WINDOW = 1500; // ms
  private readonly RADIUS = 30; // px

  check(x: number, y: number): boolean {
    const now = Date.now();
    this.clicks.push({ x, y, t: now });
    // Remove old clicks
    this.clicks = this.clicks.filter((c) => now - c.t < this.TIME_WINDOW);

    if (this.clicks.length >= this.THRESHOLD) {
      // Check if all recent clicks are within radius
      const allClose = this.clicks.every(
        (c) => Math.abs(c.x - x) < this.RADIUS && Math.abs(c.y - y) < this.RADIUS,
      );
      if (allClose) {
        this.clicks = [];
        return true;
      }
    }
    return false;
  }
}

// ── Dead Click Detection ──
function isInteractiveElement(el: Element | null): boolean {
  if (!el) return false;
  const interactiveTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL'];
  let current: Element | null = el;
  while (current) {
    if (interactiveTags.includes(current.tagName)) return true;
    if (current.getAttribute('role') === 'button') return true;
    if (current.getAttribute('onclick')) return true;
    if (current.hasAttribute('tabindex')) return true;
    current = current.parentElement;
  }
  return false;
}

// ═══════════════════════════════════════════
// ██  MAIN TRACKER CLASS
// ═══════════════════════════════════════════

class AnalyticsTracker {
  private config: TrackerConfig | null = null;
  private eventQueue: AnalyticsEventPayload[] = [];
  private heatmapQueue: HeatmapInteraction[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private rageDetector = new RageClickDetector();
  private scrollThresholds = new Set<number>();
  private sessionStarted = false;
  private pageLoadTime = 0;
  private lastPageView = '';
  private destroyed = false;

  // Bound handlers for cleanup
  private boundClickHandler: ((e: MouseEvent) => void) | null = null;
  private boundScrollHandler: (() => void) | null = null;
  private boundUnloadHandler: (() => void) | null = null;
  private boundVisibilityHandler: (() => void) | null = null;

  /**
   * Initialize the tracker with configuration.
   */
  init(config: TrackerConfig): void {
    if (typeof window === 'undefined') return;
    this.config = config;
    this.destroyed = false;

    // Start session
    if (!this.sessionStarted) {
      this.startSession();
      this.sessionStarted = true;
    }

    // Set up auto-tracking listeners
    this.setupListeners();

    // Flush queue periodically (every 5 seconds)
    this.flushInterval = setInterval(() => this.flush(), 5000);
  }

  /**
   * Clean up all listeners and flush remaining events.
   */
  destroy(): void {
    this.destroyed = true;
    this.flush();
    this.endSession();

    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    if (typeof window !== 'undefined') {
      if (this.boundClickHandler) {
        document.removeEventListener('click', this.boundClickHandler, true);
      }
      if (this.boundScrollHandler) {
        window.removeEventListener('scroll', this.boundScrollHandler);
      }
      if (this.boundUnloadHandler) {
        window.removeEventListener('beforeunload', this.boundUnloadHandler);
      }
      if (this.boundVisibilityHandler) {
        document.removeEventListener('visibilitychange', this.boundVisibilityHandler);
      }
    }
  }

  /**
   * Identify a logged-in user.
   */
  identify(userId: string, userType: string): void {
    if (this.config) {
      this.config.userId = userId;
      this.config.userType = userType;
    }
  }

  /**
   * Track a page view (called by AnalyticsProvider on route change).
   */
  trackPageView(pathname: string): void {
    if (!this.config) return;

    const previousPage = this.lastPageView;
    this.lastPageView = pathname;
    this.pageLoadTime = Date.now();
    this.scrollThresholds.clear();

    this.enqueueEvent({
      eventName: 'page_view',
      urlPath: pathname,
      pageTitle: typeof document !== 'undefined' ? document.title : '',
      properties: {
        previousPage,
        loadTimeMs:
          typeof performance !== 'undefined'
            ? Math.round(performance.now())
            : 0,
      },
      referrer: typeof document !== 'undefined' ? document.referrer : '',
    });
  }

  /**
   * Track a custom event.
   */
  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.config) return;
    this.enqueueEvent({
      eventName,
      urlPath: typeof window !== 'undefined' ? window.location.pathname : '',
      pageTitle: typeof document !== 'undefined' ? document.title : '',
      properties: properties || {},
    });
  }

  // ═══════════════════════════════════════════
  // ██  PRIVATE METHODS
  // ═══════════════════════════════════════════

  private hasConsent(): boolean {
    if (typeof window === 'undefined') return false;
    // Default to granted if no consent key is set (user hasn't interacted with consent)
    const consent = localStorage.getItem(this.config?.consentKey || 'mc_consent');
    return consent !== 'denied';
  }

  private startSession(): void {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const payload: any = {
      sessionId: getSessionId(),
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      referrer: document.referrer || '',
      landingPage: window.location.pathname,
      userType: this.config?.userType || 'guest',
      userWilaya: this.config?.userWilaya || 'Unknown',
    };

    // Extract UTM parameters
    const utmParams = ['source', 'medium', 'campaign', 'term', 'content'];
    const utm: Record<string, string> = {};
    utmParams.forEach((p) => {
      const val = url.searchParams.get(`utm_${p}`);
      if (val) utm[p] = val;
    });
    if (Object.keys(utm).length > 0) {
      payload.utm = utm;
    }

    this.sendBeacon(`${this.config?.sessionEndpoint}/start`, payload);
  }

  private endSession(): void {
    if (typeof window === 'undefined') return;
    const durationSeconds = Math.round((Date.now() - this.pageLoadTime) / 1000);
    const pageCount = parseInt(
      sessionStorage.getItem('mc_page_count') || '1',
      10,
    );

    this.sendBeacon(`${this.config?.sessionEndpoint}/end`, {
      sessionId: getSessionId(),
      durationSeconds,
      pageCount,
      exitPage: window.location.pathname,
    });
  }

  private setupListeners(): void {
    if (typeof window === 'undefined') return;

    // ── Click tracking ──
    this.boundClickHandler = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target) return;

      const x = Math.round((e.clientX / window.innerWidth) * 100);
      const y = Math.round((e.clientY / window.innerHeight) * 100);
      const selector = getCssSelector(target);

      // Rage click detection
      if (this.rageDetector.check(e.clientX, e.clientY)) {
        this.enqueueHeatmap({
          urlPath: window.location.pathname,
          interactionType: 'rage_click',
          position: { x, y },
          elementSelector: selector,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
        });
        this.enqueueEvent({
          eventName: 'rage_click',
          urlPath: window.location.pathname,
          elementSelector: selector,
          position: { x, y },
        });
      }

      // Dead click detection
      if (!isInteractiveElement(target)) {
        this.enqueueHeatmap({
          urlPath: window.location.pathname,
          interactionType: 'dead_click',
          position: { x, y },
          elementSelector: selector,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
        });
      }

      // Regular click heatmap
      this.enqueueHeatmap({
        urlPath: window.location.pathname,
        interactionType: 'click',
        position: { x, y },
        elementSelector: selector,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      });
    };
    document.addEventListener('click', this.boundClickHandler, true);

    // ── Scroll depth tracking ──
    this.boundScrollHandler = () => {
      const scrollTop =
        document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;

      const depth = Math.round((scrollTop / scrollHeight) * 100);
      const thresholds = [25, 50, 75, 100];

      for (const threshold of thresholds) {
        if (depth >= threshold && !this.scrollThresholds.has(threshold)) {
          this.scrollThresholds.add(threshold);
          this.enqueueEvent({
            eventName: 'scroll_depth',
            urlPath: window.location.pathname,
            properties: { depth: threshold, maxDepth: 100 },
          });
          this.enqueueHeatmap({
            urlPath: window.location.pathname,
            interactionType: 'scroll',
            position: { x: 50, y: threshold },
            scrollDepth: threshold,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
          });
        }
      }
    };
    window.addEventListener('scroll', this.boundScrollHandler, { passive: true });

    // ── Page unload — flush + end session ──
    this.boundUnloadHandler = () => {
      this.flush();
      this.endSession();
    };
    window.addEventListener('beforeunload', this.boundUnloadHandler);

    // ── Visibility change — flush when tab hidden ──
    this.boundVisibilityHandler = () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    };
    document.addEventListener('visibilitychange', this.boundVisibilityHandler);

    // Track page count
    const currentCount = parseInt(
      sessionStorage.getItem('mc_page_count') || '0',
      10,
    );
    sessionStorage.setItem('mc_page_count', String(currentCount + 1));
  }

  private enqueueEvent(event: AnalyticsEventPayload): void {
    if (!this.hasConsent()) return;
    event.timestamp = Date.now();
    this.eventQueue.push(event);

    // Auto-flush if queue is large
    if (this.eventQueue.length >= 20) {
      this.flush();
    }
  }

  private enqueueHeatmap(interaction: HeatmapInteraction): void {
    if (!this.hasConsent()) return;
    this.heatmapQueue.push(interaction);

    if (this.heatmapQueue.length >= 50) {
      this.flushHeatmap();
    }
  }

  private flush(): void {
    if (this.eventQueue.length === 0 || !this.config) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    const payload = {
      sessionId: getSessionId(),
      events,
    };

    this.sendBeacon(this.config.endpoint, payload);

    // Also flush heatmap data
    this.flushHeatmap();
  }

  private flushHeatmap(): void {
    if (this.heatmapQueue.length === 0 || !this.config) return;

    const interactions = [...this.heatmapQueue];
    this.heatmapQueue = [];

    this.sendBeacon(this.config.heatmapEndpoint, {
      sessionId: getSessionId(),
      interactions,
    });
  }

  private sendBeacon(url: string, data: any): void {
    const body = JSON.stringify(data);

    // Prefer sendBeacon for reliability on page unload
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      const sent = navigator.sendBeacon(url, blob);
      if (sent) return;
    }

    // Fallback to fetch with keepalive
    if (typeof fetch !== 'undefined') {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {
        // Silent fail — analytics should never break the app
      });
    }
  }
}

// ── Singleton Export ──
const tracker = new AnalyticsTracker();
export default tracker;
export type { TrackerConfig, AnalyticsEventPayload };
