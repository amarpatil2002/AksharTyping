import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

import GuestOnlyRoute from "../routes/GuestOnlyRoute";
import ProtectedAdminRoute from "../routes/ProtectedAdminRoute";

import AdminLoginPage from "../features/auth/AdminLoginPage";
import AdminLayout from "../layouts/AdminLayout";
import PageNotFound from "../pages/PageNotFound";
import DashboardPage from "../features/dashboard/DashboardPage";

import { typingExamRoutes } from "../features/typing-exam/passage/passage.routes";

import { TypingPassageProvider } from "../features/typing-exam/passage/context/TypingPassageProvider";
import { TypingExamProvider } from "../features/typing-exam/exam/context/TypingExamContext";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    element: <GuestOnlyRoute />,
    children: [
      {
        path: "/login",
        element: <AdminLoginPage />,
      },
    ],
  },
  {
    element: <ProtectedAdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },

          // Typing Exam Feature
          {
            path: "/typing-exams",
            element: (
              <TypingExamProvider>
                <TypingPassageProvider>
                  <Outlet />
                </TypingPassageProvider>
              </TypingExamProvider>
            ),
            children: typingExamRoutes,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <PageNotFound />,
  },
]);
