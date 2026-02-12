import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  // ✅ (Mock) login local, à remplacer par API Laravel
  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      // TODO: remplacer par fetch("/api/login")
      if (!email || !password) throw new Error("Email/mot de passe requis");

      // mock user
      const fakeUser = { id: 1, name: "Client", email };
      setUser(fakeUser);
      setToken("FAKE_TOKEN");
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e.message || "Erreur login" };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken("");
  };

  const isAuth = !!token && !!user;

  const value = useMemo(
    () => ({ user, token, isAuth, loading, login, logout }),
    [user, token, isAuth, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}
