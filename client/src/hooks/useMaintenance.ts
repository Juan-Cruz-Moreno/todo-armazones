import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchMaintenance } from "@/redux/slices/maintenanceSlice";
import { useEffect, useState } from "react";
import { Maintenance } from "@/interfaces/maintenance";

const CACHE_KEY = "maintenance_cache_v1";
const CACHE_TTL_MS = 60 * 1000; // 1 minute

export const useMaintenance = () => {
  const dispatch = useAppDispatch();
  const { maintenance, loading, error } = useAppSelector((state) => state.maintenance);
  const [cached, setCached] = useState<Maintenance | null>(null);

  // On mount, try to read a cached maintenance value from localStorage so we can
  // return an immediate sensible value (avoids UI flash). Still fetch to validate.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { ts: number; value: Maintenance };
        if (parsed?.ts && Date.now() - parsed.ts < CACHE_TTL_MS && parsed.value) {
          setCached(parsed.value);
        }
      }
    } catch {
      // ignore parse errors
    }

    // Always dispatch a fetch to validate and update the store; the slice handles dedupe.
    if (!maintenance) {
      dispatch(fetchMaintenance());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever the real maintenance state updates, persist to cache.
  useEffect(() => {
    if (maintenance) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), value: maintenance }));
        setCached(maintenance);
      } catch {
        // ignore storage errors
      }
    }
  }, [maintenance]);

  // If redux hasn't provided a maintenance object yet, but we have a cached one,
  // return the cached value immediately and treat loading as false to avoid flashes.
  const maintenanceToReturn = maintenance ?? cached;
  const loadingToReturn = maintenance ? loading : loading && !cached;

  return { maintenance: maintenanceToReturn, loading: loadingToReturn, error };
};