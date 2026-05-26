import { useEffect } from "react";
import Offcanvas from "bootstrap/js/dist/offcanvas";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../../hooks/website/CartContext";
import { useFavorites } from "../../hooks/website/FavoritesContext";
import SearchBar from "./SearchBar";
import { useAuth } from "../../hooks/website/AuthContext";
import { useI18n } from "../../hooks/website/I18nContext";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount } = useCart();
  const { favCount } = useFavorites();
  const { isAuth, roles, user, logout } = useAuth();
  const { lang, setLang, t } = useI18n();
  const safeRoles = Array.isArray(roles) ? roles : [];
  const accountLink = safeRoles.includes("admin") ? "/admin/account" : "/account/profile";
  const languageOptions = [
    { code: "fr", label: "FR", name: "Francais", icon: "/img/icon_fr.png" },
    { code: "en", label: "EN", name: "English", icon: "/img/icon_en.png" },
  ];
  const currentLanguage = languageOptions.find((item) => item.code === lang) || languageOptions[0];
  const navItems = [
    { to: "/", label: t("header.nav.home", "Home") },
    { to: "/shop", label: t("header.nav.shop", "Shop") },
    { to: "/cart", label: t("header.nav.cart", "Cart") },
    { to: "/about", label: t("header.nav.about", "About") },
    { to: "/contact", label: t("header.nav.contact", "Contact") },
  ];

  function getImageUrl(path) {
    if (!path) return "/website/images/slide_1.jpg";
    if (/^https?:\/\//i.test(path)) return path;
    return `/${String(path).replace(/^\/+/, "")}`;
  }

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
          <Link className="navbar-brand fw-bold text-warning d-flex align-items-center gap-2" to="/">
            <img
              src={getImageUrl("images/logo/mahakarakara.jpg")}
              alt={t("header.logoAlt", "Logo")}
              className="img-fluid rounded-pill"
              style={{ maxHeight: "35px" }}
            />
            <span>MAHAKARAKARA</span>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#mainNav"
            aria-controls="mainNav"
            aria-label={t("header.actions.openNavigation", "Open navigation")}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse">
            <ul className="navbar-nav mx-auto gap-lg-3">
              {navItems.map((item) => (
                <li className="nav-item" key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) => "nav-link" + (isActive ? " fw-semibold" : "")}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="d-flex align-items-center gap-3">
              <div className="dropdown">
                <button
                  className="btn btn-link p-0 text-dark text-decoration-none language-trigger"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  aria-label={t("header.language.choose", "Choose language")}
                  title={t("header.language.choose", "Choose language")}
                >
                  <img src={currentLanguage.icon} alt={currentLanguage.name} className="language-flag" />
                  <span className="small fw-semibold">{currentLanguage.label}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end language-menu">
                  {languageOptions.map((option) => (
                    <li key={option.code}>
                      <button
                        type="button"
                        className={`dropdown-item language-option ${lang === option.code ? "active" : ""}`}
                        onClick={() => setLang(option.code)}
                      >
                        <img src={option.icon} alt={option.name} className="language-flag" />
                        <span>{option.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <SearchBar />

              {isAuth ? (
                <div className="dropdown">
                  <button
                    className="btn btn-link p-0 text-dark text-decoration-none dropdown-toggle"
                    data-bs-toggle="dropdown"
                    type="button"
                  >
                    <i className="bi bi-person fs-5 me-1"></i>
                    <span className="small">{user?.name || t("header.account.label", "Account")}</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <Link className="dropdown-item" to={accountLink}>
                        {t("header.account.mySpace", "My space")}
                      </Link>
                    </li>
                    <li>
                      <button className="dropdown-item" type="button" onClick={logout}>
                        {t("header.account.logout", "Logout")}
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <Link className="btn btn-link p-0 text-dark" to="/login" aria-label={t("header.account.label", "Account")}>
                  <i className="bi bi-person fs-5"></i>
                </Link>
              )}

              <Link
                to="/favorites"
                className="btn btn-link text-dark position-relative me-2"
                aria-label={t("header.nav.favorites", "Favorites")}
              >
                <i className="bi bi-heart" />
                {favCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {favCount}
                  </span>
                )}
              </Link>

              <Link
                className="btn btn-link p-0 text-dark position-relative"
                to="/cart"
                aria-label={t("header.nav.cart", "Cart")}
              >
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

      <div className="offcanvas offcanvas-start" tabIndex="-1" id="mainNav" aria-labelledby="mainNavLabel">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="mainNavLabel">
            {t("header.menu", "Menu")}
          </h5>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label={t("common.close", "Close")}
          ></button>
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

          <div className="mb-3">
            <div className="small text-uppercase text-secondary fw-semibold mb-2">
              {t("header.language.label", "Language")}
            </div>
            <div className="d-flex gap-2">
              {languageOptions.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  className={`btn ${lang === option.code ? "btn-dark" : "btn-outline-dark"} d-inline-flex align-items-center gap-2`}
                  onClick={() => setLang(option.code)}
                >
                  <img src={option.icon} alt={option.name} className="language-flag" />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="d-flex gap-3">
            <Link
              className="btn btn-outline-dark w-100"
              to={isAuth ? accountLink : "/login"}
              onClick={handleMobileNavigation(isAuth ? accountLink : "/login")}
            >
              <i className="bi bi-person me-2"></i>
              {isAuth ? t("header.account.mySpace", "My space") : t("header.account.label", "Account")}
            </Link>
            <Link className="btn btn-dark w-100" to="/cart" onClick={handleMobileNavigation("/cart")}>
              <i className="bi bi-bag me-2"></i>
              {t("header.nav.cart", "Cart")} ({cartCount})
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
