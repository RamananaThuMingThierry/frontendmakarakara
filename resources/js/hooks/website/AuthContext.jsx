import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loginApi, meApi, logoutApi } from "../../api/auth";
import { logoutAdminApi } from "../../api/admin";
import { setApiToken } from "../../api/axios";

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
      const v = JSON.parse(localStorage.getItem("roles") || "[]");
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);

  const [hydrating, setHydrating] = useState(() => !!localStorage.getItem("token"));
  
  const isAuth = !!token;

  const clearClientAuth = () => {
    setApiToken("");
    setUser(null);
    setToken("");
    setRoles([]);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("roles");
  };

  // Sync axios token
  useEffect(() => {
    setApiToken(token || "");
  }, [token]);

  // Persistance (OK)
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem("roles", JSON.stringify(Array.isArray(roles) ? roles : []));
  }, [roles]);

  useEffect(() => {
    console.log("AuthProvider mounted");
    return () => console.log("AuthProvider unmounted");
  }, []);


  // ✅ Hydrate session: token existe mais roles/user pas prêts
  useEffect(() => {
    console.log("hydrate");
    const run = async () => {
        console.log(token);
      if (!token) {
        setHydrating(false);
        return;
      }

      
      const r = Array.isArray(roles) ? roles : [];
      const needHydrate = !user || r.length === 0;

      if (!needHydrate) {
        setHydrating(false);
        return;
      }

      setHydrating(true);
      
      try {
        setApiToken(token);           // ✅ force header
        const data = await meApi();   // ✅ fetch roles
        setUser(data.user || null);
        setRoles(Array.isArray(data.roles) ? data.roles : []);
      } catch (e) {
        console.log("meApi failed:", e?.response?.status, e?.response?.data);
        clearClientAuth();
      } finally {
        setHydrating(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);


  const login = async ({ email, password, rememberMe }) => {
    setLoading(true);
    try {
      const data = await loginApi({ email, password, remember: !!rememberMe });

      const nextToken = data.token || "";
      const nextUser = data.user || null;
      const nextRoles = Array.isArray(data.roles) ? data.roles : [];

      // set + persist immédiat
      setToken(nextToken);
      setUser(nextUser);
      setRoles(nextRoles);

      setApiToken(nextToken);

      if (nextToken) localStorage.setItem("token", nextToken);
      else localStorage.removeItem("token");

      localStorage.setItem("user", JSON.stringify(nextUser));
      localStorage.setItem("roles", JSON.stringify(nextRoles));

      // ✅ si roles manquants, hydrate via /me
      if (nextToken && nextRoles.length === 0) {
        setHydrating(true);
        try {
          setApiToken(nextToken);
          const me = await meApi();
          const meUser = me.user || nextUser;
          const meRoles = Array.isArray(me.roles) ? me.roles : [];

          setUser(meUser);
          setRoles(meRoles);
          localStorage.setItem("user", JSON.stringify(meUser));
          localStorage.setItem("roles", JSON.stringify(meRoles));
        } catch (e) {
          console.log("meApi after login failed:", e?.response?.status, e?.response?.data);
          clearClientAuth();
          return { ok: false, message: "Session invalide" };
        } finally {
          setHydrating(false);
        }
      }

      return { ok: true };
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
    clearClientAuth();
  };

  const logoutAdmin = async () => {
    try {
      await logoutAdminApi();
    } catch {}
    clearClientAuth();
  };

  const value = useMemo(
    () => ({
      user,
      roles,
      token,
      isAuth,
      loading,
      hydrating,
      login,
      logout,
      logoutAdmin,
      hasRole: (role) => (Array.isArray(roles) ? roles.includes(role) : false),
    }),
    [user, roles, token, isAuth, loading, hydrating]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}
