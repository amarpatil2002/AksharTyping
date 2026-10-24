import { createBrowserRouter } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import AuthLayout from "../layouts/AuthLayout";
import AppLayout from "../layouts/AppLayout";

import GuestRoute from "../routes/GuestRoute";
import ProtectedRoute from "../routes/ProtectedRoute";
import RoleRoute from "../routes/RoleRoute";

import LandingPage from "../modules/landing/pages/LandingPage";
import LoginPage from "../modules/auth/pages/LoginPage";
import SignupPage from "../modules/auth/pages/SignupPage";
import DashboardPage from "../modules/dashboard/pages/DashboardPage";
import NotFoundPage from "../shared/components/NotFoundPage";

// Import admin pages when you create them.

export const router = createBrowserRouter([
  // Public pages: accessible whether logged in or not
  // {
  //   element: <PublicLayout />,
  //   children: [
  //     {
  //       path: "/",
  //       element: <LandingPage />,
  //     },
  //   ],
  // },

  // Guest-only pages: redirect authenticated users to dashboard
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: "/",
            element: <LandingPage />,
          },
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
    ],
  },

  // Authenticated student pages
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },
          // Add:
          // /typing-practice
          // /typing-exams
          // /state-exams
          // /student-progress
          // /profile
          // /settings
        ],
      },
    ],
  },

  // Admin pages: login required AND admin role required
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleRoute allowedRoles={["admin"]} />,
        children: [
          {
            element: <AppLayout />,
            children: [
              // Add admin routes here:
              // { path: "/admin", element: <AdminDashboardPage /> },
              // { path: "/admin/users", element: <AdminUsersPage /> },
            ],
          },
        ],
      },
    ],
  },

  // Unknown paths
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
