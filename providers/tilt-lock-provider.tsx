"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type TiltLockContextValue = {
  failStreak: number;
  isLocked: boolean;
  secondsLeft: number;
  reportDrillResult: (passed: boolean) => void;
  resetTilt: () => void;
};

const LOCKOUT_MS = 60_000;

const TiltLockContext = createContext<TiltLockContextValue | undefined>(undefined);

export function TiltLockProvider({ children }: { children: React.ReactNode }) {
  const [failStreak, setFailStreak] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  const isLocked = lockoutUntil !== null && lockoutUntil > now;
  const secondsLeft = isLocked && lockoutUntil ? Math.ceil((lockoutUntil - now) / 1000) : 0;

  const resetTilt = useCallback(() => {
    setFailStreak(0);
    setLockoutUntil(null);
  }, []);

  const reportDrillResult = useCallback(
    (passed: boolean) => {
      if (isLocked) {
        return;
      }

      if (passed) {
        setFailStreak(0);
        return;
      }

      setFailStreak((current) => {
        const next = current + 1;
        if (next >= 3) {
          setLockoutUntil(Date.now() + LOCKOUT_MS);
          return 0;
        }
        return next;
      });
    },
    [isLocked],
  );

  const value = useMemo<TiltLockContextValue>(
    () => ({
      failStreak,
      isLocked,
      secondsLeft,
      reportDrillResult,
      resetTilt,
    }),
    [failStreak, isLocked, reportDrillResult, resetTilt, secondsLeft],
  );

  return <TiltLockContext.Provider value={value}>{children}</TiltLockContext.Provider>;
}

export function useTiltLock() {
  const context = useContext(TiltLockContext);
  if (!context) {
    throw new Error("useTiltLock must be used inside TiltLockProvider");
  }
  return context;
}
