import React, { useEffect, useMemo, useState } from "react";


export default function SlideFormModal({ open, initial, loading, onClose, onSubmit }) {
  const isEdit = !!initial?.id;

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [position, setPosition] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(""); // pour edit

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;

    setTitle(initial?.title ?? "");
    setSubtitle(initial?.subtitle ?? "");
    setPosition(Number(initial?.position ?? 0));
    setIsActive(Boolean(initial?.is_active ?? true));
    setFile(null);
    setImageUrl(initial?.image_url ?? "");
  }, [open, initial]);

    const logoUrl = (logo) => {
    if (!logo) return "";
        const s = String(logo).trim();
        if (s.startsWith("http")) return s;
        if (s.startsWith("/")) return s;
        return `/${s}`;
    };

  const preview = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return logoUrl(imageUrl) || "";
  }, [file, imageUrl]);

  // évite fuite mémoire objectURL
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!open) return null;

  function buildPayload() {
    // ✅ Upload image via FormData (recommandé)
    const fd = new FormData();
    fd.append("title", title);
    fd.append("subtitle", subtitle);
    fd.append("position", String(position));
    fd.append("is_active", isActive ? "1" : "0");

    // si create => image obligatoire
    // si edit => image optionnelle (si ton backend le permet)
    if (file) fd.append("image_url", file);

    // Beaucoup de backends Laravel utilisent POST + _method=PUT/PATCH.
    // Mais toi tu fais POST /admin/slides/:id, donc pas besoin.
    return fd;
  }

    async function handleSubmit(e) {
        e.preventDefault();
        setErrors({});

        try {
            await onSubmit(buildPayload());
        } catch (err) {
            if (err?.response?.status === 422) {
            setErrors(err.response.data.errors || {});
            } else {
            console.error(err);
            }
        }
    }

  return (
    <>
      <div className="modal fade show" style={{ display: "block" }} aria-modal="true" role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow">
            <div className="modal-header">
              <h5 className="modal-title">{isEdit ? "Modifier le slide" : "Nouveau slide"}</h5>
              <button type="button" className="btn-close" onClick={onClose} disabled={loading} />
            </div>

            <form onSubmit={handleSubmit} encType="multipart/form-data">
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-7">
                    <label className="form-label">Titre</label>
                        <input
                        className={`form-control ${errors.title ? "is-invalid" : ""}`}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        />

                        {errors.title && (
                        <div className="invalid-feedback">
                            {errors.title[0]}
                        </div>
                        )}

                    <label className="form-label mt-3">Sous-titre</label>
                    <input
                      className={`form-control ${errors.subtitle ? "is-invalid" : ""}`}
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="Sous-titre (optionnel)"
                    />

                    {errors.subtitle && (
                      <div className="invalid-feedback">
                        {errors.subtitle[0]}
                      </div>
                    )}

                    <div className="row g-2 mt-3">
                      <div className="col-6">
                        <label className="form-label">Position</label>
<input
  type="number"
  className={`form-control ${errors.position ? "is-invalid" : ""}`}
  value={position}
  onChange={(e) => setPosition(Number(e.target.value))}
/>

{errors.position && (
  <div className="invalid-feedback">
    {errors.position[0]}
  </div>
)}
                      </div>
                      <div className="col-6 d-flex align-items-end">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            id="isActive"
                          />
                          <label className="form-check-label" htmlFor="isActive">
                            Actif
                          </label>
                        </div>
                      </div>
                    </div>

                    <label className="form-label mt-3">
                      Image {isEdit ? "(optionnel si tu veux remplacer)" : "(obligatoire)"}
                    </label>
<input
  className={`form-control ${errors.image_url ? "is-invalid" : ""}`}
  type="file"
  accept="image/*"
  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
/>

{errors.image_url && (
  <div className="invalid-feedback">
    {errors.image_url[0]}
  </div>
)}

                    <div className="form-text">
                      Astuce : utilise une image large (ex: 1600×600) pour un rendu propre.
                    </div>
                  </div>

                  <div className="col-md-5">
                    <div className="border rounded-3 p-2">
                      <div className="small text-muted mb-2">Aperçu</div>
                      {preview ? (
                        <img
                          src={preview}
                          alt="preview"
                          style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 10 }}
                        />
                      ) : (
                        <div
                          className="d-flex align-items-center justify-content-center text-muted"
                          style={{ height: 220 }}
                        >
                          Pas d'image
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-warning" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Enregistrement...
                    </>
                  ) : isEdit ? (
                    "Mettre à jour"
                  ) : (
                    "Créer"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" onClick={loading ? undefined : onClose} />
    </>
  );
}
