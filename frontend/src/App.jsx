// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import DashboardLayout from "./layouts/DashboardLayout";
import Suppliers from "./pages/Suppliers";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Router>
      <AuthProvider> {/* ✅ Now useNavigate() works inside AuthContext */}
        <Routes>
          {/* Login Route (No Layout) */}
          <Route path="/" element={<LoginPage />} />

          {/* DashboardLayout wraps all sidebar-based routes */}
          <Route element={<DashboardLayout />}>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <Customers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/suppliers"
              element={
                <ProtectedRoute>
                  <Suppliers />
                </ProtectedRoute>
              }
            />
            {/* Add more routes as needed */}
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}
