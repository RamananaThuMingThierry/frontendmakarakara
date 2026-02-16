import { createBrowserRouter } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";

import Home from "../pages/public/Home";
import Shop from "../pages/public/Shop";
import ProductDetails from "../Components/website/ProductDetails";
import Cart from "../pages/public/Cart";
import Checkout from "../pages/public/Checkout";
import OrderSuccess from "../pages/public/OrderSuccess";
import About from "../pages/public/About";
import Contact from "../pages/public/Contact";
import Favorites from "../pages/public/Favorites";
import SearchResults from "../pages/public/SearchResults";
import Account from "../pages/public/Account";

import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import VerifyCode from "../pages/VerifyCode";
import ResetPassword from "../pages/ResetPassword";
import GalleryClients from "../pages/public/GalleryClients";
import TestimonialsPage from "../pages/public/TestimonialsPage";
import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import RoleRoute from "../Components/website/RoleRoute";
import RootLayout from "../layouts/RooteLayout";
import CategoriesPage from "../pages/admin/Categories/CategoriesPage";

export const router = createBrowserRouter([
  {
    element: <RootLayout/>,
    children: [
      {
        path: "/",
        element: <PublicLayout />,
        children: [

          { index: true, element: <Home /> },
          { path: "shop", element: <Shop /> },
          { path: "cart", element: <Cart /> },
          { path: "checkout", element: <Checkout /> },
          { path: "about", element: <About /> },
          { path: "contact", element: <Contact /> },
          { path: "gallery", element: <GalleryClients /> },
          { path: "favorites", element: <Favorites /> },
          { path: "testimonials", element: <TestimonialsPage />},
          { path: "search", element: <SearchResults /> },
          { path: "login", element: <Login /> },
          { path: "register", element: <Register /> },
          { path: "forgot-password", element: <ForgotPassword /> },
          { path: "verify-code", element: <VerifyCode /> },
          { path: "reset-password", element: <ResetPassword /> },
          { path: "order-success/:orderNumber", element: <OrderSuccess /> },
          { path: "product/:id", element: <ProductDetails /> },

          {
            path: "account",
            element: (
              <RoleRoute allow={["customer"]}>
                <Account />
              </RoleRoute>
            ),
          },
        ],
      },
      {
        path: "/admin",
        element: (
          <RoleRoute allow={["admin"]}>
            <AdminLayout />
          </RoleRoute>
        ),
        children: [
          { index: true, element: <AdminDashboard /> },
          // { path: "products", element: <ProductsPage /> },
          // { path: "brands", element: <BrandsPage /> },
          { path: "categories", element: <CategoriesPage /> },
          // { path: "orders", element: <OrdersPage /> },
          // { path: "coupons", element: <CouponsPage /> },
          // { path: "sliders", element: <SlidersPage /> },
          // { path: "users", element: <UsersPage /> },
          // { path: "settings", element: <SettingsPage /> },
        ],
      },
    ]
  }
]);
