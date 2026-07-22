import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useAuth } from '../context/authContext';
import {
  sendHeartbeatEvent,
  sendPageViewEvent,
} from '../../services/analyticsApi';
import {
  ANALYTICS_STATE_EVENT,
  ANALYTICS_STORAGE_KEYS,
  ANALYTICS_ANONYMOUS_IDENTITY_KEY,
  canCollectAnalytics,
  createAnalyticsEventId,
  getOrCreateSessionId,
  getOrCreateVisitorId,
  touchAnalyticsSession,
} from '../../services/analyticsStorage';

const HEARTBEAT_INTERVAL_MS = 30 * 1000;
const MIN_HEARTBEAT_ACTIVE_MS = 1000;
const MIN_HEARTBEAT_SEND_GAP_MS = 15 * 1000;
const PAGE_VIEW_CLIENT_DEDUPE_MS = 1500;

let lastQueuedPageView = {
  signature: '',
  queuedAt: 0,
};

let landingSessionId = null;
let landingTrafficContext = null;

function getInitialTrafficContext() {
  let referrerHost = '';

  try {
    if (document.referrer) {
      referrerHost =
        new URL(document.referrer).hostname;
    }
  } catch {
    referrerHost = '';
  }

  let utmSource = '';

  try {
    utmSource =
      new URLSearchParams(
        window.location.search
      ).get('utm_source') || '';
  } catch {
    utmSource = '';
  }

  return {
    referrerHost,
    utmSource,
  };
}

function getTrafficContext(sessionId) {
  if (!landingSessionId) {
    landingSessionId = sessionId;
    landingTrafficContext =
      getInitialTrafficContext();
  }

  if (sessionId === landingSessionId) {
    return landingTrafficContext;
  }

  return {
    referrerHost: window.location.hostname,
    utmSource: '',
  };
}

function buildAnalyticsIdentityKey(user) {
  if (!user) {
    return ANALYTICS_ANONYMOUS_IDENTITY_KEY;
  }

  const userId = String(user._id || '')
    .trim()
    .toLowerCase();

  if (/^[0-9a-f]{24}$/.test(userId)) {
    return `user:${userId}`;
  }

  return 'authenticated';
}

function queuePageView(path, identityKey) {
  if (!canCollectAnalytics()) return null;

  const visitorId = getOrCreateVisitorId();
  const sessionId =
    getOrCreateSessionId(identityKey);
  const eventId = createAnalyticsEventId();

  if (!visitorId || !sessionId || !eventId) {
    return null;
  }

  const now = Date.now();
  const normalizedPath = path || '/';
  const signature =
    `${sessionId}:${normalizedPath}`;

  if (
    lastQueuedPageView.signature === signature &&
    now - lastQueuedPageView.queuedAt <
      PAGE_VIEW_CLIENT_DEDUPE_MS
  ) {
    return {
      visitorId,
      sessionId,
      queued: false,
    };
  }

  lastQueuedPageView = {
    signature,
    queuedAt: now,
  };

  const trafficContext =
    getTrafficContext(sessionId);

  void sendPageViewEvent({
    eventId,
    visitorId,
    sessionId,
    path: normalizedPath,
    referrerHost:
      trafficContext.referrerHost,
    utmSource: trafficContext.utmSource,
  });

  return {
    visitorId,
    sessionId,
    queued: true,
  };
}

