import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { publicGalleryApi } from "../../api/public_gallery";
import { useAuth } from "../../hooks/website/AuthContext";
import { imageUrl } from "../../utils/Url";
import "../../../css/website.css";

export default function HappyClients() {
  const nav = useNavigate();
  const { isAuth, hydrating } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState(null);
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });

  function showToast(type, message) {
    setToast({ open: true, type, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast((current) => ({ ...current, open: false })), 3000);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await publicGalleryApi.list();
        if (cancelled) return;
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (cancelled) return;
        setError(e?.response?.data?.message || "Impossible de charger la galerie.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const previewItems = useMemo(
    () =>
      [...items]
        .sort((a, b) => Number(b.likes || 0) - Number(a.likes || 0))
        .slice(0, 6),
    [items]
  );

  async function handleLike(item) {
    if (pendingId || hydrating) return;

    if (!isAuth) {
      showToast("warning", "Connectez-vous pour aimer une image.");
      nav("/login");
      return;
    }

    setPendingId(item.id);

    const nextLiked = !item.liked_by_user;
    const previousItems = items;

    setItems((current) =>
      current.map((row) =>
        row.id === item.id
          ? {
              ...row,
              liked_by_user: nextLiked,
              likes: Math.max(0, Number(row.likes || 0) + (nextLiked ? 1 : -1)),
            }
          : row
      )
    );

    try {
      const result = await publicGalleryApi.toggleLike(item.encrypted_id ?? item.id);
      setItems((current) =>
        current.map((row) =>
          row.id === item.id
            ? {
                ...row,
                liked_by_user: Boolean(result.data?.liked),
                likes: Number(result.data?.likes ?? row.likes ?? 0),
              }
            : row
        )
      );
    } catch (e) {
      setItems(previousItems);
      showToast("danger", e?.response?.data?.message || "Impossible de mettre a jour le like.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="py-5 bg-light">
      <div className="container">
        <div className="text-center mb-4">
          <h3 className="fw-bold" style={{ fontFamily: "cursive" }}>
            Clients Satisfaits
          </h3>
          <p className="text-secondary mb-0">
            Decouvrez les resultats reels de notre communaute
          </p>
        </div>

        {error ? <div className="alert alert-danger">{error}</div> : null}

        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <div className="d-flex align-items-center gap-2 text-muted">
              <span className="spinner-border spinner-border-sm" />
              Chargement...
            </div>
          </div>
        ) : previewItems.length === 0 ? (
          <div className="text-center text-muted py-5">Aucune image disponible.</div>
        ) : (
          <div className="row g-3">
            {previewItems.map((image) => (
              <div key={image.id} className="col-6 col-md-4">
                <div className="client-card position-relative overflow-hidden rounded-4 bg-white border shadow-sm">
                  <img
                    src={imageUrl(image.image_url)}
                    alt={image.name || "Client satisfait"}
                    className="w-100 h-100 object-fit-cover"
                    style={{ height: 220 }}
                    loading="lazy"
                  />

                  <div className="position-absolute top-0 start-0 end-0 p-3 d-flex justify-content-between align-items-start">
                    <span className="badge bg-dark bg-opacity-75 rounded-pill">
                      {image.name || "Client"}
                    </span>
                    <button
                      type="button"
                      className={`btn btn-sm rounded-pill ${image.liked_by_user ? "btn-danger" : "btn-light"}`}
                      onClick={() => handleLike(image)}
                      disabled={pendingId === image.id}
                    >
                      {pendingId === image.id ? (
                        <span className="spinner-border spinner-border-sm" />
                      ) : (
                        <>
                          <i className={`bi ${image.liked_by_user ? "bi-heart-fill" : "bi-heart"} me-1`} />
                          {image.likes ?? 0}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-4">
          <Link className="btn btn-dark btn-sm px-4" to="/gallery">
            Voir plus de photos
          </Link>
        </div>
      </div>

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
    </section>
  );
}
