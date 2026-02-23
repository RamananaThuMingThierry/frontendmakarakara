import React, { useEffect, useMemo, useRef, useState } from "react";
import { slidesApi } from "../../../api/slides";
import { useI18n } from "../../../hooks/website/I18nContext";

import $ from "jquery";
import "datatables.net";
import "datatables.net-bs5";

import SlideFormModal from "./components/SlideFormModal";

export default function SlidesPage() {
  const { lang, t } = useI18n();

  const DT_LANG_URL = useMemo(() => `/lang/datatables/${lang}.json`, [lang]);

  const [items, setItems] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });

  function showToast(type, message) {
    setToast({ open: true, type, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast((x) => ({ ...x, open: false })), 3500);
  }

  // Modal create/edit
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const tableRef = useRef(null);
  const dtRef = useRef(null);

  // items ref (pour handlers jquery)
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const getRowId = (row) => row?.encrypted_id ?? row?.id;

  const imageUrl = (val) => {
    if (!val) return "";
    const s = String(val).trim();
    if (s.startsWith("http")) return s;
    if (s.startsWith("/")) return s;
    return `/${s}`;
  };

  async function load({ mode = "refresh" } = {}) {
    if (mode === "initial") setInitialLoading(true);
    else setRefreshing(true);

    try {
      const res = await slidesApi.list(); // ton list renvoie l’objet pagination ou data
      // ✅ normalise: tableau
      const rows = Array.isArray(res) ? res : (res?.data ?? []);
      const sorted = [...rows].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      setItems(sorted);
    } finally {
      if (mode === "initial") setInitialLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load({ mode: "initial" });
  }, []);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(slide) {
    setEditing(slide);
    setOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setOpen(false);
    setEditing(null);
  }

  function onDeleteAsk(slide) {
    setDeleteTarget(slide);
    setDeleteOpen(true);
  }

  function closeDeleteModal() {
    if (deleting) return;
    setDeleteOpen(false);
    setDeleteTarget(null);
  }

  // ✅ Move up/down
  async function moveById(id, direction) {
    const list = itemsRef.current;
    const idx = list.findIndex((x) => String(getRowId(x)) === String(id));
    if (idx < 0) return;

    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= list.length) return;

    const a = list[idx];
    const b = list[swapWith];

    const posA = a.position ?? 0;
    const posB = b.position ?? 0;

    // ✅ optimistic
    const next = [...list];
    next[idx] = { ...a, position: posB };
    next[swapWith] = { ...b, position: posA };
    next.sort((x, y) => (x.position ?? 0) - (y.position ?? 0));
    setItems(next);

    try {
      // ⚠️ si ton backend update est POST /slides/{id}, garde update() comme tu as.
      // Si ton backend est PUT/PATCH, adapte slidesApi.update.
      await slidesApi.update(getRowId(a), { position: posB });
      await slidesApi.update(getRowId(b), { position: posA });
      await load({ mode: "refresh" });
      showToast("success", t("slides.toast.updated", "Updated."));
    } catch (e) {
      await load({ mode: "refresh" }); // rollback sync
      showToast("danger", e?.response?.data?.message || t("slides.errors.save", "Save failed."));
    }
  }

  // ✅ (Re)Init DataTable quand la langue change
  useEffect(() => {
    if (initialLoading) return;
    if (!tableRef.current) return;

    const $table = $(tableRef.current);

    // destroy si existe
    if (dtRef.current) {
      try {
        $table.off("click", ".js-edit");
        $table.off("click", ".js-del");
        $table.off("click", ".js-up");
        $table.off("click", ".js-down");
      } catch {}
      dtRef.current.destroy(true);
      dtRef.current = null;
      $table.find("tbody").empty();
    }

    dtRef.current = $table.DataTable({
      data: [],
      pageLength: 10,
      lengthMenu: [10, 15, 25, 50, 100],
      ordering: true,
      searching: true,
      responsive: true,
      language: { url: DT_LANG_URL },
      columns: [
        {
          data: "image_url",
          orderable: false,
          width: 90,
          render: (v) => {
            const src = imageUrl(v);
            if (!src) return `<span class="text-muted small">—</span>`;
            return `
              <img src="${src}" alt="slide"
                style="width:72px;height:44px;object-fit:cover;border-radius:8px;border:1px solid rgba(0,0,0,.08)" />
            `;
          },
        },
        {
          data: "title",
          defaultContent: "",
          render: (v) => (v ? `${String(v).replace(/</g, "&lt;").replace(/>/g, "&gt;")}` : `<span class="text-muted">—</span>`),
        },
        {
          data: "position",
          width: 180,
          render: (v, tt, row) => {
            const id = getRowId(row);
            const badge = `<span class="badge text-bg-light border">${v ?? 0}</span>`;

            // ✅ pas de btn-group : 2 boutons séparés
            return `
              <div class="d-flex align-items-center gap-2">
                ${badge}
                <button class="btn btn-sm btn-outline-secondary js-up" data-id="${id}" title="${t("slides.buttons.moveUp", "Up")}">
                  <i class="bi bi-arrow-up"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary js-down" data-id="${id}" title="${t("slides.buttons.moveDown", "Down")}">
                  <i class="bi bi-arrow-down"></i>
                </button>
              </div>
            `;
          },
        },
        {
          data: "is_active",
          width: 140,
          render: (v) =>
            v
              ? `<span class="badge text-bg-success"><i class="bi bi-check-circle me-1"></i>${t("slides.status.active", "Active")}</span>`
              : `<span class="badge text-bg-secondary"><i class="bi bi-x-circle me-1"></i>${t("slides.status.inactive", "Inactive")}</span>`,
        },
        {
          data: null,
          orderable: false,
          className: "text-end",
          width: 140,
          render: (d, tt, row) => {
            const id = getRowId(row);
            return `
              <button class="btn btn-sm btn-outline-dark me-2 js-edit" data-id="${id}" title="${t("slides.buttons.edit", "Edit")}">
                <i class="bi bi-pencil-square"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger js-del" data-id="${id}" title="${t("slides.buttons.delete", "Delete")}">
                <i class="bi bi-trash3"></i>
              </button>
            `;
          },
        },
      ],
    });

    // handlers (edit/delete/up/down)
    $table.on("click", ".js-edit", (e) => {
      const id = $(e.currentTarget).data("id");
      const slide = itemsRef.current.find((x) => String(getRowId(x)) === String(id));
      if (slide) openEdit(slide);
    });

    $table.on("click", ".js-del", (e) => {
      const id = $(e.currentTarget).data("id");
      const slide = itemsRef.current.find((x) => String(getRowId(x)) === String(id));
      if (slide) onDeleteAsk(slide);
    });

    $table.on("click", ".js-up", (e) => {
      const id = $(e.currentTarget).data("id");
      moveById(id, "up");
    });

    $table.on("click", ".js-down", (e) => {
      const id = $(e.currentTarget).data("id");
      moveById(id, "down");
    });

    return () => {
      try {
        $table.off("click", ".js-edit");
        $table.off("click", ".js-del");
        $table.off("click", ".js-up");
        $table.off("click", ".js-down");
      } catch {}
      dtRef.current?.destroy();
      dtRef.current = null;
    };
  }, [initialLoading, DT_LANG_URL, t]);

  // ✅ Update rows quand items change
  useEffect(() => {
    if (!dtRef.current) return;
    const dt = dtRef.current;

    const page = dt.page();
    const search = dt.search();
    const order = dt.order();

    dt.clear();
    dt.rows.add(items);
    dt.draw(false);

    dt.order(order).draw(false);
    dt.search(search).draw(false);
    dt.page(page).draw(false);
  }, [items]);

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    try {
      await slidesApi.remove(getRowId(deleteTarget));
      await load({ mode: "refresh" });

      setDeleteOpen(false);
      setDeleteTarget(null);
      showToast("success", t("slides.toast.deleted", "Deleted."));
    } catch (e) {
      const msg = e?.response?.data?.message || t("slides.errors.delete", "Delete failed.");
      showToast("danger", msg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h4 className="mb-1">{t("slides.title", "Slides")}</h4>
          <div className="text-muted small">{t("slides.subtitle", "Manage slider images")}</div>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={() => load({ mode: "refresh" })}
            disabled={initialLoading || refreshing}
          >
            {initialLoading || refreshing ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                {t("slides.refreshing", "Refreshing...")}
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-2" />
                {t("slides.refresh", "Refresh")}
              </>
            )}
          </button>

          <button className="btn btn-warning" onClick={openCreate} disabled={initialLoading}>
            <i className="bi bi-plus-lg me-2" />
            {t("slides.buttons.new", "New slide")}
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {initialLoading ? (
            <div className="d-flex align-items-center gap-2 text-muted mb-3">
              <div className="spinner-border spinner-border-sm" />
              {t("slides.loading", "Loading...")}
            </div>
          ) : null}

          <div className="table-responsive">
            <table ref={tableRef} className="table align-middle mb-0">
              <thead>
                <tr className="text-muted small">
                  <th style={{ width: 90 }}>{t("slides.table.image", "Image")}</th>
                  <th>{t("slides.table.title", "Title")}</th>
                  <th style={{ width: 180 }}>{t("slides.table.position", "Position")}</th>
                  <th style={{ width: 140 }}>{t("slides.table.status", "Status")}</th>
                  <th style={{ width: 140 }} className="text-end">
                    {t("slides.table.actions", "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody />
            </table>
          </div>
        </div>
      </div>

      {/* Modal create/edit: tu peux garder ton SlideFormModal existant */}
      <SlideFormModal
        open={open}
        initial={editing}
        loading={saving}
        onClose={closeModal}
        onSubmit={async (payload) => {
          setSaving(true);
          try {
            if (editing?.encrypted_id) {
              await slidesApi.update(editing.encrypted_id, payload);
              showToast("success", t("slides.toast.updated", "Updated."));
            } else {
              await slidesApi.create(payload);
              showToast("success", t("slides.toast.created", "Created."));
            }
            setOpen(false);
            setEditing(null);
            await load({ mode: "refresh" });
          } catch (e) {
            // SlideFormModal va afficher errors si tu l’as implémenté
            throw e;
          } finally {
            setSaving(false);
          }
        }}
      />

      {/* Modal delete */}
      {deleteOpen && (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">{t("slides.delete.title", "Confirm")}</h5>
                  <button type="button" className="btn-close" onClick={closeDeleteModal} />
                </div>

                <div className="modal-body">
                  <p className="mb-0">{t("slides.delete.message", "Do you really want to delete this slide?")}</p>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeDeleteModal} disabled={deleting}>
                    {t("slides.modal.cancel", "Cancel")}
                  </button>

                  <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                    {deleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        {t("slides.delete.deleting", "Deleting...")}
                      </>
                    ) : (
                      t("slides.delete.btn", "Delete")
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" onClick={closeDeleteModal} />
        </>
      )}

      {/* Toast */}
      {toast.open && (
        <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div className={`toast show text-bg-${toast.type} border-0`}>
            <div className="d-flex">
              <div className="toast-body">{toast.message}</div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setToast((x) => ({ ...x, open: false }))}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
