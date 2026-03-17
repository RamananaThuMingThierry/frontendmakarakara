import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { publicGalleryApi } from "../../api/public_gallery";
import { useAuth } from "../../hooks/website/AuthContext";
import { imageUrl } from "../../utils/Url";

export default function GalleryClients() {
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

  async function load() {
    setLoading(true);
    setError("");

    try {
      const data = await publicGalleryApi.list();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Impossible de charger la galerie.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [isAuth]);

  const totalLikes = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.likes || 0), 0),
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
    <div className="py-5 bg-light">
      <div className="container" style={{ maxWidth: 1100 }}>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h2 className="fw-bold mb-1" style={{ fontFamily: "cursive" }}>
              Galerie Clients
            </h2>
            <p className="text-secondary mb-0">
              Tous les resultats de notre communaute
            </p>
          </div>

          <Link to="/" className="btn btn-outline-dark btn-sm">
            Retour
          </Link>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
          <span className="badge text-bg-dark rounded-pill px-3 py-2">{items.length} photos</span>
          <span className="badge text-bg-light border rounded-pill px-3 py-2">{totalLikes} likes</span>
          {!isAuth ? (
            <span className="text-muted small">Connectez-vous pour aimer une image.</span>
          ) : (
            <span className="text-muted small">Un utilisateur peut laisser 1 like ou le retirer.</span>
          )}
        </div>

        {error ? <div className="alert alert-danger">{error}</div> : null}

        {loading ? (
          <div className="d-flex align-items-center gap-2 text-muted py-5">
            <span className="spinner-border spinner-border-sm" />
            Chargement...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-muted py-5">Aucune image disponible.</div>
        ) : (
          <div className="row g-3">
            {items.map((image) => {
              const isPending = pendingId === image.id;
              const liked = Boolean(image.liked_by_user);

              return (
                <div key={image.id} className="col-6 col-md-4 col-lg-3">
                  <div className="client-card position-relative overflow-hidden rounded-4 bg-white border shadow-sm">
                    <img
                      src={imageUrl(image.image_url)}
                      alt={image.name || `Client ${image.id}`}
                      className="w-100 h-100 object-fit-cover"
                      style={{ height: 260 }}
                      loading="lazy"
                    />

                    <div className="position-absolute top-0 start-0 end-0 p-3 d-flex justify-content-between align-items-start">
                      <span className="badge bg-dark bg-opacity-75 rounded-pill">
                        {image.name || "Client"}
                      </span>

                      <button
                        type="button"
                        className={`btn btn-sm rounded-pill ${
                          liked ? "btn-danger" : "btn-light"
                        }`}
                        onClick={() => handleLike(image)}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <span className="spinner-border spinner-border-sm" />
                        ) : (
                          <>
                            <i className={`bi ${liked ? "bi-heart-fill" : "bi-heart"} me-2`} />
                            {image.likes ?? 0}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center text-secondary small mt-4">
          Galerie alimentee depuis l'administration.
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
    </div>
  );
}
