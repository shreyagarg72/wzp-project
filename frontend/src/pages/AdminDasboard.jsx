import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeCustomers: 0,
    pendingQuotes: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/admin/dashboard-stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Admin Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow p-4 rounded-xl">
          <h3 className="text-gray-600 text-sm">Total Orders</h3>
          <p className="text-2xl font-bold">{stats.totalOrders}</p>
        </div>
        <div className="bg-white shadow p-4 rounded-xl">
          <h3 className="text-gray-600 text-sm">Total Revenue</h3>
          <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white shadow p-4 rounded-xl">
          <h3 className="text-gray-600 text-sm">Active Customers</h3>
          <p className="text-2xl font-bold">{stats.activeCustomers}</p>
        </div>
        <div className="bg-white shadow p-4 rounded-xl">
          <h3 className="text-gray-600 text-sm">Pending Quotes</h3>
          <p className="text-2xl font-bold">{stats.pendingQuotes}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
