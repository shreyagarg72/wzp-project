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

const API_BASE_URL = "http://localhost:5000";
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
          "http://localhost:5000/api/admin/order-status-summary"
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
          "http://localhost:5000/api/admin/weekly-inquiry-trend"
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
          "http://localhost:5000/api/admin/dashboard-stats"
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

// const Analytics = () => {
//   const [analyticsData, setAnalyticsData] = useState(null);
//   const [notifications, setNotifications] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [exportLoading, setExportLoading] = useState(false);
//   const [users, setUsers] = useState([]);
//   const [selectedUser, setSelectedUser] = useState("all");
//   const [userActivities, setUserActivities] = useState([]);
//   const [userPerformance, setUserPerformance] = useState(null);
//   const [activityLoading, setActivityLoading] = useState(false);
//   const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
//   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
//   const [showPerformance, setShowPerformance] = useState(false);
//   useEffect(() => {
//     fetchAnalyticsData();
//     fetchNotifications();
//   }, []);
// const fetchUsers = async () => {
//     try {
//       const response = await fetch("http://localhost:5000/api/admin/analytics/users");
//       const data = await response.json();
//       setUsers(data);
//       setLoading(false);
//     } catch (error) {
//       console.error("Error fetching users:", error);
//       setLoading(false);
//     }
//   };

//   // Fetch activities for selected user
//   const fetchUserActivities = async (userId, limit = 10) => {
//     if (userId === 'all') {
//       setUserActivities([]);
//       return;
//     }

//     setActivityLoading(true);
//     try {
//       const response = await fetch(
//         `http://localhost:5000/api/admin/analytics/user-activities/${userId}?limit=${limit}`
//       );
//       const data = await response.json();
//       setUserActivities(data.activities || []);
//     } catch (error) {
//       console.error("Error fetching user activities:", error);
//     }
//     setActivityLoading(false);
//   };

//   // Fetch user performance data
//   const fetchUserPerformance = async () => {
//     try {
//       const response = await fetch(
//         `http://localhost:5000/api/admin/analytics/user-performance?month=${selectedMonth}&year=${selectedYear}`
//       );
//       const data = await response.json();
//       setUserPerformance(data);
//     } catch (error) {
//       console.error("Error fetching user performance:", error);
//     }
//   };


//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   useEffect(() => {
//     if (selectedUser !== 'all') {
//       fetchUserActivities(selectedUser);
//     }
//   }, [selectedUser]);

//   useEffect(() => {
//     if (showPerformance) {
//       fetchUserPerformance();
//     }
//   }, [selectedMonth, selectedYear, showPerformance]);

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };
//   const fetchAnalyticsData = async () => {
//     try {
//       const response = await fetch(
//         "http://localhost:5000/api/admin/analytics/dashboard"
//       );
//       const data = await response.json();
//       setAnalyticsData(data);
//       setLoading(false);
//     } catch (error) {
//       console.error("Error fetching analytics:", error);
//       setLoading(false);
//     }
//   };

//   const fetchNotifications = async () => {
//     try {
//       const response = await fetch(
//         "http://localhost:5000/api/admin/analytics/notifications"
//       );
//       const data = await response.json();
//       setNotifications(data);
//     } catch (error) {
//       console.error("Error fetching notifications:", error);
//     }
//   };

//   const exportToExcel = async () => {
//     setExportLoading(true);
//     try {
//       const response = await fetch(
//         "http://localhost:5000/api/admin/analytics/export-excel",
//         {
//           method: "GET",
//         }
//       );

