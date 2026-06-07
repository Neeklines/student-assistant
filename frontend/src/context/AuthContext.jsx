import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as authService from "@/services/authService.js";
import { resetSessionId } from "@/services/chatService.js";

const TOKEN_KEY = "auth_token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  // Bootstrap once on mount: validate any stored token via /me.
  // Empty deps are intentional — login/register/logout manage state directly,
  // so we must NOT re-run on token changes (would cause duplicate getMe calls).
  useEffect(() => {
    let cancelled = false;
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setLoading(false);
      return;
    }
    authService.getMe(storedToken)
      .then((me) => { if (!cancelled) setUser(me); })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email, password) => {
    const { access_token } = await authService.login(email, password);
    localStorage.setItem(TOKEN_KEY, access_token);
    setToken(access_token);
    const me = await authService.getMe(access_token);
    setUser(me);
  }, []);

  const googleLogin = useCallback(async (credential) => {
    const { access_token } = await authService.googleLogin(credential);
    localStorage.setItem(TOKEN_KEY, access_token);
    setToken(access_token);
    const me = await authService.getMe(access_token);
    setUser(me);
  }, []);

  const register = useCallback(async (email, password) => {
    await authService.register(email, password);
    const { access_token } = await authService.login(email, password);
    localStorage.setItem(TOKEN_KEY, access_token);
    setToken(access_token);
    const me = await authService.getMe(access_token);
    setUser(me);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    resetSessionId();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, googleLogin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
