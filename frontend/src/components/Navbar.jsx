import React, { useState, useEffect } from 'react';
import { Bell, ChevronDown, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

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

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        const apiUrl = import.meta.env?.VITE_API_URL || 
                      window.REACT_APP_API_URL || 
                      'http://localhost:5000';
        
        // Call logout endpoint
        await fetch(`${apiUrl}/api/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Remove token from localStorage regardless of API call success
      localStorage.removeItem('token');
      
      // Redirect to login page
      navigate('/');
    }
  };

  const handleProfileClick = () => {
    setShowDropdown(false);
    navigate('/profile');
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-dropdown')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="flex justify-between items-center px-6 py-4 bg-white border-b">
      {/* Greeting with username */}
      <h2 className="text-lg font-semibold text-gray-800">
        {loading ? (
          <span className="animate-pulse">Hello User 👋</span>
        ) : user ? (
          `Hello ${user.username} 👋`
        ) : (
          'Hello Guest 👋'
        )}
      </h2>

      <div className="flex items-center gap-6">
        {/* Notification Bell */}
        <button className="relative">
          <Bell className="w-5 h-5 text-gray-500 hover:text-gray-700 transition-colors" />
          <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500" />
        </button>

        {/* Profile Dropdown */}
        <div className="relative profile-dropdown">
          <button 
            onClick={toggleDropdown}
            className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded-lg transition-colors"
          >
            {loading ? (
              <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
            ) : user ? (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(user.username)}`}>
                {getUserInitials(user.username)}
              </div>
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-500 text-sm">?</span>
              </div>
            )}
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md py-2 text-sm z-50 border">
              {user && (
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="font-medium text-gray-800">{user.username}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user.type === 'admin' ? 'Administrator' : 'Company Member'}
                  </p>
                </div>
              )}
              
              <button 
                onClick={handleProfileClick}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-red-600"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}