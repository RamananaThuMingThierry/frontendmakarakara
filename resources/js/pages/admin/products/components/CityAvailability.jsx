import React, { useMemo, useState } from "react";
import { productsApi } from "@/api/products";
import { useI18n } from "../../../../hooks/website/I18nContext";

const CURRENCIES = [
  { value: "MGA", label: "Ar" },
  { value: "EUR", label: "EURO" },
  { value: "USD", label: "USD" },
];

export default function CityAvailability({ product, reload, allCities = [] }) {
  const { lang, t } = useI18n();
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("create");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    city_id: "",
    price: "",
    currency: "MGA",
    note: "",
    is_available: true,
  });

  const availableCities = useMemo(() => {
    const existingIds = new Set((product.cities ?? []).map((city) => city.id));
    return allCities.filter((city) => !existingIds.has(city.id));
  }, [allCities, product.cities]);

  function openCreate() {
    setMode("create");
    setForm({
      city_id: availableCities[0]?.id ?? "",
      price: "",
      currency: "MGA",
      note: "",
      is_available: true,
    });
    setShowModal(true);
  }

  function openEdit(city) {
    setMode("edit");
    setForm({
      city_id: city.id,
      price: city.pivot?.price ?? "",
      currency: city.pivot?.currency ?? "MGA",
      note: city.pivot?.note ?? "",
      is_available: !!city.pivot?.is_available,
    });
    setShowModal(true);
  }

  function closeModal() {
    if (!saving) setShowModal(false);
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (!form.city_id) return;

    setSaving(true);
    try {
      const payload = {
        price: Number(form.price),
        currency: form.currency,
        note: form.note?.trim() || null,
        is_available: !!form.is_available,
      };

      if (mode === "create") {
        await productsApi.setCityPrice(product.encrypted_id, form.city_id, payload);
      } else {
        await productsApi.updateCityPrice(product.encrypted_id, form.city_id, payload);
      }

      await reload();
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  }

  async function removeCity(cityId) {
    if (!window.confirm(t("products.cityPricing.deleteConfirm", "Remove this city from the product?"))) return;
    await productsApi.deleteCityPrice(product.encrypted_id, cityId);
    reload();
  }

  function formatPrice(value) {
    if (value === null || value === undefined || value === "") return "-";
    return new Intl.NumberFormat(lang === "en" ? "en-US" : lang).format(Number(value));
  }

  function currencyLabel(code) {
    return CURRENCIES.find((currency) => currency.value === code)?.label ?? code ?? "-";
  }

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h6 className="mb-0">{t("products.cityPricing.title", "Prices by city")}</h6>
          <button type="button" className="btn btn-sm btn-primary" onClick={openCreate}>
            <i className="bi bi-plus-circle me-1"></i>
            {t("products.cityPricing.definePrice", "Set a price")}
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th>{t("products.inventory.table.city", "City")}</th>
                <th className="text-end">{t("products.inventory.table.price", "Price")}</th>
                <th>{t("products.cityPricing.currency", "Currency")}</th>
                <th className="text-end">{t("products.inventory.table.actions", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {(product.cities ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted py-3">
                    {t("products.cityPricing.empty", "No city configured.")}
                  </td>
                </tr>
              ) : (
                product.cities?.map((city) => (
                  <tr key={city.id}>
                    <td>{city.name}</td>
                    <td className="text-end">{formatPrice(city.pivot?.price)}</td>
                    <td>{currencyLabel(city.pivot?.currency)}</td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm" role="group">
                        <button type="button" className="btn btn-outline-secondary" onClick={() => openEdit(city)}>
                          <i className="bi bi-pencil-square me-1"></i>
                          {t("products.actions.edit", "Edit")}
                        </button>
                        <button type="button" className="btn btn-outline-danger" onClick={() => removeCity(city.id)}>
                          <i className="bi bi-trash me-1"></i>
                          {t("products.images.deleteAction", "Delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1" role="dialog">
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <form onSubmit={onSubmit}>
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {mode === "create" ? t("products.cityPricing.definePrice", "Set a price") : t("products.cityPricing.editPrice", "Edit price")}
                    </h5>
                    <button type="button" className="btn-close" onClick={closeModal} aria-label="Close" />
                  </div>

                  <div className="modal-body">
                    <div className="mb-2">
                      <label className="form-label">{t("products.inventory.table.city", "City")}</label>
                      {mode === "create" ? (
                        <select className="form-select" value={form.city_id} onChange={(event) => setForm((prev) => ({ ...prev, city_id: event.target.value }))} required>
                          {availableCities.length === 0 ? (
                            <option value="">{t("products.cityPricing.allAdded", "All cities have already been added")}</option>
                          ) : (
                            availableCities.map((city) => (
                              <option key={city.id} value={city.id}>
                                {city.name}
                              </option>
                            ))
                          )}
                        </select>
                      ) : (
                        <input className="form-control" value={product.cities?.find((city) => city.id === form.city_id)?.name ?? ""} disabled />
                      )}
                    </div>

                    <div className="row g-2">
                      <div className="col-7">
                        <label className="form-label">{t("products.inventory.table.price", "Price")}</label>
                        <input type="number" className="form-control" value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))} min="0" step="0.01" required />
                      </div>
                      <div className="col-5">
                        <label className="form-label">{t("products.cityPricing.currency", "Currency")}</label>
                        <select className="form-select" value={form.currency} onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value }))}>
                          {CURRENCIES.map((currency) => (
                            <option key={currency.value} value={currency.value}>
                              {currency.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-2">
                      <label className="form-label">{t("products.inventory.meta.note", "Note")} ({t("products.cityPricing.optional", "optional")})</label>
                      <textarea className="form-control" rows={2} value={form.note} onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))} placeholder={t("products.cityPricing.notePlaceholder", "Ex: promo price, conditions, etc.")} />
                    </div>

                    <div className="form-check mt-2">
                      <input className="form-check-input" type="checkbox" id="is_available" checked={form.is_available} onChange={(event) => setForm((prev) => ({ ...prev, is_available: event.target.checked }))} />
                      <label className="form-check-label" htmlFor="is_available">
                        {t("products.inventory.table.available", "Available")}
                      </label>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-light" onClick={closeModal} disabled={saving}>
                      {t("common.cancel", "Cancel")}
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving || (mode === "create" && availableCities.length === 0)}>
                      {saving ? t("common.saving", "Saving...") : t("common.save", "Save")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={closeModal}></div>
        </>
      ) : null}
    </div>
  );
}
