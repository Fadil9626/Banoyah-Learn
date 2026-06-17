import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { setToken, getToken } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      const { user, organization } = await api("auth/me");
      setUser(user);
      setOrg(organization);
    } catch {
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  // Returns { mfa_required: true } when 2FA is on and no/blank code was supplied.
  const login = async (email, password, totp_code) => {
    const res = await api("auth/login", { method: "POST", body: JSON.stringify({ email, password, totp_code }) });
    if (res.mfa_required) return { mfa_required: true };
    setToken(res.token);
    setUser(res.user);
    await loadMe();
    return { ok: true };
  };

  const bootstrap = async (payload) => {
    const { token, user, organization } = await api("auth/bootstrap", { method: "POST", body: JSON.stringify(payload) });
    setToken(token);
    setUser(user);
    setOrg(organization);
  };

  const logout = () => { setToken(null); setUser(null); setOrg(null); };

  return (
    <AuthContext.Provider value={{ user, org, loading, login, bootstrap, logout, refresh: loadMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