function AnalyticsTracker() {
  const location = useLocation();
  const { user, loading } = useAuth();

  const [collectionEnabled, setCollectionEnabled] =
    useState(() => canCollectAnalytics());

  const currentPathRef = useRef(
    location.pathname || '/'
  );
  const visitorIdRef = useRef(null);
  const sessionIdRef = useRef(null);

  const isAdmin =
    user?.role?.toLowerCase() === 'admin';

  const identityKey =
    buildAnalyticsIdentityKey(user);

  useEffect(() => {
    const syncCollectionState = () => {
      setCollectionEnabled(
        canCollectAnalytics()
      );
    };

    const handleStorage = (event) => {
      if (
        event.key ===
        ANALYTICS_STORAGE_KEYS.disabled
      ) {
        syncCollectionState();
      }
    };

    window.addEventListener(
      ANALYTICS_STATE_EVENT,
      syncCollectionState
    );

    window.addEventListener(
      'storage',
      handleStorage
    );

    return () => {
      window.removeEventListener(
        ANALYTICS_STATE_EVENT,
        syncCollectionState
      );

      window.removeEventListener(
        'storage',
        handleStorage
      );
    };
  }, []);

  /*
   * Synchronizes the local analytics session with
   * the current authentication identity.
   *
   * This runs for admins too, but it does not send
   * an analytics event. It only prevents an anonymous
   * session from being reused after login or logout.
   */
  useEffect(() => {
    if (loading || !collectionEnabled) {
      return;
    }

    const visitorId = getOrCreateVisitorId();
    const sessionId =
      getOrCreateSessionId(identityKey);

    if (!visitorId || !sessionId) {
      return;
    }

    visitorIdRef.current = visitorId;
    sessionIdRef.current = sessionId;
  }, [
    collectionEnabled,
    identityKey,
    loading,
  ]);

  /*
   * Sends a page view whenever the React Router
   * pathname changes or the authentication identity
   * changes.
   */
  useEffect(() => {
    currentPathRef.current =
      location.pathname || '/';

    if (
      loading ||
      isAdmin ||
      !collectionEnabled
    ) {
      return;
    }

    const result = queuePageView(
      currentPathRef.current,
      identityKey
    );

    if (result) {
      visitorIdRef.current =
        result.visitorId;
      sessionIdRef.current =
        result.sessionId;
    }
  }, [
    collectionEnabled,
    identityKey,
    isAdmin,
    loading,
    location.pathname,
  ]);

  /*
   * Sends limited heartbeat events while the page
   * is visible. The effect restarts whenever the
   * authentication identity changes.
   */
  useEffect(() => {
    if (
      loading ||
      isAdmin ||
      !collectionEnabled
    ) {
      return undefined;
    }

    const visitorId = getOrCreateVisitorId();
    const sessionId =
      getOrCreateSessionId(identityKey);

    if (!visitorId || !sessionId) {
      return undefined;
    }

    visitorIdRef.current = visitorId;
    sessionIdRef.current = sessionId;

    let activeStartedAt =
      document.visibilityState === 'visible'
        ? Date.now()
        : null;

    let lastHeartbeatQueuedAt = 0;

    const ensureCurrentSession = (now) => {
      const previousSessionId =
        sessionIdRef.current;

      const currentSessionId =
        touchAnalyticsSession(
          identityKey,
          now
        );

      const currentVisitorId =
        getOrCreateVisitorId();

      if (
        !currentSessionId ||
        !currentVisitorId
      ) {
        return false;
      }

      visitorIdRef.current =
        currentVisitorId;

      sessionIdRef.current =
        currentSessionId;

      if (
        previousSessionId &&
        currentSessionId !==
          previousSessionId
      ) {
        const result = queuePageView(
          currentPathRef.current,
          identityKey
        );

        if (result) {
          visitorIdRef.current =
            result.visitorId;

          sessionIdRef.current =
            result.sessionId;
        }

        return false;
      }

      return true;
    };

    const queueHeartbeat = () => {
      if (
        activeStartedAt === null ||
        !canCollectAnalytics()
      ) {
        return;
      }

      const now = Date.now();
      const activeMs =
        now - activeStartedAt;

      if (
        activeMs <
        MIN_HEARTBEAT_ACTIVE_MS
      ) {
        return;
      }

      if (
        lastHeartbeatQueuedAt &&
        now - lastHeartbeatQueuedAt <
          MIN_HEARTBEAT_SEND_GAP_MS
      ) {
        return;
      }

      if (!ensureCurrentSession(now)) {
        activeStartedAt = now;
        return;
      }

      const eventId =
        createAnalyticsEventId();

      if (
        !eventId ||
        !visitorIdRef.current ||
        !sessionIdRef.current
      ) {
        return;
      }

      activeStartedAt = now;
      lastHeartbeatQueuedAt = now;

      void sendHeartbeatEvent({
        eventId,
        visitorId:
          visitorIdRef.current,
        sessionId:
          sessionIdRef.current,
        activeMs,
      });
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState ===
        'hidden'
      ) {
        queueHeartbeat();
        activeStartedAt = null;
        return;
      }

      const now = Date.now();

      ensureCurrentSession(now);
      activeStartedAt = now;
    };

    const handlePageHide = () => {
      queueHeartbeat();
      activeStartedAt = null;
    };

    const intervalId =
      window.setInterval(() => {
        if (
          document.visibilityState ===
          'visible'
        ) {
          queueHeartbeat();
        }
      }, HEARTBEAT_INTERVAL_MS);

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    window.addEventListener(
      'pagehide',
      handlePageHide
    );

    return () => {
      window.clearInterval(intervalId);

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );

      window.removeEventListener(
        'pagehide',
        handlePageHide
      );
    };
  }, [
    collectionEnabled,
    identityKey,
    isAdmin,
    loading,
  ]);

  return null;
}

export default AnalyticsTracker;