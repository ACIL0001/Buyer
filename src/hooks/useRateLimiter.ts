import { useState, useCallback } from 'react';

interface RateLimitConfig {
  maxAttempts: number;
  timeWindowMs: number;
  lockoutPeriodMs: number;
}

export function useRateLimiter(config: RateLimitConfig) {
  const [attempts, setAttempts] = useState<number>(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  const incrementAttempt = useCallback(() => {
    const now = Date.now();

    // Check if we are currently locked out
    if (lockoutUntil && now < lockoutUntil) {
      return false; // Action rejected
    }

    // Reset attempts if the lockout period has expired
    if (lockoutUntil && now >= lockoutUntil) {
      setLockoutUntil(null);
      setAttempts(1);
      return true; // Action allowed
    }

    // Increment attempt and check threshold
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts >= config.maxAttempts) {
      setLockoutUntil(now + config.lockoutPeriodMs);
      return false; // Action rejected (locked out)
    }

    return true; // Action allowed
  }, [attempts, lockoutUntil, config]);

  const resetAttempts = useCallback(() => {
    setAttempts(0);
    setLockoutUntil(null);
  }, []);

  const getRemainingLockoutSeconds = useCallback(() => {
    if (!lockoutUntil) return 0;
    const remaining = lockoutUntil - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }, [lockoutUntil]);

  const isLockedOut = useCallback(() => {
    return lockoutUntil !== null && Date.now() < lockoutUntil;
  }, [lockoutUntil]);

  return {
    incrementAttempt,
    resetAttempts,
    getRemainingLockoutSeconds,
    isLockedOut,
    attempts
  };
}