//       if (response.ok) {
//         const blob = await response.blob();
//         const url = window.URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = `analytics-report-${
//           new Date().toISOString().split("T")[0]
//         }.xlsx`;
//         document.body.appendChild(a);
//         a.click();
//         window.URL.revokeObjectURL(url);
//         document.body.removeChild(a);
//       } else {
//         throw new Error("Export failed");
//       }
//     } catch (error) {
//       console.error("Error exporting data:", error);
//       alert("Export failed. Please try again.");
//     }
//     setExportLoading(false);
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-96">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Product Availability Analysis */}
//       {/* Product Availability Analysis */}
//       <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
//         <div className="flex items-center justify-between mb-4">
//           <div className="flex items-center">
//             <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
//             <h2 className="text-lg font-semibold text-gray-900">
//               Product Availability Analysis
//             </h2>
//           </div>
//           {analyticsData?.productAnalysis?.availabilityRate && (
//             <div className="text-right">
//               <span className="text-sm text-gray-500">Availability Rate</span>
//               <p className="text-lg font-bold text-purple-600">
//                 {analyticsData.productAnalysis.availabilityRate}
//               </p>
//             </div>
//           )}
//         </div>

//         {analyticsData?.productAnalysis && (
//           <div className="space-y-4">
//             {/* Summary Stats */}
//             <div className="grid grid-cols-3 gap-4">
//               <div className="text-center p-4 bg-green-50 rounded-lg">
//                 <p className="text-2xl font-bold text-green-600">
//                   {analyticsData.productAnalysis.available}
//                 </p>
//                 <p className="text-sm text-green-700">Available</p>
//               </div>
//               <div className="text-center p-4 bg-red-50 rounded-lg">
//                 <p className="text-2xl font-bold text-red-600">
//                   {analyticsData.productAnalysis.unavailable}
//                 </p>
//                 <p className="text-sm text-red-700">Unavailable</p>
//               </div>
//               <div className="text-center p-4 bg-gray-50 rounded-lg">
//                 <p className="text-2xl font-bold text-gray-600">
//                   {analyticsData.productAnalysis.total}
//                 </p>
//                 <p className="text-sm text-gray-700">Total Products</p>
//               </div>
//             </div>

//             {/* Unavailable Products Details */}
//             {analyticsData.productAnalysis.unavailableDetails &&
//               analyticsData.productAnalysis.unavailableDetails.length > 0 && (
//                 <div className="mt-6">
//                   <h3 className="text-md font-medium text-gray-800 mb-3">
//                     Unavailable Products (
//                     {analyticsData.productAnalysis.unavailableDetails.length})
//                   </h3>
//                   <div className="max-h-60 overflow-y-auto space-y-2">
//                     {analyticsData.productAnalysis.unavailableDetails.map(
//                       (product, index) => (
//                         <div
//                           key={index}
//                           className="p-3 bg-red-50 border border-red-200 rounded-lg"
//                         >
//                           <div className="flex justify-between items-start">
//                             <div className="flex-1">
//                               <p className="font-medium text-gray-900">
//                                 {product.productName} - {product.brand}
//                               </p>
//                               <p className="text-sm text-gray-600">
//                                 Inquiry: {product.inquiryId}
//                               </p>
//                               <p className="text-sm text-red-600 mt-1">
//                                 {product.reason}
//                               </p>
//                             </div>
//                           </div>
//                         </div>
//                       )
//                     )}
//                   </div>
//                 </div>
//               )}
//           </div>
//         )}
//       </div>
//       {/* Notifications Panel */}
//       <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
//         <div className="flex items-center mb-4">
//           <Bell className="h-5 w-5 text-orange-600 mr-2" />
//           <h2 className="text-lg font-semibold text-gray-900">
//             Notifications & Alerts
//           </h2>
//         </div>

//         {notifications.length > 0 ? (
//           <div className="space-y-3">
//             {notifications.map((notification, index) => (
//               <div
//                 key={index}
//                 className={`p-4 rounded-lg border-l-4 ${
//                   notification.priority === "high"
//                     ? "bg-red-50 border-red-400"
//                     : notification.priority === "medium"
//                     ? "bg-yellow-50 border-yellow-400"
//                     : "bg-blue-50 border-blue-400"
//                 }`}
//               >
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <h3 className="font-medium text-gray-900">
//                       {notification.title}
//                     </h3>
//                     <p className="text-sm text-gray-600 mt-1">
//                       {notification.message}
//                     </p>
//                     <p className="text-xs text-gray-500 mt-2">
//                       {new Date(notification.createdAt).toLocaleDateString()}
//                     </p>
//                   </div>
//                   <span
//                     className={`px-2 py-1 text-xs rounded ${
//                       notification.priority === "high"
//                         ? "bg-red-100 text-red-800"
//                         : notification.priority === "medium"
//                         ? "bg-yellow-100 text-yellow-800"
//                         : "bg-blue-100 text-blue-800"
//                     }`}
//                   >
//                     {notification.priority}
//                   </span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="text-gray-500 text-center py-8">
//             No notifications at this time.
//           </p>
//         )}
//       </div>

