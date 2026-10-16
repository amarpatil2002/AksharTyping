import { createBrowserRouter, Navigate } from "react-router-dom";

import PublicLayout from "../src/layouts/PublicLayout";
import AuthLayout from "../src/layouts//AuthLayout";
import AppLayout from "../src/layouts/AppLayout";

import LandingPage from "../src/pages/LandingPage";
import NotFoundPage from "../src/pages/PageNotfound";
import PlaceholderPage from "../src/pages/PlaceholderPage";

import LoginPage from "../src/pages/LoginPage";
import SignupPage from "../src/pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import TypingTestPage from "./pages/TypingTestPage";
import PassagesPage from "./pages/PassagePage";

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
        element: <LoginPage />,
      },
      {
        path: "/signup",
        element: <SignupPage />,
      },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      {
        path: "/dashboard",
        element: <DashboardPage />,
      },
      {
        path: "/passages",
        element: <PassagesPage />,
      },
      {
        path: "/typing",
        element: <TypingTestPage />,
      },
      {
        path: "/ai-coach",
        element: <PlaceholderPage title="AI Coach" />,
      },
      {
        path: "/analytics",
        element: <PlaceholderPage title="Analytics" />,
      },
      {
        path: "/achievements",
        element: <PlaceholderPage title="Achievements" />,
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
