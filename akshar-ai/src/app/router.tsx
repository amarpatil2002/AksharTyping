import { createBrowserRouter, Navigate } from "react-router-dom";
import { PublicLayout } from "../layouts/PublicLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { StudentLayout } from "../layouts/StudentLayout";
import { AdminLayout } from "../layouts/AdminLayout";
import { ProtectedRoute } from "../routes/ProtectedRoute";
import { RoleRoute } from "../routes/RoleRoute";

import { LandingPage } from "../modules/dashboard/pages/LandingPage";
import { DashboardPage } from "../modules/dashboard/pages/DashboardPage";
import { LoginPage } from "../modules/auth/pages/LoginPage";
import { SignupPage } from "../modules/auth/pages/SignupPage";
import { VerifyEmailPage } from "../modules/auth/pages/VerifyEmailPage";
import { ForgotPasswordPage } from "../modules/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "../modules/auth/pages/ResetPasswordPage";
import { TypingPracticePage } from "../modules/typing-practice/pages/TypingPracticePage";
import { TypingSessionPage } from "../modules/typing-practice/pages/TypingSessionPage";
import { TypingExamsPage } from "../modules/typing-exams/pages/TypingExamsPage";
import { StateExamsPage } from "../modules/state-exams/pages/StateExamsPage";
import { ProfilePage } from "../modules/profile/pages/ProfilePage";
import { AdminDashboardPage } from "../modules/admin/pages/AdminDashboardPage";
import { NotFoundPage } from "../shared/components/NotFoundPage";

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <LandingPage /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/signup", element: <SignupPage /> },
      { path: "/verify-email", element: <VerifyEmailPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <StudentLayout />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/typing/practice", element: <TypingPracticePage /> },
          { path: "/typing/practice/:passageId", element: <TypingSessionPage /> },
          { path: "/typing/exams", element: <TypingExamsPage /> },
          { path: "/state-exams", element: <StateExamsPage /> },
          { path: "/profile", element: <ProfilePage /> },
        ],
      },
      {
        element: <RoleRoute allowedRoles={["admin"]} />,
        children: [
          {
            element: <AdminLayout />,
            children: [{ path: "/admin", element: <AdminDashboardPage /> }],
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