//       {/* Recent Activity */}
//      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
//         <div className="flex items-center justify-between mb-6">
//           <div className="flex items-center">
//             <Activity className="h-5 w-5 text-blue-600 mr-2" />
//             <h2 className="text-lg font-semibold text-gray-900">
//               User Activity Management
//             </h2>
//           </div>
//           <div className="flex space-x-2">
//             <button
//               onClick={() => setShowPerformance(!showPerformance)}
//               className="flex items-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
//             >
//               <TrendingUp className="h-4 w-4 mr-1" />
//               Performance
//             </button>
//           </div>
//         </div>

//         {/* User Selection */}
//         <div className="mb-6">
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Select User
//           </label>
//           <select
//             value={selectedUser}
//             onChange={(e) => setSelectedUser(e.target.value)}
//             className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           >
//             <option value="all">All Users Overview</option>
//             {users.map((user) => (
//               <option key={user.userId} value={user.userId}>
//                 {user.username} ({user.totalActivities} activities)
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* Users Overview */}
//         {selectedUser === 'all' && (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
//             {users.map((user) => (
//               <div
//                 key={user.userId}
//                 className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
//                 onClick={() => setSelectedUser(user.userId)}
//               >
//                 <div className="flex items-center mb-2">
//                   <User className="h-4 w-4 text-gray-600 mr-2" />
//                   <h3 className="font-medium text-gray-900">{user.username}</h3>
//                 </div>
//                 <p className="text-sm text-gray-600 mb-2">{user.email}</p>
//                 <div className="flex justify-between text-xs text-gray-500">
//                   <span>Total: {user.totalActivities}</span>
//                   <span>Recent: {user.recentActivities}</span>
//                 </div>
//                 <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
//                   user.type === 'admin' 
//                     ? 'bg-purple-100 text-purple-800' 
//                     : 'bg-blue-100 text-blue-800'
//                 }`}>
//                   {user.type}
//                 </span>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* Selected User Activities */}
//         {selectedUser !== 'all' && (
//           <div>
//             {activityLoading ? (
//               <div className="animate-pulse space-y-3">
//                 {[1, 2, 3].map((i) => (
//                   <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
//                 ))}
//               </div>
//             ) : userActivities.length > 0 ? (
//               <div className="space-y-3">
//                 {userActivities.map((activity, index) => (
//                   <div
//                     key={index}
//                     className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
//                   >
//                     <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
//                       <Activity className="h-5 w-5 text-blue-600" />
//                     </div>
//                     <div className="ml-4 flex-1">
//                       <p className="text-sm font-medium text-gray-900">
//                         {activity.action}
//                       </p>
//                       {activity.targetType && (
//                         <p className="text-xs text-gray-600">
//                           Target: {activity.targetType}
//                         </p>
//                       )}
//                       <p className="text-xs text-gray-500">
//                         {formatDate(activity.timestamp)}
//                       </p>
//                     </div>
//                     {activity.details && Object.keys(activity.details).length > 0 && (
//                       <div className="ml-4 text-xs text-gray-600 max-w-xs">
//                         {JSON.stringify(activity.details).length > 50 
//                           ? JSON.stringify(activity.details).substring(0, 50) + '...'
//                           : JSON.stringify(activity.details)
//                         }
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <p className="text-gray-500 text-center py-8">
//                 No activities found for this user.
//               </p>
//             )}
//           </div>
//         )}
//       </div>

