import { useEffect, useRef } from "react";
import { api } from "../lib/api";

/** Idle wall-clock before the admin session is ended. */
export const ADMIN_IDLE_MS = 5 * 60 * 1000;

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "touchstart",
  "scroll",
  "click",
  "wheel",
];

/**
 * Ends the admin session after 5 minutes of idle, and detects when another
 * device has taken the same account (session_version mismatch → 401 on /me).
 */
export function useAdminSessionGuard({ enabled, onExpire }) {
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const lastActivityRef = useRef(Date.now());
  const endingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return undefined;

    function markActivity() {
      lastActivityRef.current = Date.now();
    }

    function expire(reason) {
      if (endingRef.current) return;
      endingRef.current = true;
      onExpireRef.current?.(reason);
    }

    function checkIdle() {
      if (Date.now() - lastActivityRef.current >= ADMIN_IDLE_MS) {
        expire("idle");
      }
    }

    async function checkSessionAlive() {
      try {
        await api.me();
      } catch (err) {
        if (err?.status === 401) expire("replaced");
      }
    }

    function onVisibility() {
      if (document.visibilityState !== "visible") return;
      checkIdle();
      if (!endingRef.current) checkSessionAlive();
    }

    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, markActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisibility);

    const idleTimer = window.setInterval(checkIdle, 15_000);
    const sessionTimer = window.setInterval(checkSessionAlive, 30_000);

    markActivity();

    return () => {
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, markActivity);
      }
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(idleTimer);
      window.clearInterval(sessionTimer);
    };
  }, [enabled]);
}
