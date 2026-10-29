import { createBrowserRouter, Navigate } from "react-router-dom";

import GuestOnlyRoute from "../routes/GuestOnlyRoute";
import ProtectedAdminRoute from "../routes/ProtectedAdminRoute";
import AdminLoginPage from "../features/auth/AdminLoginPage";
import AdminLayout from "../layouts/AdminLayout";
import PageNotFound from "../pages/PageNotFound";
import DashboardPage from "../features/dashboard/DashboardPage";

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
        ],
      },
    ],
  },
  {
    path: "*",
    element: <PageNotFound />,
  },
]);
