import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, ShoppingCart, HelpCircle, Truck, FileText } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const links = [
    { name: 'Dashboard', icon: <LayoutDashboard />, to: '/dashboard' },
    { name: 'Customers', icon: <Users />, to: '/customers' },
    { name: 'Suppliers', icon: <Truck />, to: '/suppliers' },
    { name: 'SendQuote', icon: <FileText />, to: '/respond-customer' },
    { name: 'Products', icon: <ShoppingCart />, to: '/products' },
  ];

  // Fetch user data from backend
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Token from localStorage:', token); // Debug log
        
        if (!token) {
          console.log('No token found in localStorage');
          setLoading(false);
          return;
        }

        // Use environment variable with fallback, or just use the fallback directly
        const apiUrl = import.meta.env?.VITE_API_URL || 
                      window.REACT_APP_API_URL || 
                      'http://localhost:5000';
        
        const response = await fetch(`${apiUrl}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Response status:', response.status); // Debug log
        console.log('Response ok:', response.ok); // Debug log

        if (response.ok) {
          const userData = await response.json();
          console.log('User data received:', userData); // Debug log
          setUser(userData);
          localStorage.setItem("userId", userData.id);
        } else {
          const errorData = await response.text();
          console.error('API Error:', response.status, errorData);
          
          // Only remove token if it's actually expired/invalid (401)
          if (response.status === 401) {
            localStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const getUserInitials = (username) => {
    if (!username) return 'U';
    const names = username.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return username[0];
  };

  const getAvatarColor = (username) => {
    if (!username) return 'bg-gray-500';
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="w-64 bg-[#FAFAFB] min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-indigo-600 px-4">WZP</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {links.map(({ name, icon, to }) => (
          <NavLink
            key={name}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#5932EA] text-white shadow-lg'
                  : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
              }`
            }
          >
            <span className="text-lg">{icon}</span>
            {name}
          </NavLink>
        ))}
      </nav>

      {/* Simple User Display at Bottom */}
      <div className="px-4 pb-6">
        {loading ? (
          <div className="animate-pulse">
            <div className="flex items-center gap-3 p-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          </div>
        ) : user ? (
          <div className="flex items-center gap-3 p-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(user.username)}`}>
              {getUserInitials(user.username)}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{user.username}</p>
              <p className="text-xs text-gray-500 capitalize">
                {user.type === 'admin' ? 'Administrator' : 'Company Member'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-500 text-sm">?</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Guest</p>
              <p className="text-xs text-gray-500">Not logged in</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}