import React, { useMemo, useState } from "react";
import { productsApi } from "@/api/products";
import { cityApi } from "@/api/cities";

const CURRENCIES = [
  { value: "MGA", label: "Ar" },
  { value: "EUR", label: "EURO" },
  { value: "USD", label: "USD" },
];

export default function CityAvailability({ product, reload, allCities = [] }) {
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("create");
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    city_id: "",
    price: "",
    currency: "MGA",
    note: "",
    is_available: true,
  });

  // Pour éviter de proposer des villes déjà présentes (optionnel)
  const availableCities = useMemo(() => {
    const existingIds = new Set((product.cities ?? []).map((c) => c.id));
    return allCities.filter((c) => !existingIds.has(c.id));
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
    if (saving) return;
    setShowModal(false);
  }

  async function onSubmit(e) {
    e.preventDefault();
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
        // Exemple : associer une ville + définir un prix
        await productsApi.setCityPrice(product.encrypted_id, form.city_id, payload);
      } else {
        // Exemple : mettre à jour le pivot
        await productsApi.updateCityPrice(product.encrypted_id, form.city_id, payload);
      }

      await reload();
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  }

  async function removeCity(cityId) {
    if (!window.confirm("Supprimer cette ville du produit ?")) return;
    await productsApi.deleteCityPrice(product.encrypted_id, cityId);
    reload();
  }

  function formatPrice(value) {
    if (value === null || value === undefined || value === "") return "—";
    return new Intl.NumberFormat("fr-FR").format(Number(value));
  }

  function currencyLabel(code) {
    return CURRENCIES.find((c) => c.value === code)?.label ?? code ?? "—";
  }

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h6 className="mb-0">Prix par ville</h6>

          <button type="button" className="btn btn-sm btn-primary" onClick={openCreate}>
            <i className="bi bi-plus-circle me-1"></i>
            Définir un prix
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th>Ville</th>
                <th className="text-end">Prix</th>
                <th>Devise</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>

            <tbody>
              {(product.cities ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted py-3">
                    Aucune ville définie.
                  </td>
                </tr>
              ) : (
                product.cities?.map((city) => (
                  <tr key={city.id}>
                    <td>{city.name}</td>

                    <td className="text-end">
                      {formatPrice(city.pivot?.price)}
                    </td>

                    <td>{currencyLabel(city.pivot?.currency)}</td>

                    <td className="text-end">
                      <div className="btn-group btn-group-sm" role="group">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => openEdit(city)}
                        >
                          <i className="bi bi-pencil-square me-1"></i>
                          Modifier
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => removeCity(city.id)}
                        >
                          <i className="bi bi-trash me-1"></i>
                          Supprimer
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

      {/* Modal (Bootstrap sans JS impératif, via rendu conditionnel) */}
      {showModal && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1" role="dialog">
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <form onSubmit={onSubmit}>
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {mode === "create" ? "Définir un prix" : "Modifier le prix"}
                    </h5>
                    <button type="button" className="btn-close" onClick={closeModal} aria-label="Close" />
                  </div>

                  <div className="modal-body">
                    {/* Ville */}
                    <div className="mb-2">
                      <label className="form-label">Ville</label>

                      {mode === "create" ? (
                        <select
                          className="form-select"
                          value={form.city_id}
                          onChange={(e) => setForm((f) => ({ ...f, city_id: e.target.value }))}
                          required
                        >
                          {availableCities.length === 0 ? (
                            <option value="">Toutes les villes sont déjà ajoutées</option>
                          ) : (
                            availableCities.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))
                          )}
                        </select>
                      ) : (
                        <input className="form-control" value={product.cities?.find(c => c.id === form.city_id)?.name ?? ""} disabled />
                      )}
                    </div>

                    {/* Prix + Devise */}
                    <div className="row g-2">
                      <div className="col-7">
                        <label className="form-label">Prix</label>
                        <input
                          type="number"
                          className="form-control"
                          value={form.price}
                          onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>

                      <div className="col-5">
                        <label className="form-label">Devise</label>
                        <select
                          className="form-select"
                          value={form.currency}
                          onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                        >
                          {CURRENCIES.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Note */}
                    <div className="mt-2">
                      <label className="form-label">Note (optionnel)</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={form.note}
                        onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                        placeholder="Ex: prix promo, conditions, etc."
                      />
                    </div>

                    {/* Disponible */}
                    <div className="form-check mt-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="is_available"
                        checked={form.is_available}
                        onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.checked }))}
                      />
                      <label className="form-check-label" htmlFor="is_available">
                        Disponible
                      </label>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-light" onClick={closeModal} disabled={saving}>
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={saving || (mode === "create" && availableCities.length === 0)}
                    >
                      {saving ? "Enregistrement..." : "Enregistrer"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Backdrop */}
          <div className="modal-backdrop fade show" onClick={closeModal}></div>
        </>
      )}
    </div>
  );
}