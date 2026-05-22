import { useEffect, useMemo, useRef, useState } from "react";
import { productImagesApi } from "@/api/product_images";
import TranslatedFileInput from "../../../../Components/common/TranslatedFileInput";
import { useI18n } from "../../../../hooks/website/I18nContext";

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

function extractLaravelError(err, t) {
  const data = err?.response?.data;
  if (typeof data?.message === "string" && data.message.trim() && !data?.errors) return data.message;
  if (data?.errors && typeof data.errors === "object") {
    const messages = [];
    for (const key of Object.keys(data.errors)) {
      const arr = data.errors[key];
      if (Array.isArray(arr)) messages.push(...arr);
    }
    if (messages.length) return messages.join("\n");
  }
  if (typeof data?.message === "string" && data.message.trim()) return data.message;
  return t("products.images.errors.generic", "An error occurred. Check the image size/format and try again.");
}

export default function ProductInfo({ product, onRefresh }) {
  const { t } = useI18n();
  const inventoryStats = useMemo(() => {
    const inventories = Array.isArray(product?.inventories) ? product.inventories : [];
    return {
      totalStock: inventories.reduce((sum, inventory) => sum + Number(inventory?.quantity || 0), 0),
      reservedStock: inventories.reduce((sum, inventory) => sum + Number(inventory?.reserved_quantity || 0), 0),
      citiesCount: new Set(inventories.map((inventory) => inventory?.city_id).filter(Boolean)).size,
    };
  }, [product?.inventories]);

  const [localImages, setLocalImages] = useState(product?.images || []);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const fileInputRef = useRef(null);
  const addTimerRef = useRef(null);
  const deleteTimerRef = useRef(null);
  const [addItems, setAddItems] = useState([]);
  const [addLoading, setAddLoading] = useState(false);
  const [addErrorMsg, setAddErrorMsg] = useState("");
  const [selectedToDelete, setSelectedToDelete] = useState(new Set());
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState("");

  useEffect(() => setLocalImages(product?.images || []), [product]);
  const images = localImages || [];
  useEffect(() => setActiveIndex(0), [product?.id, images.length]);

  useEffect(() => {
    const anyOpen = addOpen || deleteOpen;
    document.body.classList.toggle("modal-open", anyOpen);
    document.body.style.overflow = anyOpen ? "hidden" : "";
    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
    };
  }, [addOpen, deleteOpen]);

  function clearAddAlerts() {
    setAddErrorMsg("");
    if (addTimerRef.current) clearTimeout(addTimerRef.current);
  }

  function clearDeleteAlerts() {
    setDeleteErrorMsg("");
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
  }

  function openAdd() {
    clearAddAlerts();
    setAddItems([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setAddOpen(true);
  }

  function openDelete() {
    clearDeleteAlerts();
    setSelectedToDelete(new Set());
    setDeleteOpen(true);
  }

  function closeAdd() {
    if (!addLoading) setAddOpen(false);
  }

  function closeDelete() {
    if (!deleteLoading) {
      setDeleteOpen(false);
      setSelectedToDelete(new Set());
    }
  }

  function handlePickFiles(event) {
    clearAddAlerts();
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setAddItems((prev) => {
      const prevKeys = new Set(prev.map((item) => `${item.file.name}-${item.file.size}`));
      const next = [...prev];
      for (const file of files) {
        const key = `${file.name}-${file.size}`;
        if (!prevKeys.has(key)) next.push({ id: makeId(), file });
      }
      return next;
    });
    event.target.value = "";
  }

  function removePicked(id) {
    clearAddAlerts();
    setAddItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleAddSubmit(event) {
    event.preventDefault();
    if (!product?.id || !addItems.length) return;
    clearAddAlerts();
    const formData = new FormData();
    formData.append("product_id", product.id);
    addItems.forEach(({ file }) => formData.append("images[]", file));
    try {
      setAddLoading(true);
      const res = await productImagesApi.create(formData);
      const returnedImages = res?.data?.data || [];
      if (Array.isArray(returnedImages) && returnedImages.length) setLocalImages((prev) => [...prev, ...returnedImages]);
      setAddItems([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onRefresh?.();
      setAddOpen(false);
    } catch (error) {
      setAddErrorMsg(extractLaravelError(error, t));
    } finally {
      setAddLoading(false);
    }
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
      setLocalImages((prev) => prev.filter((img) => {
        const enc = getEncryptedId(img);
        return enc ? !selectedToDelete.has(enc) : true;
      }));
      setActiveIndex((index) => {
        const nextLen = images.length - selectedToDelete.size;
        if (nextLen <= 0) return 0;
        return Math.min(index, nextLen - 1);
      });
      setSelectedToDelete(new Set());
      onRefresh?.();
      setDeleteOpen(false);
    } catch (error) {
      setDeleteErrorMsg(extractLaravelError(error, t));
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <div className="col-12 col-lg-5">
        <div className="card shadow-sm">
          <div className="card-header bg-white d-flex align-items-center justify-content-between">
            <div className="fw-semibold">{t("products.images.title", "Product images")}</div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary btn-sm" type="button" onClick={openAdd}><i className="bi bi-upload"></i> {t("products.images.addAction", "Add")}</button>
              <button className="btn btn-outline-danger btn-sm" type="button" disabled={!images.length} onClick={openDelete}><i className="bi bi-trash"></i> {t("products.images.deleteAction", "Delete")}</button>
            </div>
          </div>
          <div className="card-body">
            <div className="position-relative">
              <div className="carousel-inner rounded border bg-white">
                {(images.length ? images : [null]).map((img, idx) => (
                  <div className={`carousel-item ${idx === activeIndex ? "active" : ""}`} key={getEncryptedId(img) || idx}>
                    <img src={getUrl(img)} className="d-block w-100" alt={`${t("products.images.itemAlt", "Product image")} ${idx + 1}`} style={{ objectFit: "cover", maxHeight: "420px" }} />
                  </div>
                ))}
              </div>
              {images.length > 1 ? (
                <>
                  <button type="button" className="carousel-control-prev" onClick={() => setActiveIndex((i) => (i - 1 + images.length) % images.length)} style={{ position: "absolute", top: 0, bottom: 0 }}>
                    <span className="carousel-control-prev-icon" aria-hidden="true" />
                    <span className="visually-hidden">{t("products.images.previous", "Previous")}</span>
                  </button>
                  <button type="button" className="carousel-control-next" onClick={() => setActiveIndex((i) => (i + 1) % images.length)} style={{ position: "absolute", top: 0, bottom: 0 }}>
                    <span className="carousel-control-next-icon" aria-hidden="true" />
                    <span className="visually-hidden">{t("products.images.next", "Next")}</span>
                  </button>
                </>
              ) : null}
            </div>

            <div className="d-flex gap-2 mt-3 overflow-auto">
              {images.map((img, idx) => (
                <button key={getEncryptedId(img) || idx} type="button" className="p-0 border-0 bg-transparent" onClick={() => setActiveIndex(idx)} style={{ lineHeight: 0 }} title={`${t("products.images.view", "View image")} ${idx + 1}`}>
                  <img className={`rounded border ${idx === activeIndex ? "border-primary border-2" : ""}`} src={getUrl(img)} alt={`thumb${idx + 1}`} style={{ width: 90, height: 80, objectFit: "cover" }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="col-12 col-lg-7">
        <div className="card shadow-sm h-100">
          <div className="card-header bg-white d-flex align-items-center justify-content-between">
            <div className="fw-semibold">{t("products.summary.title", "Summary")}</div>
            <span className="badge text-bg-warning py-2">{t("products.summary.basePrice", "Base price")}: {product.price} MGA</span>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12 col-md-6"><label className="form-label text-muted small">{t("products.fields.name", "Product name")}</label><div className="form-control bg-light">{product.name}</div></div>
              <div className="col-12 col-md-3"><label className="form-label text-muted small">SKU</label><div className="form-control bg-light">{product.sku || "-"}</div></div>
              <div className="col-12 col-md-3"><label className="form-label text-muted small">{t("products.inventory.table.status", "Status")}</label><div className="form-control bg-light">{product.is_active ? t("products.status.active", "Active") : t("products.status.inactive", "Inactive")}</div></div>
              <div className="col-12 col-md-6"><label className="form-label text-muted small">{t("products.fields.category", "Category")}</label><div className="form-control bg-light">{product.category?.name || "-"}</div></div>
              <div className="col-12 col-md-6"><label className="form-label text-muted small">{t("products.summary.brand", "Brand")}</label><div className="form-control bg-light">{product.brand?.name || "-"}</div></div>
              <div className="col-12"><label className="form-label text-muted small">{t("products.fields.description", "Description")}</label><div className="form-control bg-light" style={{ minHeight: 110 }}>{product.description || "-"}</div></div>
            </div>
            <hr className="my-4" />
            <div className="row g-3">
              <div className="col-12 col-md-4"><div className="p-3 border rounded bg-white"><div className="text-muted small">{t("products.summary.totalStock", "Total stock")}</div><div className="fs-4 fw-semibold">{inventoryStats.totalStock}</div></div></div>
              <div className="col-12 col-md-4"><div className="p-3 border rounded bg-white"><div className="text-muted small">{t("products.summary.reservedStock", "Reserved")}</div><div className="fs-4 fw-semibold">{inventoryStats.reservedStock}</div></div></div>
              <div className="col-12 col-md-4"><div className="p-3 border rounded bg-white"><div className="text-muted small">{t("products.summary.citiesCount", "Linked cities")}</div><div className="fs-4 fw-semibold">{inventoryStats.citiesCount}</div></div></div>
            </div>
          </div>
        </div>
      </div>

      {addOpen ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <form className="modal-content" onSubmit={handleAddSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">{t("products.images.addTitle", "Add images")}</h5>
                  <button type="button" className="btn-close" onClick={closeAdd} disabled={addLoading} />
                </div>
                <div className="modal-body">
                  {addErrorMsg ? <div className="alert alert-danger" style={{ whiteSpace: "pre-line" }}>{addErrorMsg}</div> : null}
                  <div className="mb-3">
                    <label className="form-label">{t("products.images.files", "Files")}</label>
                    <TranslatedFileInput accept="image/*" multiple disabled={addLoading} selectedText={addItems.length ? addItems.map((item) => item.file.name).join(", ") : ""} onChange={handlePickFiles} />
                    <div className="form-text">{t("products.images.filesHelp", "Select multiple images. You can remove one before upload.")}</div>
                  </div>
                  {!!addItems.length ? (
                    <>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="small text-muted">{addItems.length} {t("products.images.selectedCount", "image(s) selected")}</div>
                        <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => { clearAddAlerts(); setAddItems([]); }} disabled={addLoading}>{t("products.images.clearAll", "Remove all")}</button>
                      </div>
                      <div className="d-flex gap-2 flex-wrap">
                        {addItems.map(({ id, file }) => (
                          <div key={id} className="border rounded p-2 position-relative">
                            <button type="button" className="btn btn-sm btn-danger position-absolute" style={{ top: 6, right: 6 }} onClick={() => removePicked(id)} title={t("products.actions.remove", "Remove")} disabled={addLoading}><i className="bi bi-x-lg"></i></button>
                            <div className="small text-muted text-truncate" style={{ maxWidth: 160 }}>{file.name}</div>
                            <img src={URL.createObjectURL(file)} alt={file.name} style={{ width: 160, height: 120, objectFit: "cover" }} className="rounded mt-2" onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)} />
                          </div>
                        ))}
                      </div>
                    </>
                  ) : <div className="text-muted small">{t("products.images.noneSelected", "No image selected.")}</div>}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeAdd} disabled={addLoading}>{t("common.cancel", "Cancel")}</button>
                  <button type="submit" className="btn btn-primary" disabled={addLoading || !addItems.length}>{addLoading ? t("products.images.uploading", "Uploading...") : t("products.images.addAction", "Add")}</button>
                </div>
              </form>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={closeAdd} />
        </>
      ) : null}

      {deleteOpen ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{t("products.images.deleteTitle", "Delete images")}</h5>
                  <button type="button" className="btn-close" onClick={closeDelete} disabled={deleteLoading} />
                </div>
                <div className="modal-body">
                  {deleteErrorMsg ? <div className="alert alert-danger" style={{ whiteSpace: "pre-line" }}>{deleteErrorMsg}</div> : null}
                  {!images.length ? <div className="text-muted">{t("products.images.noneToDelete", "No image to delete.")}</div> : (
                    <>
                      <div className="text-muted small mb-2">{t("products.images.selectToDelete", "Select images to delete.")}</div>
                      <div className="d-flex gap-2 flex-wrap">
                        {images.map((img, idx) => {
                          const encId = getEncryptedId(img);
                          const checked = encId ? selectedToDelete.has(encId) : false;
                          return (
                            <button key={encId || idx} type="button" className={`border rounded p-2 text-start ${checked ? "border-danger" : ""}`} style={{ width: 180, background: "white" }} onClick={() => encId && toggleToDelete(encId)} disabled={!encId || deleteLoading}>
                              <div className="d-flex align-items-center justify-content-between">
                                <span className="small fw-semibold">{t("products.images.itemAlt", "Product image")} {idx + 1}</span>
                                <input type="checkbox" checked={checked} readOnly />
                              </div>
                              <img src={getUrl(img)} alt={`img-${idx + 1}`} className="rounded mt-2" style={{ width: "100%", height: 110, objectFit: "cover" }} />
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeDelete} disabled={deleteLoading}>{t("common.cancel", "Cancel")}</button>
                  <button type="button" className="btn btn-danger" disabled={deleteLoading || !selectedToDelete.size} onClick={handleDeleteSubmit}>{deleteLoading ? t("products.images.deleting", "Deleting...") : `${t("products.images.deleteAction", "Delete")} (${selectedToDelete.size})`}</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={closeDelete} />
        </>
      ) : null}
    </>
  );
}
