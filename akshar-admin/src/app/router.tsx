import { createBrowserRouter, Navigate } from "react-router-dom";

import GuestOnlyRoute from "../routes/GuestOnlyRoute";
import ProtectedAdminRoute from "../routes/ProtectedAdminRoute";
import AdminLoginPage from "../features/auth/AdminLoginPage";
import AdminLayout from "../layouts/AdminLayout";
import PageNotFound from "../pages/PageNotFound";
import DashboardPage from "../features/dashboard/DashboardPage";
import CreateConfigurationPage from "../features/typing-exam/pages/CreateConfigurationPage";
import ConfigurationsPage from "../features/typing-exam/pages/ConfigurationPage";
import ExamsPage from "../features/typing-exam/pages/ExamPage";
import CreateExamPage from "../features/typing-exam/pages/CreateExamPage";

function AdminDashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
    </div>
  );
}

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
            index: true,
            path: "/dashboard",
            element: <DashboardPage />,
          },
          {
            path: "/typing-exam",
            element: <ExamsPage />,
          },
          {
            path: "/typing-exam/create",
            element: <CreateExamPage />,
          },
          {
            path: "/typing-exam/configurations",
            element: <ConfigurationsPage />,
          },
          {
            path: "/typing-exam/configurations/create",
            element: <CreateConfigurationPage />,
          },
          {
            path: "/typing-exam/configurations/:id/edit",
            element: <CreateConfigurationPage />,
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
