"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { AuthenticatedUser } from "@/features/auth/types";
import { DEFAULT_AVATAR, isAvailableAvatar } from "@/features/profile/avatars";

interface UserContextValue {
  currentUser: AuthenticatedUser | null;
  loading: boolean;
  error: string | null;
  setCurrentUser: (user: AuthenticatedUser) => void;
  refreshCurrentUser: () => Promise<AuthenticatedUser | null>;
  clearCurrentUser: () => void;
}

export const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setCurrentUser = useCallback((user: AuthenticatedUser) => {
    setCurrentUserState({
      ...user,
      avatar: isAvailableAvatar(user.avatar) ? user.avatar : DEFAULT_AVATAR,
    });
    setError(null);
  }, []);

  const clearCurrentUser = useCallback(() => {
    setCurrentUserState(null);
    setError(null);
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/user/me", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as Partial<AuthenticatedUser> & {
        detail?: string;
      };

      if (!response.ok || typeof data.user_name !== "string" || typeof data.score !== "number") {
        throw new Error(data.detail || "Unable to load profile.");
      }

      const user: AuthenticatedUser = {
        user_name: data.user_name,
        score: data.score,
        avatar: isAvailableAvatar(data.avatar) ? data.avatar : DEFAULT_AVATAR,
        ...(typeof data.streak === "number" ? { streak: data.streak } : {}),
      };
      setCurrentUserState({ ...user });
      return user;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Unable to load profile.";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({ currentUser, loading, error, setCurrentUser, refreshCurrentUser, clearCurrentUser }),
    [currentUser, loading, error, setCurrentUser, refreshCurrentUser, clearCurrentUser],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
