import { useEffect } from "react";
import Offcanvas from "bootstrap/js/dist/offcanvas";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useCart } from '../../hooks/website/CartContext';
import { useFavorites } from "../../hooks/website/FavoritesContext";
import SearchBar from "./SearchBar";
import { useAuth } from "../../hooks/website/AuthContext";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount } = useCart();
  const { favCount } = useFavorites();
  const { isAuth, roles, user, logout } = useAuth();
  const safeRoles = Array.isArray(roles) ? roles : [];
  const accountLink = safeRoles.includes("admin") ? "/admin/account" : "/account/profile";
  const navItems = [
    { to: "/", label: "Accueil" },
    { to: "/shop", label: "Boutique" },
    { to: "/cart", label: "Panier" },
    { to: "/about", label: "A propos" },
    { to: "/contact", label: "Contact" },
  ];

  const closeMobileMenu = (onClosed) => {
    const offcanvasEl = document.getElementById("mainNav");
    if (!offcanvasEl) {
      if (typeof onClosed === "function") onClosed();
      return;
    }

    const instance = Offcanvas.getInstance(offcanvasEl) || Offcanvas.getOrCreateInstance(offcanvasEl);
    const finishClose = () => {
      offcanvasEl.removeEventListener("hidden.bs.offcanvas", finishClose);
      if (typeof onClosed === "function") onClosed();
    };

    if (!offcanvasEl.classList.contains("show")) {
      finishClose();
      return;
    }

    offcanvasEl.addEventListener("hidden.bs.offcanvas", finishClose, { once: true });
    instance.hide();
  };

  const handleMobileNavigation = (to) => (event) => {
    event.preventDefault();
    closeMobileMenu(() => navigate(to));
  };

  useEffect(() => {
    const offcanvasEl = document.getElementById("mainNav");
    const instance = offcanvasEl ? Offcanvas.getInstance(offcanvasEl) : null;

    if (instance && offcanvasEl.classList.contains("show")) {
      instance.hide();
    }

    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("padding-right");
    document.querySelectorAll(".offcanvas-backdrop").forEach((backdrop) => backdrop.remove());
  }, [location.pathname]);

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-white border-bottom sticky-top">
        <div className="container">
          {/* Brand */}
          <Link className="navbar-brand fw-bold text-warning" to="/">
            MAHAKARAKARA
          </Link>

          {/* Mobile toggler (offcanvas) */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#mainNav"
            aria-controls="mainNav"
            aria-label="Ouvrir la navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Desktop nav */}
          <div className="collapse navbar-collapse">
            {/* center links */}
            <ul className="navbar-nav mx-auto gap-lg-3">
              {navItems.map((item) => (
                <li className="nav-item" key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      "nav-link" + (isActive ? " fw-semibold" : "")
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* right icons */}
            <div className="d-flex align-items-center gap-3">

              <SearchBar />

              {isAuth ? (
                <div className="dropdown">
                  <button className="btn btn-link p-0 text-dark text-decoration-none dropdown-toggle" data-bs-toggle="dropdown" type="button">
                    <i className="bi bi-person fs-5 me-1"></i>
                    <span className="small">{user?.name || "Compte"}</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li><Link className="dropdown-item" to={accountLink}>Mon espace</Link></li>
                    <li><button className="dropdown-item" type="button" onClick={logout}>Déconnexion</button></li>
                  </ul>
                </div>
              ) : (
                <Link className="btn btn-link p-0 text-dark" to="/login" aria-label="Compte">
                  <i className="bi bi-person fs-5"></i>
                </Link>
              )}

            <Link to="/favorites" className="btn btn-link text-dark position-relative me-2" aria-label="Favoris">
              <i className="bi bi-heart" />
              {favCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {favCount}
                </span>
              )}
            </Link>

              <Link className="btn btn-link p-0 text-dark position-relative" to="/cart" aria-label="Panier">
                <i className="bi bi-bag fs-5"></i>
                {cartCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-dark">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Offcanvas (mobile) */}
      <div
        className="offcanvas offcanvas-start"
        tabIndex="-1"
        id="mainNav"
        aria-labelledby="mainNavLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="mainNavLabel">
            Menu
          </h5>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div className="offcanvas-body">
          <ul className="navbar-nav">
            {navItems.map((item) => (
              <li className="nav-item" key={item.to}>
                <NavLink
                  className={({ isActive }) => "nav-link" + (isActive ? " fw-semibold" : "")}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={handleMobileNavigation(item.to)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <hr />

          <div className="d-flex gap-3">
            <Link
              className="btn btn-outline-dark w-100"
              to={isAuth ? accountLink : "/login"}
              onClick={handleMobileNavigation(isAuth ? accountLink : "/login")}
            >
              <i className="bi bi-person me-2"></i>{isAuth ? "Mon espace" : "Compte"}
            </Link>
            <Link className="btn btn-dark w-100" to="/cart" onClick={handleMobileNavigation("/cart")}>
              <i className="bi bi-bag me-2"></i>Panier ({cartCount})
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
