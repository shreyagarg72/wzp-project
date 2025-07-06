import { Bell, ChevronDown } from 'lucide-react';

export default function Navbar() {
  return (
    <div className="flex justify-between items-center px-6 py-4 bg-white border-b">
      {/* Greeting or Page Title */}
      <h2 className="text-lg font-semibold text-gray-800">Hello Evano 👋</h2>

      <div className="flex items-center gap-6">
        {/* Notification Bell */}
        <button className="relative">
          <Bell className="w-5 h-5 text-gray-500" />
          <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500" />
        </button>

        {/* Profile Dropdown */}
        <div className="relative group">
          <button className="flex items-center gap-2">
            <img
              src="https://i.pravatar.cc/32"
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
            />
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
          <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-md p-2 text-sm hidden group-hover:block z-50">
            <a href="#" className="block px-3 py-2 hover:bg-gray-100">Profile</a>
            <a href="#" className="block px-3 py-2 hover:bg-gray-100">Logout</a>
          </div>
        </div>
      </div>
    </div>
  );
}