//       {/* Performance Dashboard */}
//       {showPerformance && userPerformance && (
//         <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
//           <div className="flex items-center justify-between mb-6">
//             <div className="flex items-center">
//               <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
//               <h2 className="text-lg font-semibold text-gray-900">
//                 User Performance - {userPerformance.period.monthName} {userPerformance.period.year}
//               </h2>
//             </div>
//             <div className="flex space-x-2">
//               <select
//                 value={selectedMonth}
//                 onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
//                 className="px-3 py-1 border border-gray-300 rounded text-sm"
//               >
//                 {Array.from({ length: 12 }, (_, i) => (
//                   <option key={i + 1} value={i + 1}>
//                     {new Date(2024, i).toLocaleString('default', { month: 'long' })}
//                   </option>
//                 ))}
//               </select>
//               <select
//                 value={selectedYear}
//                 onChange={(e) => setSelectedYear(parseInt(e.target.value))}
//                 className="px-3 py-1 border border-gray-300 rounded text-sm"
//               >
//                 {Array.from({ length: 3 }, (_, i) => (
//                   <option key={i} value={new Date().getFullYear() - i}>
//                     {new Date().getFullYear() - i}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           {/* Performance Summary */}
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//             <div className="bg-blue-50 p-4 rounded-lg">
//               <h3 className="text-sm font-medium text-blue-800">Total Users</h3>
//               <p className="text-2xl font-bold text-blue-900">{userPerformance.summary.totalUsers}</p>
//             </div>
//             <div className="bg-green-50 p-4 rounded-lg">
//               <h3 className="text-sm font-medium text-green-800">Total Activities</h3>
//               <p className="text-2xl font-bold text-green-900">{userPerformance.summary.totalActivities}</p>
//             </div>
//             <div className="bg-purple-50 p-4 rounded-lg">
//               <h3 className="text-sm font-medium text-purple-800">Avg per User</h3>
//               <p className="text-2xl font-bold text-purple-900">{userPerformance.summary.averageActivitiesPerUser}</p>
//             </div>
//             <div className="bg-orange-50 p-4 rounded-lg">
//               <h3 className="text-sm font-medium text-orange-800">Top Performer</h3>
//               <p className="text-lg font-bold text-orange-900">{userPerformance.summary.mostActiveUser}</p>
//             </div>
//           </div>

//           {/* User Performance List */}
//           <div className="space-y-3">
//             {userPerformance.userPerformance.map((userStats, index) => (
//               <div
//                 key={userStats.user.userId}
//                 className={`p-4 rounded-lg border-2 ${
//                   index === 0 ? 'border-gold-300 bg-yellow-50' : 
//                   index === 1 ? 'border-silver-300 bg-gray-50' : 
//                   index === 2 ? 'border-bronze-300 bg-orange-50' : 
//                   'border-gray-200 bg-white'
//                 }`}
//               >
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center">
//                     <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
//                       index === 0 ? 'bg-yellow-200 text-yellow-800' :
//                       index === 1 ? 'bg-gray-200 text-gray-800' :
//                       index === 2 ? 'bg-orange-200 text-orange-800' :
//                       'bg-blue-100 text-blue-800'
//                     }`}>
//                       #{index + 1}
//                     </div>
//                     <div className="ml-3">
//                       <h3 className="font-medium text-gray-900">{userStats.user.username}</h3>
//                       <p className="text-sm text-gray-600">{userStats.user.email}</p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-2xl font-bold text-gray-900">{userStats.totalActivities}</p>
//                     <p className="text-sm text-gray-600">{userStats.averageActivitiesPerDay}/day avg</p>
//                   </div>
//                 </div>
                
//                 {/* Activity Breakdown */}
//                 {Object.keys(userStats.activityBreakdown).length > 0 && (
//                   <div className="mt-3 pt-3 border-t border-gray-200">
//                     <div className="flex flex-wrap gap-2">
//                       {Object.entries(userStats.activityBreakdown).map(([action, count]) => (
//                         <span
//                           key={action}
//                           className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
//                         >
//                           {action}: {count}
//                         </span>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div> )}
//     </div>
//   );
// };
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
