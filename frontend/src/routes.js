import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/layout/Layout";
import PrivateRoute from "./components/common/PrivateRoute";
import AdminRoute from "./components/common/AdminRoute";

// Auth pages
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";

// Main pages
import Dashboard from "./pages/Dashboard";
import Currencies from "./pages/Currencies";
import Transactions from "./pages/Transactions";
import Alerts from "./pages/Alerts";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

// Admin pages
import AdminUsers from "./pages/Admin/Users";
import AdminAuditLogs from "./pages/Admin/AuditLogs";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      // Public routes
      { path: "/", element: <Login /> }, // Redirect to login page by default
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },

      // Protected routes
      {
        path: "dashboard",
        element: (
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        ),
      },
      {
        path: "currencies",
        element: (
          <PrivateRoute>
            <Currencies />
          </PrivateRoute>
        ),
      },
      {
        path: "transactions",
        element: (
          <PrivateRoute>
            <Transactions />
          </PrivateRoute>
        ),
      },
      {
        path: "alerts",
        element: (
          <PrivateRoute>
            <Alerts />
          </PrivateRoute>
        ),
      },
      {
        path: "analytics",
        element: (
          <PrivateRoute>
            <Analytics />
          </PrivateRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        ),
      },

      // Admin routes
      {
        path: "admin/users",
        element: (
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        ),
      },
      {
        path: "admin/audit-logs",
        element: (
          <AdminRoute>
            <AdminAuditLogs />
          </AdminRoute>
        ),
      },
    ],
  },
]);

export default router;
