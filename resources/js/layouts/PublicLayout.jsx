import { Outlet } from "react-router-dom";
import Header from "../Components/website/Header";
import Footer from "../Components/website/Footer";
import { CartProvider } from "../hooks/website/CartContext";
import { FavoritesProvider } from "../hooks/website/FavoritesContext";
import { AuthProvider } from "../hooks/website/AuthContext";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function PublicLayout() {
return (
<CartProvider>
    <FavoritesProvider>
        <AuthProvider>
            <div className="d-flex flex-column min-vh-100">
                <Header />
                <main className="flex-grow-1">
                    <Outlet />
                </main>
                <Footer />
            </div>
        </AuthProvider>
    </FavoritesProvider>
</CartProvider>
);
}
