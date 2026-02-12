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
import ProtectedRoute from "../Components/website/ProtectedRoute";

export const router = createBrowserRouter([
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
      { path: "favorites", element: <Favorites /> },
      { path: "search", element: <SearchResults /> },
      { path: "login", element: <Login /> },
      { path: "order-success/:orderNumber", element: <OrderSuccess /> },
      { path: "product/:id", element: <ProductDetails /> },

      {
        path: "account",
        element: (
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
