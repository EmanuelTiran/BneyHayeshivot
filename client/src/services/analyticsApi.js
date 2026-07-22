import { API_URL } from '../config';

function getAuthorizationHeader() {
  try {
    const token =
      window.localStorage.getItem('token');

    return token
      ? `Bearer ${token}`
      : '';
  } catch {
    return '';
  }
}

async function postAnalyticsEvent(
  endpoint,
  payload
) {
  try {
    const authorization =
      getAuthorizationHeader();

    const headers = {
      'Content-Type': 'application/json',
    };

    if (authorization) {
      headers.Authorization =
        authorization;
    }

    const response = await fetch(
      `${API_URL}/api/analytics/${endpoint}`,
      {
        method: 'POST',
        headers,
        credentials: 'omit',
        keepalive: true,
        body: JSON.stringify(payload),
      }
    );

    return response.ok;
  } catch {
    // Analytics failures must never affect the visitor experience.
    return false;
  }
}

export function sendPageViewEvent(payload) {
  return postAnalyticsEvent(
    'page-view',
    payload
  );
}

export function sendHeartbeatEvent(payload) {
  return postAnalyticsEvent(
    'heartbeat',
    payload
  );
}