import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import ClientMenu from "../Components/client/ClientMenu";
import { CartProvider } from "../hooks/website/CartContext";

export default function ClientLayout() {
  const location = useLocation();

  useEffect(() => {
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("padding-right");
    document.querySelectorAll(".modal-backdrop, .offcanvas-backdrop").forEach((backdrop) => backdrop.remove());
  }, [location.pathname]);

  return (
    <CartProvider>
      <main className="py-5" style={{ background: "#fbf7ec", minHeight: "calc(100vh - 140px)" }}>
        <div className="container">
          <div className="row g-4 align-items-start">
            <div className="col-12 col-lg-4 col-xl-3">
              <ClientMenu />
            </div>
            <div className="col-12 col-lg-8 col-xl-9">
              <Outlet key={location.pathname} />
            </div>
          </div>
        </div>
      </main>
    </CartProvider>
  );
}
