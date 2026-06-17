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

  const login = async (email, password) => {
    const { token, user } = await api("auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    setToken(token);
    setUser(user);
    await loadMe();
  };

  const bootstrap = async (payload) => {
    const { token, user, organization } = await api("auth/bootstrap", { method: "POST", body: JSON.stringify(payload) });
    setToken(token);
    setUser(user);
    setOrg(organization);
  };

  const logout = () => { setToken(null); setUser(null); setOrg(null); };

  return (
    <AuthContext.Provider value={{ user, org, loading, login, bootstrap, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
