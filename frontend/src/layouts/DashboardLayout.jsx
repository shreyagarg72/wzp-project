// src/layouts/DashboardLayout.jsx
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Outlet } from 'react-router-dom';

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="p-6">
          <Outlet /> {/* Renders nested routes like Dashboard, Customers, etc. */}
        </main>
      </div>
    </div>
  );
}
