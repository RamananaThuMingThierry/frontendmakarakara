import { useEffect, useMemo, useRef, useState } from "react";
import { productImagesApi } from "@/api/product_images";

const DEFAULT_IMG = "/images/box.png";

function makeId() {
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
function getUrl(img) {
  if (!img) return DEFAULT_IMG;
  return img.full_url || (img.url ? `/${img.url}` : DEFAULT_IMG);
}
function getEncryptedId(img) {
  return img?.encrypted_id;
}

function extractLaravelError(err) {
  const data = err?.response?.data;

  if (typeof data?.message === "string" && data.message.trim() && !data?.errors) {
    return data.message;
  }

  if (data?.errors && typeof data.errors === "object") {
    const messages = [];
    for (const key of Object.keys(data.errors)) {
      const arr = data.errors[key];
      if (Array.isArray(arr)) messages.push(...arr);
    }
    if (messages.length) return messages.join("\n");
  }

  if (typeof data?.message === "string" && data.message.trim()) return data.message;

  return "Une erreur est survenue. Vérifie la taille/format de l’image et réessaie.";
}

export default function ProductInfo({ product, onRefresh }) {
  // local images
  const [localImages, setLocalImages] = useState(product?.images || []);
  useEffect(() => setLocalImages(product?.images || []), [product]);

  const images = localImages || [];

  // ---------------- Modal open states (React controlled) ----------------
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    // si le produit change ou la liste change, on reset proprement
    setActiveIndex(0);
  }, [product?.id, images.length]);

  function openAdd() {
    clearAddAlerts();
    setAddItems([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setAddOpen(true);
  }

  function closeAdd() {
    if (addLoading) return;
    setAddOpen(false);
  }

  function openDelete() {
    clearDeleteAlerts();
    setSelectedToDelete(new Set());
    setDeleteOpen(true);
  }

  function closeDelete() {
    if (deleteLoading) return;
    setDeleteOpen(false);
    setSelectedToDelete(new Set());
  }

  // Prevent body scroll when modal is open (like bootstrap does)
  useEffect(() => {
    const anyOpen = addOpen || deleteOpen;
    if (anyOpen) {
      document.body.classList.add("modal-open");
      document.body.style.overflow = "hidden";
    } else {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
    }
    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
    };
  }, [addOpen, deleteOpen]);

  // ---------------- ADD ----------------
  const fileInputRef = useRef(null);
  const addTimerRef = useRef(null);

  const [addItems, setAddItems] = useState([]); // [{id, file}]
  const [addLoading, setAddLoading] = useState(false);
  const [addErrorMsg, setAddErrorMsg] = useState("");
  const [addSuccessMsg, setAddSuccessMsg] = useState("");

  function clearAddAlerts() {
    setAddErrorMsg("");
    setAddSuccessMsg("");
    if (addTimerRef.current) clearTimeout(addTimerRef.current);
  }

  function showAddError(msg) {
    setAddErrorMsg(msg);
    setAddSuccessMsg("");
    if (addTimerRef.current) clearTimeout(addTimerRef.current);
    addTimerRef.current = setTimeout(() => setAddErrorMsg(""), 5000);
  }

  function handlePickFiles(e) {
    clearAddAlerts();

    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setAddItems((prev) => {
      const prevKeys = new Set(prev.map((x) => `${x.file.name}-${x.file.size}`));
      const next = [...prev];

      for (const f of files) {
        const key = `${f.name}-${f.size}`;
        if (prevKeys.has(key)) continue;
        next.push({ id: makeId(), file: f });
      }
      return next;
    });

    e.target.value = "";
  }

  function removePicked(id) {
    clearAddAlerts();
    setAddItems((prev) => prev.filter((x) => x.id !== id));
  }

  async function handleAddSubmit(e) {
    e.preventDefault();
    if (!product?.id || !addItems.length) return;

    clearAddAlerts();

    const fd = new FormData();
    fd.append("product_id", product.id);
    addItems.forEach(({ file }) => fd.append("images[]", file));

    try {
      setAddLoading(true);

      const res = await productImagesApi.create(fd);
      const returnedImages = res?.data?.data || [];

      if (Array.isArray(returnedImages) && returnedImages.length) {
        setLocalImages((prev) => [...prev, ...returnedImages]);
      }

      setAddItems([]);
      if (fileInputRef.current) fileInputRef.current.value = "";

      onRefresh?.();

      // ✅ fermeture fiable
      setAddOpen(false);
    } catch (err) {
      showAddError(extractLaravelError(err));
    } finally {
      setAddLoading(false);
    }
  }

  // ---------------- DELETE ----------------
  const deleteTimerRef = useRef(null);

  const [selectedToDelete, setSelectedToDelete] = useState(new Set());
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState("");
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState("");

  function clearDeleteAlerts() {
    setDeleteErrorMsg("");
    setDeleteSuccessMsg("");
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
  }

  function showDeleteError(msg) {
    setDeleteErrorMsg(msg);
    setDeleteSuccessMsg("");
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    deleteTimerRef.current = setTimeout(() => setDeleteErrorMsg(""), 5000);
  }

  function toggleToDelete(encryptedId) {
    clearDeleteAlerts();
    setSelectedToDelete((prev) => {
      const next = new Set(prev);
      if (next.has(encryptedId)) next.delete(encryptedId);
      else next.add(encryptedId);
      return next;
    });
  }

  async function handleDeleteSubmit() {
    const ids = Array.from(selectedToDelete);
    if (!ids.length) return;

    clearDeleteAlerts();

    try {
      setDeleteLoading(true);

      await Promise.all(ids.map((encId) => productImagesApi.remove(encId)));

      setLocalImages((prev) =>
        prev.filter((img) => {
          const enc = getEncryptedId(img);
          return enc ? !selectedToDelete.has(enc) : true;
        })
      );

      setActiveIndex((i) => {
  const nextLen = images.length - selectedToDelete.size;
  if (nextLen <= 0) return 0;
  return Math.min(i, nextLen - 1);
});
      setSelectedToDelete(new Set());
      onRefresh?.();

      // ✅ fermeture fiable
      setDeleteOpen(false);
    } catch (err) {
      showDeleteError(extractLaravelError(err));
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      {/* left column */}
      <div className="col-12 col-lg-5">
        <div className="card shadow-sm">
          <div className="card-header bg-white d-flex align-items-center justify-content-between">
            <div className="fw-semibold">Images du produit</div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary btn-sm" type="button" onClick={openAdd}>
                <i className="bi bi-upload"></i> Ajouter
              </button>

              <button
                className="btn btn-outline-danger btn-sm"
                type="button"
                disabled={!images.length}
                onClick={openDelete}
              >
                <i className="bi bi-trash"></i> Supprimer
              </button>
            </div>
          </div>

          <div className="card-body">
            <div id="productCarousel" className="carousel slide" data-bs-ride="carousel">
<div className="position-relative">
  <div className="carousel-inner rounded border bg-white">
    {(images.length ? images : [null]).map((img, idx) => (
      <div
        className={`carousel-item ${idx === activeIndex ? "active" : ""}`}
        key={getEncryptedId(img) || idx}
      >
        <img
          src={getUrl(img)}
          className="d-block w-100"
          alt={`Produit image ${idx + 1}`}
          style={{ objectFit: "cover", maxHeight: "420px" }}
        />
      </div>
    ))}
  </div>

  {/* Prev/Next (visible + fonctionne avec React) */}
  {images.length > 1 && (
    <>
      <button
        type="button"
        className="carousel-control-prev"
        onClick={() => setActiveIndex((i) => (i - 1 + images.length) % images.length)}
        style={{ position: "absolute", top: 0, bottom: 0 }}
      >
        <span className="carousel-control-prev-icon" aria-hidden="true" />
        <span className="visually-hidden">Previous</span>
      </button>

      <button
        type="button"
        className="carousel-control-next"
        onClick={() => setActiveIndex((i) => (i + 1) % images.length)}
        style={{ position: "absolute", top: 0, bottom: 0 }}
      >
        <span className="carousel-control-next-icon" aria-hidden="true" />
        <span className="visually-hidden">Next</span>
      </button>
    </>
  )}
</div>
            </div>

<div className="d-flex gap-2 mt-3 overflow-auto">
  {images.map((img, idx) => (
    <button
      key={getEncryptedId(img) || idx}
      type="button"
      className="p-0 border-0 bg-transparent"
      onClick={() => setActiveIndex(idx)}
      style={{ lineHeight: 0 }}
      title={`Voir image ${idx + 1}`}
    >
      <img
        className={`rounded border ${idx === activeIndex ? "border-primary border-2" : ""}`}
        src={getUrl(img)}
        alt={`thumb${idx + 1}`}
        style={{ width: 90, height: 80, objectFit: "cover" }}
      />
    </button>
  ))}
</div>
          </div>
        </div>
      </div>

            <div className="col-12 col-lg-7">
        <div className="card shadow-sm h-100">
          <div className="card-header bg-white d-flex align-items-center justify-content-between">
            <div className="fw-semibold">Résumé</div>
            <span className="badge text-bg-warning py-2">
              Prix base: {product.price} MGA
            </span>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label text-muted small">Nom</label>
                <div className="form-control bg-light">{product.name}</div>
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label text-muted small">SKU</label>
                <div className="form-control bg-light">{product.sku || "-"}</div>
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label text-muted small">Statut</label>
                <div className="form-control bg-light">
                  {product.is_active ? "Actif" : "Inactif"}
                </div>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label text-muted small">Catégorie</label>
                <div className="form-control bg-light">
                  {product.category?.name || "-"}
                </div>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label text-muted small">Marque</label>
                <div className="form-control bg-light">
                  {product.brand?.name || "-"}
                </div>
              </div>
              <div className="col-12">
                <label className="form-label text-muted small">Description</label>
                <div className="form-control bg-light" style={{ minHeight: 110 }}>
                  {product.description || "-"}
                </div>
              </div>
            </div>
            <hr className="my-4" />
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <div className="p-3 border rounded bg-white">
                  <div className="text-muted small">Stock total</div>
                  <div className="fs-4 fw-semibold">
                    100
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="p-3 border rounded bg-white">
                  <div className="text-muted small">Réservé</div>
                  <div className="fs-4 fw-semibold">
                    0
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="p-3 border rounded bg-white">
                  <div className="text-muted small">Villes associées</div>
                  <div className="fs-4 fw-semibold">
                    {product.cities?.length || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =================== MODAL AJOUT =================== */}
      {addOpen && (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <form className="modal-content" onSubmit={handleAddSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">Ajouter des images</h5>
                  <button type="button" className="btn-close" onClick={closeAdd} disabled={addLoading} />
                </div>

                <div className="modal-body">
                  {addErrorMsg && (
                    <div className="alert alert-danger" style={{ whiteSpace: "pre-line" }}>
                      {addErrorMsg}
                    </div>
                  )}
                  {addSuccessMsg && <div className="alert alert-success">{addSuccessMsg}</div>}

                  <div className="mb-3">
                    <label className="form-label">Fichiers</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="form-control"
                      multiple
                      accept="image/*"
                      onChange={handlePickFiles}
                      disabled={addLoading}
                    />
                    <div className="form-text">Sélectionne plusieurs images. Tu peux retirer une image avant l’envoi.</div>
                  </div>

                  {!!addItems.length ? (
                    <>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="small text-muted">{addItems.length} image(s) sélectionnée(s)</div>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => {
                            clearAddAlerts();
                            setAddItems([]);
                          }}
                          disabled={addLoading}
                        >
                          Tout retirer
                        </button>
                      </div>

                      <div className="d-flex gap-2 flex-wrap">
                        {addItems.map(({ id, file }) => (
                          <div key={id} className="border rounded p-2 position-relative">
                            <button
                              type="button"
                              className="btn btn-sm btn-danger position-absolute"
                              style={{ top: 6, right: 6 }}
                              onClick={() => removePicked(id)}
                              title="Retirer"
                              disabled={addLoading}
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>

                            <div className="small text-muted text-truncate" style={{ maxWidth: 160 }}>
                              {file.name}
                            </div>

                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              style={{ width: 160, height: 120, objectFit: "cover" }}
                              className="rounded mt-2"
                              onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-muted small">Aucune image sélectionnée.</div>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeAdd} disabled={addLoading}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={addLoading || !addItems.length}>
                    {addLoading ? "Upload..." : "Ajouter"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="modal-backdrop fade show" onClick={closeAdd} />
        </>
      )}

      {/* =================== MODAL SUPPRIMER =================== */}
      {deleteOpen && (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Supprimer des images</h5>
                  <button type="button" className="btn-close" onClick={closeDelete} disabled={deleteLoading} />
                </div>

                <div className="modal-body">
                  {deleteErrorMsg && (
                    <div className="alert alert-danger" style={{ whiteSpace: "pre-line" }}>
                      {deleteErrorMsg}
                    </div>
                  )}
                  {deleteSuccessMsg && <div className="alert alert-success">{deleteSuccessMsg}</div>}

                  {!images.length ? (
                    <div className="text-muted">Aucune image à supprimer.</div>
                  ) : (
                    <>
                      <div className="text-muted small mb-2">Sélectionne les images à supprimer.</div>

                      <div className="d-flex gap-2 flex-wrap">
                        {images.map((img, idx) => {
                          const encId = getEncryptedId(img);
                          const checked = encId ? selectedToDelete.has(encId) : false;

                          return (
                            <button
                              key={encId || idx}
                              type="button"
                              className={`border rounded p-2 text-start ${checked ? "border-danger" : ""}`}
                              style={{ width: 180, background: "white" }}
                              onClick={() => encId && toggleToDelete(encId)}
                              disabled={!encId || deleteLoading}
                            >
                              <div className="d-flex align-items-center justify-content-between">
                                <span className="small fw-semibold">Image {idx + 1}</span>
                                <input type="checkbox" checked={checked} readOnly />
                              </div>
                              <img
                                src={getUrl(img)}
                                alt={`img-${idx + 1}`}
                                className="rounded mt-2"
                                style={{ width: "100%", height: 110, objectFit: "cover" }}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeDelete} disabled={deleteLoading}>
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={deleteLoading || !selectedToDelete.size}
                    onClick={handleDeleteSubmit}
                  >
                    {deleteLoading ? "Suppression..." : `Supprimer (${selectedToDelete.size})`}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" onClick={closeDelete} />
        </>
      )}
    </>
  );
}

