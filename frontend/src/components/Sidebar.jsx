import { LayoutDashboard, Users, ShoppingCart, HelpCircle, Truck } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const links = [
    { name: 'Dashboard', icon: <LayoutDashboard />, to: '/dashboard' },
    { name: 'Customers', icon: <Users />, to: '/customers' },
    { name: 'Suppliers', icon: <Truck />, to: '/suppliers' },
    { name: 'Products', icon: <ShoppingCart />, to: '/products' },
    { name: 'Help', icon: <HelpCircle />, to: '/help' },
  ];

  return (
    <div className="w-64 bg-[#FAFAFB] min-h-screen px-4 pt-6">
      <h1 className="text-2xl font-bold text-indigo-600 px-4 mb-8">Dashboard</h1>
      <nav className="space-y-2">
        {links.map(({ name, icon, to }) => (
          <NavLink
            key={name}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#5932EA] text-white'
                  : 'text-gray-600 hover:bg-indigo-50'
              }`
            }
          >
            {icon}
            {name}
          </NavLink>
        ))}
      </nav>

      {/* Optional Footer Profile Section */}
      <div className="flex items-center gap-3 mt-20 px-4">
        <img
          src="https://i.pravatar.cc/32?img=3"
          alt="Evano"
          className="w-8 h-8 rounded-full"
        />
        <div>
          <p className="text-sm font-semibold text-gray-800">Evano</p>
          <p className="text-xs text-gray-500">Project Manager</p>
        </div>
      </div>
    </div>
  );
}
