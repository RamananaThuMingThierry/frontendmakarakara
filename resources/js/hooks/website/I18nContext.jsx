import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const I18nCtx = createContext(null);
const SUPPORTED = ["fr", "en", "de", "es"];

function deepMerge(target, source) {
  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      target[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

async function loadLang(lang) {
  // Vite / modern bundlers
  const modules = import.meta.glob("../../../lang/*/*.json");

  const result = {};

  const entries = Object.entries(modules).filter(([path]) =>
    path.includes(`/lang/${lang}/`)
  );

  for (const [path, loader] of entries) {
    const mod = await loader();
    const name = path.split("/").pop().replace(".json", "");

    result[name] = mod.default ?? mod;
  }

  return result;
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "fr");
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const safe = SUPPORTED.includes(lang) ? lang : "fr";
    localStorage.setItem("lang", safe);
    document.documentElement.lang = safe;

    let alive = true;
    setLoading(true);

    loadLang(safe)
      .then((m) => alive && setMessages(m))
      .finally(() => alive && setLoading(false));

    return () => (alive = false);
  }, [lang]);

  const t = useMemo(() => {
    return (key, fallback) => {
      const val = key.split(".").reduce((acc, k) => (acc ? acc[k] : undefined), messages);
      return val ?? fallback ?? key;
    };
  }, [messages]);

  const value = useMemo(
    () => ({ lang, setLang, t, loading, supported: SUPPORTED }),
    [lang, t, loading]
  );

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
