import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loginApi, meApi, logoutApi } from "../../api/auth";

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

  const [roles, setRoles] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("roles") || "[]");
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);

  // ✅ persist token/user/roles
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  useEffect(() => {
    localStorage.setItem("roles", JSON.stringify(Array.isArray(roles) ? roles : []));
  }, [roles]);

  // ✅ hydrate user au refresh si token présent
  useEffect(() => {
    const run = async () => {
      if (!token || user) return;
      try {
        const data = await meApi(); // attendu: { user, roles }
        setUser(data.user || null);
        setRoles(Array.isArray(data.roles) ? data.roles : []);
      } catch {
        setToken("");
        setUser(null);
        setRoles([]);
      }
    };

    run();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ login API
  const login = async ({ email, password, rememberMe }) => {
    setLoading(true);
    try {
      // ⚠️ ton backend valide "remember" pas "rememberMe"
      const data = await loginApi({
        email,
        password,
        remember: !!rememberMe,
      });

      setUser(data.user || null);
      setToken(data.token || "");
      setRoles(Array.isArray(data.roles) ? data.roles : []);

      // ✅ renvoyer user + roles au composant Login pour redirection
      return { ok: true, user: data.user, roles: data.roles || [] };
    } catch (e) {
      return {
        ok: false,
        message: e?.response?.data?.message,
        errors: e?.response?.data?.errors,
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {}

    setUser(null);
    setToken("");
    setRoles([]);
  };

  const isAuth = !!token && !!user;

  const value = useMemo(
    () => ({
      user,
      roles,
      token,
      isAuth,
      loading,
      login,
      logout,
      hasRole: (role) => roles.includes(role),
    }),
    [user, roles, token, isAuth, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}
