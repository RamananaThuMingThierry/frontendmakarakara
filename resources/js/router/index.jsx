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
import UsersPage from "../pages/admin/users/UsersPage";
import BrandsPage from "../pages/admin/Brands/BrandsPage";
import CategoryManagePage from "../pages/admin/Categories/CategoryManagePage";
import UpdateCategoryPage from "../pages/admin/Categories/UpdateCategoryPage";
import CreateProductPage from "../pages/admin/products/CreateProductPage";
import EditProductPage from "../pages/admin/products/EditProductPage";
import ProductManagePage from "../pages/admin/products/ProductManagePage";
import ActivityLogPage from "../pages/admin/activity_logs/ActivityLogPage";
import SlidesPage from "../pages/admin/slides/SlidesPage";
import SettingsPage from "../pages/admin/settings/SettingsPage";
import EmailVerifyPage from "../pages/EmailVerifyPage";
import AdminAccountPage from "../pages/admin/account/AdminAccountPage";
import CouponsPage from "../pages/admin/coupons/CouponsPage";
import ContactUsPage from "../pages/admin/contacts/ContactUsPage";
import TestimonialPage from "../pages/admin/testimonials/TestimonialPage";
import GalleryPage from "../pages/admin/gallery/GalleryPage";
import ReservationsPage from "../pages/admin/reservations/ReservationsPage";
import OrdersPage from "../pages/admin/orders/OrdersPage";
import ClientLayout from "../layouts/ClientLayout";
import Profile from "../pages/client/Profile";
import Orders from "../pages/client/Orders";
import Reservations from "../pages/client/Reservations";

export const router = createBrowserRouter([
  {
    element: <RootLayout/>,
    children: [
       { path: "email/verify", element: <EmailVerifyPage /> },
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
            { path: "product/:encrypted_id", element: <ProductDetails /> },
        ],
      },
      {
        path: "/account",
        element: (
          <RoleRoute allow={["customer"]}>
            <ClientLayout />
          </RoleRoute>
        ),
        children: [
          { index: true, element: <Account /> },
          { path: "profile", element: <Profile /> },
          { path: "reservations", element: <Reservations /> },
          { path: "orders", element: <Orders /> },
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
          { path: "brands", element: <BrandsPage /> },
          { path: "categories", element: <CategoriesPage /> },
          { path: "categories/:encryptedId", element: <CategoryManagePage /> },
          { path: "categories/:encryptedId/edit", element: <UpdateCategoryPage /> },
          { path: "products/create", element: <CreateProductPage /> },
          { path: "categories/:categoryId/products/:productId", element: <ProductManagePage /> },
          { path: "categories/:categoryId/products/:productId/edit", element: <EditProductPage /> },
          { path: "orders", element: <OrdersPage /> },
          { path: "coupons", element: <CouponsPage /> },
          { path: "testimonials", element: <TestimonialPage /> },
          { path: "gallery", element: <GalleryPage /> },
          { path: "reservations", element: <ReservationsPage /> },
          { path: "sliders", element: <SlidesPage /> },
          { path: "users", element: <UsersPage /> },
          { path: "contacts", element: <ContactUsPage /> },
          { path: "activity-logs", element: <ActivityLogPage /> },
          { path: "settings", element: <SettingsPage /> },
          { path: "account", element: <AdminAccountPage /> },
        ],
      },
    ]
  }
]);
