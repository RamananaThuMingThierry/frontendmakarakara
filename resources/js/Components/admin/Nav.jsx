import React from "react";

export default function Nav({
  onToggleSidebar,
  locale = "fr",
  onChangeLang,
  user,
  onLogout,
  assetsBaseUrl = "",
}) {
  const languages = [
    { code: "en", label: "English", icon: "img/icon_en.png" },
    { code: "de", label: "Deutsch", icon: "img/icon_de.png" },
    { code: "es", label: "Español", icon: "img/icon_es.png" },
    { code: "fr", label: "Français", icon: "img/icon_fr.png" },
  ];

  const logoUrl = `${assetsBaseUrl}utiles/logo.png`;
  const avatarUrl = user?.avatar
    ? `${assetsBaseUrl}images/users/${user.avatar}`
    : `${assetsBaseUrl}images/img.png`;

  return (
    <nav
      className="sb-topnav navbar navbar-expand navbar-light"
      style={{ backgroundColor: "rgb(167, 9, 11)" }}
    >
      <span className="navbar-brand text-white ps-3 h1 d-flex align-items-center mb-0">
        <img
          src={logoUrl}
          alt="Logo"
          className="rounded-circle"
          width={30}
          height={30}
        />
        &nbsp;MAKARAKARA
      </span>

      <button
        className="btn btn-link btn-sm order-1 order-lg-0 me-4 me-lg-0"
        type="button"
        id="sidebarToggle"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        <i className="fas fa-bars" />
      </button>

      <ul className="navbar-nav d-flex ms-auto me-0 me-md-3 my-2 my-md-0 flex-row">
        {/* LANG */}
        <li className="nav-item dropdown">
          <button
            className="nav-link dropdown-toggle btn btn-link text-white"
            id="navbarlangueDropdown"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="fas fa-globe fa-fw" />
          </button>

          <ul
            className="dropdown-menu dropdown-menu-end"
            aria-labelledby="navbarlangueDropdown"
          >
            {languages.map((l) => (
              <li key={l.code}>
                <button
                  type="button"
                  className={`dropdown-item lang-change ${
                    locale === l.code ? "active" : ""
                  }`}
                  onClick={() => onChangeLang?.(l.code)}
                >
                  <img
                    src={`${assetsBaseUrl}${l.icon}`}
                    width={22}
                    alt={l.label}
                  />
                  &nbsp;{l.label}
                </button>
              </li>
            ))}
          </ul>
        </li>

        {/* USER */}
        <li className="nav-item dropdown">
          <button
            className="nav-link dropdown-toggle btn btn-link text-white"
            id="navbarDropdown"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="fas fa-user fa-fw" />
          </button>

          <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
            <li className="d-flex justify-content-center align-items-center">
              <div className="text-center px-3 pt-2">
                <img
                  src={avatarUrl}
                  className="rounded-circle"
                  alt="Photo de profil"
                  height={80}
                  width={80}
                />
                <p className="fw-bold pt-2 mb-2" style={{ fontSize: 13 }}>
                  {user?.pseudo ?? "Utilisateur"}
                </p>
              </div>
            </li>

            <hr className="mt-0" />

            <li>
              <a className="dropdown-item" href="/admin/profile">
                <i className="fas fa-user text-warning me-2" />
                Profil
              </a>
            </li>

            <li>
              <button
                className="dropdown-item"
                type="button"
                onClick={onLogout}
              >
                <i className="fas fa-sign-out-alt text-warning me-2" />
                Déconnexion
              </button>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  );
}
