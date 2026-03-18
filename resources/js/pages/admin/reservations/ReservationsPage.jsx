import { useEffect, useMemo, useState } from "react";
import { adminReservationsApi } from "../../../api/admin_reservations";

const STATUS_BADGES = {
  active: "warning",
  released: "secondary",
  consumed: "success",
};

const STATUS_LABELS = {
  active: "Active",
  released: "Liberee",
  consumed: "Consommee",
};

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("fr-FR");
  } catch {
    return value;
  }
}

function formatSource(item) {
  if (item.order_id || item.reference_type?.includes("Order")) return "Commande";
  if (item.cart_id || item.reference_type?.includes("Cart")) return "Panier";
  return "Reservation";
}

export default function ReservationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showOpen, setShowOpen] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  async function load({ mode = "initial" } = {}) {
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);

    setError("");
    try {
      const data = await adminReservationsApi.list();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Impossible de charger les reservations.");
    } finally {
      if (mode === "initial") setLoading(false);
      else setRefreshing(false);
    }
  }

  useEffect(() => {
    load({ mode: "initial" });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) =>
      [
        item.id,
        item.user_name,
        item.user_email,
        item.product_name,
        item.city_name,
        item.status,
        item.release_reason,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [items, search]);

  async function openShow(item) {
    setShowOpen(true);
    setShowLoading(true);
    setSelected(null);

    try {
      const data = await adminReservationsApi.show(item.encrypted_id || item.id);
      setSelected(data);
    } catch (e) {
      setError(e?.response?.data?.message || "Impossible de charger le detail de la reservation.");
      setShowOpen(false);
    } finally {
      setShowLoading(false);
    }
  }

  function closeShow() {
    if (showLoading) return;
    setShowOpen(false);
    setSelected(null);
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h4 className="mb-1">Suivi des reservations</h4>
          <div className="text-muted small">Historique des produits reserves, liberes et consommes.</div>
          <div className="text-muted small">Total: {items.length}</div>
        </div>

        <div className="d-flex gap-2">
          <input
            className="form-control"
            style={{ width: 320 }}
            placeholder="Rechercher client, produit, ville..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loading}
          />

          <button
            className="btn btn-outline-secondary"
            onClick={() => load({ mode: "refresh" })}
            disabled={loading || refreshing}
          >
            {loading || refreshing ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Actualisation...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-2" />
                Actualiser
              </>
            )}
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {error ? <div className="alert alert-danger">{error}</div> : null}

          {loading ? (
            <div className="d-flex align-items-center gap-2 text-muted">
              <span className="spinner-border spinner-border-sm" />
              Chargement...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-muted py-4">Aucune reservation trouvee.</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr className="text-muted small">
                    <th style={{ width: 70 }}>#</th>
                    <th>Client</th>
                    <th>Produit</th>
                    <th>Ville</th>
                    <th>Quantite</th>
                    <th>Source</th>
                    <th>Statut</th>
                    <th>Date</th>
                    <th className="text-end" style={{ width: 140 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="fw-semibold">{item.user_name || "-"}</div>
                        <div className="small text-muted">{item.user_email || "-"}</div>
                      </td>
                      <td>{item.product_name || "-"}</td>
                      <td>{item.city_name || "-"}</td>
                      <td>{item.quantity}</td>
                      <td>{formatSource(item)}</td>
                      <td>
                        <span className={`badge text-bg-${STATUS_BADGES[item.status] || "secondary"}`}>
                          {STATUS_LABELS[item.status] || item.status}
                        </span>
                      </td>
                      <td>{formatDate(item.reserved_at)}</td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => openShow(item)}>
                          <i className="bi bi-eye me-1" />
                          Voir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showOpen && (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Detail de la reservation</h5>
                  <button type="button" className="btn-close" onClick={closeShow} disabled={showLoading} />
                </div>

                <div className="modal-body">
                  {showLoading ? (
                    <div className="d-flex align-items-center gap-2 text-muted">
                      <span className="spinner-border spinner-border-sm" />
                      Chargement du detail...
                    </div>
                  ) : selected ? (
                    <div className="row g-3">
                      <div className="col-12 col-lg-6">
                        <div className="border rounded-3 p-3 h-100">
                          <div className="text-muted small mb-1">Client</div>
                          <div className="fw-semibold">{selected.user_name || "-"}</div>
                          <div className="small text-muted">{selected.user_email || "-"}</div>

                          <hr />

                          <div className="text-muted small mb-1">Produit</div>
                          <div>{selected.product_name || "-"}</div>

                          <hr />

                          <div className="text-muted small mb-1">Ville</div>
                          <div>{selected.city_name || "-"}</div>

                          <hr />

                          <div className="text-muted small mb-1">Quantite</div>
                          <div>{selected.quantity}</div>
                        </div>
                      </div>

                      <div className="col-12 col-lg-6">
                        <div className="border rounded-3 p-3 h-100">
                          <div className="text-muted small mb-1">Statut</div>
                          <div className="mb-3">
                            <span className={`badge text-bg-${STATUS_BADGES[selected.status] || "secondary"}`}>
                              {STATUS_LABELS[selected.status] || selected.status}
                            </span>
                          </div>

                          <div className="text-muted small mb-1">Source</div>
                          <div className="mb-3">{formatSource(selected)}</div>

                          <div className="text-muted small mb-1">Expire le</div>
                          <div className="mb-3">{formatDate(selected.expires_at)}</div>

                          <div className="text-muted small mb-1">Reserve le</div>
                          <div className="mb-3">{formatDate(selected.reserved_at)}</div>

                          <div className="text-muted small mb-1">Libere le</div>
                          <div className="mb-3">{formatDate(selected.released_at)}</div>

                          <div className="text-muted small mb-1">Consomme le</div>
                          <div className="mb-3">{formatDate(selected.consumed_at)}</div>

                          <div className="text-muted small mb-1">Motif</div>
                          <div>{selected.release_reason || "-"}</div>
                        </div>
                      </div>

                      <div className="col-12">
                        <div className="border rounded-3 p-3">
                          <div className="text-muted small mb-2">Items de la reservation</div>
                          {Array.isArray(selected.items) && selected.items.length > 0 ? (
                            <div className="table-responsive">
                              <table className="table align-middle mb-0">
                                <thead>
                                  <tr className="text-muted small">
                                    <th>Produit</th>
                                    <th>Ville</th>
                                    <th>Quantite</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selected.items.map((reservationItem) => (
                                    <tr key={reservationItem.id}>
                                      <td>{reservationItem.product_name || "-"}</td>
                                      <td>{reservationItem.city_name || "-"}</td>
                                      <td>{reservationItem.quantity}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-muted">Aucun item disponible.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted">Aucun detail disponible.</div>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeShow} disabled={showLoading}>
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" onClick={closeShow} />
        </>
      )}
    </div>
  );
}
