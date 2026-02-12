import { Link, NavLink } from "react-router-dom";
import { useCart } from '../../hooks/website/CartContext';
import { useFavorites } from "../../hooks/website/FavoritesContext";
import { PRODUCTS } from "../../data/products";
import SearchBar from "./SearchBar";

export default function Header() {
  const { cartCount } = useCart();
  const { favCount } = useFavorites();

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
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Desktop nav */}
          <div className="collapse navbar-collapse">
            {/* center links */}
            <ul className="navbar-nav mx-auto gap-lg-3">
              {[
                { to: "/", label: "Home" },
                { to: "/shop", label: "Shop" },
                { to: "/cart", label: "Cart" },
                { to: "/about", label: "About" },
                { to: "/contact", label: "Contact" },
              ].map((item) => (
                <li className="nav-item" key={item.to}>
                  <NavLink
                    to={item.to}
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

              <SearchBar products={PRODUCTS} />

              <Link className="btn btn-link p-0 text-dark" to="/login" aria-label="Account">
                <i className="bi bi-person fs-5"></i>
              </Link>

            <Link to="/favorites" className="btn btn-link text-dark position-relative me-2">
              <i className="bi bi-heart" />
              {favCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {favCount}
                </span>
              )}
            </Link>


              <Link className="btn btn-link p-0 text-dark position-relative" to="/cart" aria-label="Cart">
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
            <li className="nav-item">
              <NavLink className="nav-link" to="/" data-bs-dismiss="offcanvas">Home</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/shop" data-bs-dismiss="offcanvas">Shop</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/cart" data-bs-dismiss="offcanvas">Cart</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/about" data-bs-dismiss="offcanvas">About</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/contact" data-bs-dismiss="offcanvas">Contact</NavLink>
            </li>
          </ul>

          <hr />

          <div className="d-flex gap-3">
            <Link className="btn btn-outline-dark w-100" to="/login" data-bs-dismiss="offcanvas">
              <i className="bi bi-person me-2"></i>Compte
            </Link>
            <Link className="btn btn-dark w-100" to="/cart" data-bs-dismiss="offcanvas">
              <i className="bi bi-bag me-2"></i>Panier ({cartCount})
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
