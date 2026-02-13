import { Outlet, NavLink } from "react-router-dom";

const Item = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      "list-group-item list-group-item-action d-flex align-items-center gap-2 " +
      (isActive ? "active" : "")
    }
  >
    <i className={`bi ${icon}`} />
    <span>{label}</span>
  </NavLink>
);

export default function AdminLayout() {
  return (
    <div className="d-flex min-vh-100 bg-light">
      {/* Sidebar */}
      <aside
        className="bg-dark text-light p-3 d-none d-lg-flex flex-column"
        style={{ width: 260 }}
      >
        <div className="mb-3">
          <div className="fw-bold text-warning fs-5">MAKARAKARA</div>
          <div className="text-secondary small">Admin Panel</div>
        </div>

        <div className="list-group list-group-flush">
          <Item to="/admin" icon="bi-speedometer2" label="Dashboard" />
          <Item to="/admin/products" icon="bi-box-seam" label="Products" />
          <Item to="/admin/brands" icon="bi-patch-check" label="Brand" />
          <Item to="/admin/categories" icon="bi-tags" label="Category" />
          <Item to="/admin/orders" icon="bi-receipt" label="Order" />
          <Item to="/admin/coupons" icon="bi-ticket-perforated" label="Coupon" />
          <Item to="/admin/sliders" icon="bi-images" label="Slider" />
          <Item to="/admin/users" icon="bi-people" label="User" />
          <Item to="/admin/settings" icon="bi-gear" label="Setting" />
        </div>

        <div className="mt-auto pt-3 border-top border-secondary">
          <a className="btn btn-outline-light w-100" href="/">
            <i className="bi bi-arrow-left me-2" />
            Retour site
          </a>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-grow-1">
        {/* Topbar */}
        <header className="bg-white border-bottom">
          <div className="container-fluid py-3 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <span className="fw-semibold">Dashboard</span>
              <span className="badge bg-warning text-dark">Admin</span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button className="btn btn-outline-dark btn-sm" type="button">
                <i className="bi bi-bell" />
              </button>
              <button className="btn btn-dark btn-sm" type="button">
                <i className="bi bi-person-circle me-2" />
                Mon compte
              </button>
            </div>
          </div>
        </header>

        <main className="container-fluid py-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
