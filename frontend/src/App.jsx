// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import DashboardLayout from './layouts/DashboardLayout';
import Suppliers from './pages/Suppliers';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Login Route (No Layout) */}
        <Route path="/" element={<LoginPage />} />

        {/* DashboardLayout wraps all sidebar-based routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/suppliers" element={<Suppliers />} />
          {/* Add more like /suppliers, /products, etc. here */}
        </Route>
      </Routes>
    </Router>
  );
}
