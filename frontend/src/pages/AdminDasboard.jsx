import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

import { Package, User } from "lucide-react";
import {
  TrendingUp,
  Users,
  Download,
  XCircle,
  Search,
  Bell,
  Calendar,
  FileSpreadsheet,
  DollarSign,
  Activity,
  BarChart3,
  Settings,
  Clock,
  ShoppingCart,
  FileText,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  UserPlus,
  UserCheck,
  Award,
} from "lucide-react";

import Orders from "../components/admin/Orders";
import Customers from "../components/admin/Customers";
import Analytics from "../components/admin/Analytics";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const COLORS = ["#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

const StatCard = ({ title, value, icon: Icon, color, loading }) => (
  <div className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 p-6 rounded-2xl border border-gray-100 hover:border-gray-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
        {loading ? (
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
        ) : (
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
);

const OrderStatusChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="_id"
          cx="50%"
          cy="50%"
          outerRadius={90}
          innerRadius={40}
          paddingAngle={5}
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

const WeeklyInquiriesChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="_id"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#6b7280", fontSize: 12 }}
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#6b7280", fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#3B82F6"
          strokeWidth={3}
          dot={{ fill: "#3B82F6", strokeWidth: 2, r: 5 }}
          activeDot={{ r: 7, fill: "#1D4ED8" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeCustomers: 0,
    pendingQuotes: 0,
  });
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [weeklyInquiryData, setWeeklyInquiryData] = useState([]);
  const [loading, setLoading] = useState({
    stats: true,
    orderStatus: true,
    weeklyInquiry: true,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderStatus = async () => {
      try {
        setLoading((prev) => ({ ...prev, orderStatus: true }));
        const res = await fetch(
          `${API_BASE_URL}/api/admin/order-status-summary`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setOrderStatusData(data);
      } catch (err) {
        console.error("Failed to fetch order status:", err);
        setError("Failed to load order status data");
      } finally {
        setLoading((prev) => ({ ...prev, orderStatus: false }));
      }
    };

    const fetchWeeklyInquiries = async () => {
      try {
        setLoading((prev) => ({ ...prev, weeklyInquiry: true }));
        const res = await fetch(
         `${API_BASE_URL}/api/admin/weekly-inquiry-trend`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setWeeklyInquiryData(data);
      } catch (err) {
        console.error("Failed to fetch weekly inquiries:", err);
        setError("Failed to load weekly inquiry data");
      } finally {
        setLoading((prev) => ({ ...prev, weeklyInquiry: false }));
      }
    };

    const fetchStats = async () => {
      try {
        setLoading((prev) => ({ ...prev, stats: true }));
        const res = await fetch(
           `${API_BASE_URL}/api/admin/dashboard-stats`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
        setError("Failed to load dashboard statistics");
      } finally {
        setLoading((prev) => ({ ...prev, stats: false }));
      }
    };

    fetchOrderStatus();
    fetchWeeklyInquiries();
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Overview</h1>
        <p className="text-gray-600">
          Welcome back! Here's what's happening with your business today.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          icon={FileText}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          loading={loading.stats}
        />
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="bg-gradient-to-r from-green-500 to-green-600"
          loading={loading.stats}
        />
        <StatCard
          title="Active Customers"
          value={stats.activeCustomers.toLocaleString()}
          icon={Users}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
          loading={loading.stats}
        />
        <StatCard
          title="Pending Quotes"
          value={stats.pendingQuotes.toLocaleString()}
          icon={Activity}
          color="bg-gradient-to-r from-orange-500 to-orange-600"
          loading={loading.stats}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Order Status Distribution
            </h3>
          </div>
          <OrderStatusChart
            data={orderStatusData}
            loading={loading.orderStatus}
          />
        </div>

        <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center mb-4">
            <Activity className="h-5 w-5 text-green-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Weekly Inquiries Trend
            </h3>
          </div>
          <WeeklyInquiriesChart
            data={weeklyInquiryData}
            loading={loading.weeklyInquiry}
          />
        </div>
      </div>
    </div>
  );
};

<Analytics/>

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const tabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      component: Dashboard,
    },
    { id: "orders", label: "Orders", icon: ShoppingCart, component: Orders },
    {
      id: "customers",
      label: "Customers",
      icon: UserCheck,
      component: Customers,
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: TrendingUp,
      component: Analytics,
    },
  ];

  const ActiveComponent =
    tabs.find((tab) => tab.id === activeTab)?.component || Dashboard;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-200">
            <nav className="flex space-x-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-blue-500 text-white shadow-lg scale-105"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
