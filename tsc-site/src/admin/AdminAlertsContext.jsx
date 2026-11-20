import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api } from "../lib/api";
import { useToast } from "../components/Toast";

const AdminAlertsContext = createContext(null);

const POLL_MS = 8000;
const SEEN_KEY = "kerry_admin_seen_application_id";

export function AdminAlertsProvider({ children }) {
  const toast = useToast();
  const [summary, setSummary] = useState({
    newApplications: 0,
    newEnquiries: 0,
    latestApplication: null,
  });
  const [tick, setTick] = useState(0);
  const primed = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api.alertsSummary();
      const latestId = data.latestApplication?.id || null;
      const seenId =
        typeof sessionStorage !== "undefined"
          ? sessionStorage.getItem(SEEN_KEY)
          : null;

      if (primed.current && latestId && latestId !== seenId) {
        const name = data.latestApplication.fullName || "a candidate";
        const cvNote = data.latestApplication.hasCv ? " (CV attached)" : "";
        toast.success(`New application from ${name}${cvNote}`);
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(SEEN_KEY, latestId);
        }
        setTick((t) => t + 1);
      } else if (!primed.current) {
        primed.current = true;
        if (latestId && typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(SEEN_KEY, latestId);
        }
      }

      setSummary({
        newApplications: data.newApplications || 0,
        newEnquiries: data.newEnquiries || 0,
        latestApplication: data.latestApplication || null,
      });
    } catch {
      /* session may have expired; layout handles auth */
    }
  }, [toast]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const value = useMemo(
    () => ({
      ...summary,
      applicationFeedTick: tick,
      refreshAlerts: refresh,
    }),
    [summary, tick, refresh]
  );

  return (
    <AdminAlertsContext.Provider value={value}>
      {children}
    </AdminAlertsContext.Provider>
  );
}

export function useAdminAlerts() {
  const ctx = useContext(AdminAlertsContext);
  if (!ctx) {
    throw new Error("useAdminAlerts requires AdminAlertsProvider");
  }
  return ctx;
}
