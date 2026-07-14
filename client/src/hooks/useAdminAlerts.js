import { useState, useEffect, useCallback } from 'react';
import { fetchContactMessages } from '../services/api';
import { fetchAllSponsorships } from '../services/portalService';

const POLL_INTERVAL = 30000; // 30 שניות

export function useAdminAlerts(enabled) {
  const [counts, setCounts] = useState({ contact: 0, sponsorships: 0 });

  const load = useCallback(async () => {
    if (!enabled) return;
    try {
      const [contactRes, sponsorRes] = await Promise.all([
        fetchContactMessages({ handled: false }),
        fetchAllSponsorships(),
      ]);
      const contactCount = Array.isArray(contactRes.data) ? contactRes.data.length : 0;
      const sponsorCount = Array.isArray(sponsorRes.data)
        ? sponsorRes.data.filter((r) => r.status === 'pending').length
        : 0;
      setCounts({ contact: contactCount, sponsorships: sponsorCount });
    } catch {
      // שקט — לא מציגים שגיאה על באדג' רקע
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setCounts({ contact: 0, sponsorships: 0 });
      return;
    }
    load();
    const interval = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [enabled, load]);

  return { ...counts, total: counts.contact + counts.sponsorships, refresh: load };
}