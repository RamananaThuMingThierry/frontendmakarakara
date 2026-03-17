export const imageUrl = (val) => {
  if (!val) return "";

  const s = String(val).trim();
  if (!s) return "";

  // URL complète (http / https)
  if (/^https?:\/\//i.test(s)) return s;

  // Déjà chemin absolu
  if (s.startsWith("/")) return s;

  // Sinon on ajoute /
  return `/${s}`;
};
