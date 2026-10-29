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
import ForgotPasswordPage from "../modules/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "../modules/auth/pages/ResetPasswordPage";
import { TypingExamsPage } from "../modules/typing-exams/pages/TypingExamsPage";

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
          {
            path: "/forgot-password",
            element: <ForgotPasswordPage />,
          },
          {
            path: "/reset-password",
            element: <ResetPasswordPage />,
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
          {
            path: "/typing-exams",
            element: <TypingExamsPage />,
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

  // Unknown paths
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
