import React, { useEffect, useMemo, useRef, useState } from "react";
import { couponsApi } from "../../../api/coupons";
import { useI18n } from "../../../hooks/website/I18nContext";

import $ from "jquery";
import "datatables.net";
import "datatables.net-bs5";

function formatDateTimeInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}

function formatDateTimeDisplay(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("fr-FR");
}

function formatMoney(value) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function CouponsPage() {
  const { lang, t } = useI18n();
  const DT_LANG_URL = useMemo(() => `/lang/datatables/${lang}.json`, [lang]);

  const [items, setItems] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showOpen, setShowOpen] = useState(false);
  const [showing, setShowing] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });

  const [form, setForm] = useState({
    code: "",
    value: "",
    type: "fixed",
    min_subtotal: "",
    starts_at: "",
    ends_at: "",
    usage_limit: "",
    is_active: true,
  });

  const tableRef = useRef(null);
  const dtRef = useRef(null);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  function showToast(type, message) {
    setToast({ open: true, type, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      setToast((current) => ({ ...current, open: false }));
    }, 3500);
  }

  const getRowId = (row) => row?.encrypted_id ?? row?.id;

  async function load({ mode = "refresh" } = {}) {
    if (mode === "initial") setInitialLoading(true);
    else setRefreshing(true);

    try {
      const rows = await couponsApi.list();
      setItems(Array.isArray(rows) ? rows : []);
    } finally {
      if (mode === "initial") setInitialLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load({ mode: "initial" });
  }, []);

  function resetForm() {
    setForm({
      code: "",
      value: "",
      type: "fixed",
      min_subtotal: "",
      starts_at: "",
      ends_at: "",
      usage_limit: "",
      is_active: true,
    });
    setErrors({});
    setGlobalError("");
  }

  function openCreate() {
    setEditing(null);
    resetForm();
    setOpen(true);
  }

  function openEdit(coupon) {
    setEditing(coupon);
    setForm({
      code: coupon?.code ?? "",
      value: coupon?.value ?? "",
      type: coupon?.type ?? "fixed",
      min_subtotal: coupon?.min_subtotal ?? "",
      starts_at: formatDateTimeInput(coupon?.starts_at),
      ends_at: formatDateTimeInput(coupon?.ends_at),
      usage_limit: coupon?.usage_limit ?? "",
      is_active: !!coupon?.is_active,
    });
    setErrors({});
    setGlobalError("");
    setOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setOpen(false);
    setEditing(null);
  }

  async function openShow(coupon) {
    setShowOpen(true);
    setShowing(coupon);
    setLoadingDetails(true);

    try {
      const details = await couponsApi.show(getRowId(coupon));
      setShowing(details);
    } catch {
      showToast("danger", t("coupons.toast.detailsFailed", "Impossible de charger les détails."));
    } finally {
      setLoadingDetails(false);
    }
  }

  function closeShow() {
    setShowOpen(false);
    setShowing(null);
  }

  function onDeleteAsk(coupon) {
    setDeleteTarget(coupon);
    setDeleteOpen(true);
  }

  function closeDeleteModal() {
    if (deleting) return;
    setDeleteOpen(false);
    setDeleteTarget(null);
  }

  useEffect(() => {
    if (initialLoading) return;
    if (!tableRef.current) return;

    const $table = $(tableRef.current);

    if (dtRef.current) {
      try {
        $table.off("click", ".js-show");
        $table.off("click", ".js-edit");
        $table.off("click", ".js-del");
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
        { data: "code", defaultContent: "" },
        {
          data: "type",
          width: 120,
          render: (value) =>
            value === "percent"
              ? `<span class="badge text-bg-info">Pourcentage</span>`
              : `<span class="badge text-bg-dark">Fixe</span>`,
        },
        {
          data: "value",
          width: 120,
          render: (value, tt, row) =>
            row?.type === "percent" ? `${formatMoney(value)} %` : `${formatMoney(value)} DA`,
        },
        {
          data: "min_subtotal",
          width: 140,
          render: (value) => `${formatMoney(value)} DA`,
        },
        {
          data: null,
          width: 220,
          render: (d, tt, row) => {
            const start = formatDateTimeDisplay(row?.starts_at);
            const end = formatDateTimeDisplay(row?.ends_at);
            return `
              <div class="small">
                <div><span class="text-muted">Début:</span> ${start}</div>
                <div><span class="text-muted">Fin:</span> ${end}</div>
              </div>
            `;
          },
        },
        {
          data: "usage_limit",
          width: 120,
          render: (value) => (value ? value : `<span class="text-muted small">Illimité</span>`),
        },
        {
          data: "is_active",
          width: 120,
          render: (value) =>
            value
              ? `<span class="badge text-bg-success">Actif</span>`
              : `<span class="badge text-bg-secondary">Inactif</span>`,
        },
        {
          data: null,
          orderable: false,
          className: "text-end",
          width: 180,
          render: (d, tt, row) => {
            const id = getRowId(row);
            return `
              <button class="btn btn-sm btn-outline-primary me-2 js-show" data-id="${id}">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-sm btn-outline-dark me-2 js-edit" data-id="${id}">
                <i class="bi bi-pencil-square"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger js-del" data-id="${id}">
                <i class="bi bi-trash3"></i>
              </button>
            `;
          },
        },
      ],
    });

    $table.on("click", ".js-show", (e) => {
      const id = $(e.currentTarget).data("id");
      const coupon = itemsRef.current.find((x) => String(getRowId(x)) === String(id));
      if (coupon) openShow(coupon);
    });

    $table.on("click", ".js-edit", (e) => {
      const id = $(e.currentTarget).data("id");
      const coupon = itemsRef.current.find((x) => String(getRowId(x)) === String(id));
      if (coupon) openEdit(coupon);
    });

    $table.on("click", ".js-del", (e) => {
      const id = $(e.currentTarget).data("id");
      const coupon = itemsRef.current.find((x) => String(getRowId(x)) === String(id));
      if (coupon) onDeleteAsk(coupon);
    });

    return () => {
      try {
        $table.off("click", ".js-show");
        $table.off("click", ".js-edit");
        $table.off("click", ".js-del");
      } catch {}
      dtRef.current?.destroy();
      dtRef.current = null;
    };
  }, [initialLoading, DT_LANG_URL]);

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

  async function onSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGlobalError("");

    const payload = {
      code: String(form.code || "").trim(),
      value: form.value === "" ? "" : Number(form.value),
      type: form.type,
      min_subtotal: form.min_subtotal === "" ? null : Number(form.min_subtotal),
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      usage_limit: form.usage_limit === "" ? null : Number(form.usage_limit),
      is_active: !!form.is_active,
    };

    setSaving(true);
    try {
      if (editing) {
        await couponsApi.update(getRowId(editing), payload);
        showToast("success", t("coupons.toast.updated", "Coupon mis à jour."));
      } else {
        await couponsApi.create(payload);
        showToast("success", t("coupons.toast.created", "Coupon créé."));
      }

      await load({ mode: "refresh" });
      setOpen(false);
      setEditing(null);
    } catch (e2) {
      const data = e2?.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setGlobalError(data?.message || t("coupons.toast.saveFailed", "Échec de l'enregistrement."));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    try {
      await couponsApi.remove(getRowId(deleteTarget));
      await load({ mode: "refresh" });
      setDeleteOpen(false);
      setDeleteTarget(null);
      showToast("success", t("coupons.toast.deleted", "Coupon supprimé."));
    } catch (e) {
      const message = e?.response?.data?.message || t("coupons.toast.deleteFailed", "Échec de la suppression.");
      showToast("danger", message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h4 className="mb-1">{t("coupons.title", "Coupons")}</h4>
          <div className="text-muted small">{t("coupons.subtitle", "Gérez les coupons de réduction")}</div>
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
                {t("coupons.refreshing", "Actualisation...")}
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-2" />
                {t("coupons.refresh", "Actualiser")}
              </>
            )}
          </button>

          <button className="btn btn-warning" onClick={openCreate} disabled={initialLoading}>
            <i className="bi bi-plus-lg me-2" />
            {t("coupons.new", "Nouveau coupon")}
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {initialLoading ? (
            <div className="d-flex align-items-center gap-2 text-muted mb-3">
              <div className="spinner-border spinner-border-sm" />
              {t("coupons.loading", "Chargement...")}
            </div>
          ) : null}

          <div className="table-responsive">
            <table ref={tableRef} className="table align-middle mb-0">
              <thead>
                <tr className="text-muted small">
                  <th>{t("coupons.table.code", "Code")}</th>
                  <th style={{ width: 120 }}>{t("coupons.table.type", "Type")}</th>
                  <th style={{ width: 120 }}>{t("coupons.table.value", "Valeur")}</th>
                  <th style={{ width: 140 }}>{t("coupons.table.minSubtotal", "Minimum")}</th>
                  <th style={{ width: 220 }}>{t("coupons.table.validity", "Validité")}</th>
                  <th style={{ width: 120 }}>{t("coupons.table.usageLimit", "Limite")}</th>
                  <th style={{ width: 120 }}>{t("coupons.table.status", "Statut")}</th>
                  <th style={{ width: 180 }} className="text-end">
                    {t("coupons.table.actions", "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody />
            </table>
          </div>
        </div>
      </div>

      {open && (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editing ? t("coupons.modal.editTitle", "Modifier le coupon") : t("coupons.modal.createTitle", "Créer un coupon")}
                  </h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>

                <form onSubmit={onSubmit}>
                  <div className="modal-body">
                    {globalError && <div className="alert alert-danger py-2">{globalError}</div>}

                    <div className="mb-3">
                      <label className="form-label">{t("coupons.form.code", "Code")}</label>
                      <input
                        className={`form-control ${errors.code ? "is-invalid" : ""}`}
                        value={form.code}
                        onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                        placeholder="PROMO10"
                        autoFocus
                      />
                      {errors.code && <span className="text-danger small">{errors.code[0]}</span>}
                    </div>

                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label">{t("coupons.form.type", "Type")}</label>
                        <select
                          className={`form-select ${errors.type ? "is-invalid" : ""}`}
                          value={form.type}
                          onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                        >
                          <option value="fixed">{t("coupons.type.fixed", "Montant fixe")}</option>
                          <option value="percent">{t("coupons.type.percent", "Pourcentage")}</option>
                        </select>
                        {errors.type && <span className="text-danger small">{errors.type[0]}</span>}
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">{t("coupons.form.value", "Valeur")}</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className={`form-control ${errors.value ? "is-invalid" : ""}`}
                          value={form.value}
                          onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                        />
                        {errors.value && <span className="text-danger small">{errors.value[0]}</span>}
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">{t("coupons.form.minSubtotal", "Sous-total minimum")}</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className={`form-control ${errors.min_subtotal ? "is-invalid" : ""}`}
                          value={form.min_subtotal}
                          onChange={(e) => setForm((p) => ({ ...p, min_subtotal: e.target.value }))}
                        />
                        {errors.min_subtotal && <span className="text-danger small">{errors.min_subtotal[0]}</span>}
                      </div>
                    </div>

                    <div className="row g-3 mt-1">
                      <div className="col-md-6">
                        <label className="form-label">{t("coupons.form.startsAt", "Début de validité")}</label>
                        <input
                          type="datetime-local"
                          className={`form-control ${errors.starts_at ? "is-invalid" : ""}`}
                          value={form.starts_at}
                          onChange={(e) => setForm((p) => ({ ...p, starts_at: e.target.value }))}
                        />
                        {errors.starts_at && <span className="text-danger small">{errors.starts_at[0]}</span>}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">{t("coupons.form.endsAt", "Fin de validité")}</label>
                        <input
                          type="datetime-local"
                          className={`form-control ${errors.ends_at ? "is-invalid" : ""}`}
                          value={form.ends_at}
                          onChange={(e) => setForm((p) => ({ ...p, ends_at: e.target.value }))}
                        />
                        {errors.ends_at && <span className="text-danger small">{errors.ends_at[0]}</span>}
                      </div>
                    </div>

                    <div className="row g-3 mt-1">
                      <div className="col-md-6">
                        <label className="form-label">{t("coupons.form.usageLimit", "Limite d'utilisation")}</label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          className={`form-control ${errors.usage_limit ? "is-invalid" : ""}`}
                          value={form.usage_limit}
                          onChange={(e) => setForm((p) => ({ ...p, usage_limit: e.target.value }))}
                          placeholder={t("coupons.form.unlimited", "Laisser vide pour illimité")}
                        />
                        {errors.usage_limit && <span className="text-danger small">{errors.usage_limit[0]}</span>}
                      </div>

                      <div className="col-md-6 d-flex align-items-end">
                        <div className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="coupon-active"
                            checked={!!form.is_active}
                            onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                          />
                          <label className="form-check-label" htmlFor="coupon-active">
                            {t("coupons.form.active", "Coupon actif")}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={saving}>
                      {t("coupons.modal.cancel", "Annuler")}
                    </button>
                    <button className="btn btn-warning" disabled={saving}>
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          {t("coupons.modal.saving", "Enregistrement...")}
                        </>
                      ) : (
                        t("coupons.modal.save", "Enregistrer")
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" onClick={closeModal} />
        </>
      )}

      {showOpen && (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">{t("coupons.show.title", "Détails du coupon")}</h5>
                  <button type="button" className="btn-close" onClick={closeShow} />
                </div>

                <div className="modal-body">
                  {loadingDetails ? (
                    <div className="d-flex align-items-center gap-2 text-muted">
                      <div className="spinner-border spinner-border-sm" />
                      {t("coupons.show.loading", "Chargement des détails...")}
                    </div>
                  ) : showing ? (
                    <>
                      <div className="mb-2">
                        <div className="text-muted small">{t("coupons.table.code", "Code")}</div>
                        <div className="fw-semibold">{showing.code || "—"}</div>
                      </div>
                      <div className="mb-2">
                        <div className="text-muted small">{t("coupons.table.type", "Type")}</div>
                        <div>{showing.type === "percent" ? "Pourcentage" : "Montant fixe"}</div>
                      </div>
                      <div className="mb-2">
                        <div className="text-muted small">{t("coupons.table.value", "Valeur")}</div>
                        <div>{showing.type === "percent" ? `${formatMoney(showing.value)} %` : `${formatMoney(showing.value)} DA`}</div>
                      </div>
                      <div className="mb-2">
                        <div className="text-muted small">{t("coupons.table.minSubtotal", "Sous-total minimum")}</div>
                        <div>{formatMoney(showing.min_subtotal)} DA</div>
                      </div>
                      <div className="mb-2">
                        <div className="text-muted small">{t("coupons.table.validity", "Validité")}</div>
                        <div>Début: {formatDateTimeDisplay(showing.starts_at)}</div>
                        <div>Fin: {formatDateTimeDisplay(showing.ends_at)}</div>
                      </div>
                      <div className="mb-2">
                        <div className="text-muted small">{t("coupons.table.usageLimit", "Limite d'utilisation")}</div>
                        <div>{showing.usage_limit ?? "Illimité"}</div>
                      </div>
                      <div className="mb-2">
                        <div className="text-muted small">{t("coupons.show.usedCount", "Nombre d'utilisations")}</div>
                        <div>{showing.used_count ?? 0}</div>
                      </div>
                      <div>
                        <div className="text-muted small">{t("coupons.table.status", "Statut")}</div>
                        <div>
                          {showing.is_active ? (
                            <span className="badge text-bg-success">Actif</span>
                          ) : (
                            <span className="badge text-bg-secondary">Inactif</span>
                          )}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={closeShow}>
                    {t("coupons.show.close", "Fermer")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" onClick={closeShow} />
        </>
      )}

      {deleteOpen && (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">{t("coupons.delete.title", "Confirmation")}</h5>
                  <button type="button" className="btn-close" onClick={closeDeleteModal} />
                </div>

                <div className="modal-body">
                  {deleteTarget ? (
                    <p className="mb-0">
                      {t("coupons.delete.message", "Supprimer le coupon")} <b>{deleteTarget.code}</b> ?
                    </p>
                  ) : (
                    <p className="mb-0">{t("coupons.delete.message2", "Supprimer ce coupon ?")}</p>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeDeleteModal} disabled={deleting}>
                    {t("coupons.modal.cancel", "Annuler")}
                  </button>
                  <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                    {deleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        {t("coupons.delete.deleting", "Suppression...")}
                      </>
                    ) : (
                      t("coupons.delete.btn", "Supprimer")
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" onClick={closeDeleteModal} />
        </>
      )}

      {toast.open && (
        <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div className={`toast show text-bg-${toast.type} border-0`}>
            <div className="d-flex">
              <div className="toast-body">{toast.message}</div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setToast((current) => ({ ...current, open: false }))}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
