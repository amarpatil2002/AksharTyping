import { createBrowserRouter, Navigate } from "react-router-dom";

import PublicLayout from "../src/layouts/PublicLayout";
import AuthLayout from "../src/layouts//AuthLayout";
import AppLayout from "../src/layouts/AppLayout";

import LandingPage from "../src/pages/LandingPage";
import NotFoundPage from "../src/pages/PageNotfound";
import PlaceholderPage from "../src/pages/PlaceHolderPage";

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      {
        path: "/",
        element: <LandingPage />,
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/login",
        element: <PlaceholderPage title="Login" />,
      },
      {
        path: "/signup",
        element: <PlaceholderPage title="Create account" />,
      },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      {
        path: "/dashboard",
        element: <PlaceholderPage title="Dashboard" />,
      },
      {
        path: "/typing",
        element: <PlaceholderPage title="Typing Practice" />,
      },
      {
        path: "/ai-coach",
        element: <PlaceholderPage title="AI Coach" />,
      },

      {
        path: "/profile",
        element: <PlaceholderPage title="Profile" />,
      },
    ],
  },
  {
    path: "/home",
    element: <Navigate to="/" replace />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
