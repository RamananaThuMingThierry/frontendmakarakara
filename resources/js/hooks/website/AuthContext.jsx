import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  forgotPasswordApi,
  loginApi,
  meApi,
  logoutApi,
  registerApi,
  resetPasswordApi,
  verifyResetCodeApi,
} from "../../api/auth";
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
  // const isAuth = token ? true : false;

  const clearClientAuth = useCallback(() => {
    setApiToken("");
    setUser(null);
    setToken("");
    setRoles([]);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("roles");
  }, []);

  const applyAuthState = useCallback(({ token: nextToken, user: nextUser, roles: nextRoles }) => {
    const safeToken = nextToken || "";
    const safeUser = nextUser || null;
    const safeRoles = Array.isArray(nextRoles) ? nextRoles : [];

    setToken(safeToken);
    setUser(safeUser);
    setRoles(safeRoles);
    setApiToken(safeToken);

    if (safeToken) localStorage.setItem("token", safeToken);
    else localStorage.removeItem("token");

    localStorage.setItem("user", JSON.stringify(safeUser));
    localStorage.setItem("roles", JSON.stringify(safeRoles));
  }, []);

  const replaceAuthUser = useCallback((nextUser) => {
    setUser(nextUser || null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return null;

    const data = await meApi();
    const nextUser = data.user || null;
    const nextRoles = Array.isArray(data.roles) ? data.roles : [];

    setUser(nextUser);
    setRoles(nextRoles);

    return data;
  }, [token]);

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


useEffect(() => {
  let cancelled = false;

  const run = async () => {
    if (!token) {
      if (!cancelled) setHydrating(false);
      return;
    }

    const r = Array.isArray(roles) ? roles : [];
    const needHydrate = !user || r.length === 0;

    if (!needHydrate) {
      if (!cancelled) setHydrating(false);
      return;
    }

    if (!cancelled) setHydrating(true);

    try {
      setApiToken(token);
      const data = await meApi();
      if (cancelled) return;

      setUser(data.user || null);
      setRoles(Array.isArray(data.roles) ? data.roles : []);
    } catch {
      if (cancelled) return;
      clearClientAuth();
    } finally {
      if (!cancelled) setHydrating(false);
    }
  };

  run();
  return () => {
    cancelled = true;
  };
}, [token]);




  const login = useCallback(async ({ email, password, rememberMe }) => {
    
    setLoading(true);
    
    try {
      const data = await loginApi({ email, password, remember: !!rememberMe });

      const nextToken = data.token || "";
      const nextUser = data.user || null;
      const nextRoles = Array.isArray(data.roles) ? data.roles : [];

      // set + persist immédiat
      applyAuthState({ token: nextToken, user: nextUser, roles: nextRoles });

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

      return { ok: true, roles: nextRoles, user: nextUser };
    } catch (e) {
      return {
        ok: false,
        message: e?.response?.data?.message,
        errors: e?.response?.data?.errors,
      };
    } finally {
      setLoading(false);
    }
  }, [applyAuthState, clearClientAuth]);

  const register = useCallback(async ({ name, email, phone, password }) => {
    setLoading(true);

    try {
      const data = await registerApi({
        name,
        email,
        phone: phone || "",
        password,
        password_confirmation: password,
      });

      applyAuthState({
        token: data.token || "",
        user: data.user || null,
        roles: data.roles || ["customer"],
      });

      return {
        ok: true,
        roles: Array.isArray(data.roles) ? data.roles : ["customer"],
        user: data.user || null,
      };
    } catch (e) {
      return {
        ok: false,
        message: e?.response?.data?.message,
        errors: e?.response?.data?.errors,
      };
    } finally {
      setLoading(false);
    }
  }, [applyAuthState]);

  const forgotPassword = useCallback(async ({ email }) => {
    setLoading(true);

    try {
      const data = await forgotPasswordApi({ email });
      return {
        ok: true,
        message: data?.message,
        expiresInMinutes: data?.expires_in_minutes ?? 15,
      };
    } catch (e) {
      return {
        ok: false,
        message: e?.response?.data?.message,
        errors: e?.response?.data?.errors,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyResetCode = useCallback(async ({ email, code }) => {
    setLoading(true);

    try {
      const data = await verifyResetCodeApi({ email, code });
      return {
        ok: true,
        message: data?.message,
      };
    } catch (e) {
      return {
        ok: false,
        message: e?.response?.data?.message,
        errors: e?.response?.data?.errors,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async ({ email, code, password }) => {
    setLoading(true);

    try {
      const data = await resetPasswordApi({
        email,
        code,
        password,
        password_confirmation: password,
      });

      return {
        ok: true,
        message: data?.message,
      };
    } catch (e) {
      return {
        ok: false,
        message: e?.response?.data?.message,
        errors: e?.response?.data?.errors,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {}
    clearClientAuth();
  }, [clearClientAuth]);

  const logoutAdmin = useCallback(async () => {
    try {
      await logoutAdminApi();
    } catch {}
    clearClientAuth();
  }, [clearClientAuth]);

  const value = useMemo(
    () => ({
      user,
      roles,
      token,
      isAuth,
      loading,
      hydrating,
      login,
      register,
      forgotPassword,
      verifyResetCode,
      resetPassword,
      logout,
      logoutAdmin,
      refreshUser,
      replaceAuthUser,
      hasRole: (role) => (Array.isArray(roles) ? roles.includes(role) : false),
    }),
    [
      user,
      roles,
      token,
      isAuth,
      loading,
      hydrating,
      login,
      register,
      forgotPassword,
      verifyResetCode,
      resetPassword,
      logout,
      logoutAdmin,
      refreshUser,
      replaceAuthUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}
