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
//import { Users, UserPlus, UserCheck, TrendingUp, DollarSign, Award, BarChart3 } from 'lucide-react';
//import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  Package
} from "lucide-react";
import {
  TrendingUp,
  Users,
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
  UserCheck, Award,
} from "lucide-react";
const API_BASE_URL = import.meta.env.VITE_API_URL;
const COLORS = ["#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

const Orders = () => {
  const [recentOrders, setRecentOrders] = useState([]);
  const [delayedActions, setDelayedActions] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState({
    recentOrders: true,
    delayedActions: true,
    topProducts: true,
  });
  const [error, setError] = useState({
    recentOrders: null,
    delayedActions: null,
    topProducts: null,
  });

  useEffect(() => {
    fetchRecentOrders();
    fetchDelayedActions();
    fetchTopProducts();
  }, []);

  const fetchTopProducts = async () => {
    try {
      setLoading((prev) => ({ ...prev, topProducts: true }));
      setError((prev) => ({ ...prev, topProducts: null }));
      
      const res = await fetch(`${API_BASE_URL}/api/admin/top-products`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      console.log("Top products response:", data); // Debug log
      
      // Transform data for the chart
      const chartData = data.map((item) => ({
        name: item.name || item._id,
        quantity: item.totalQuantity,
        brand: item.brand,
        category: item.category
      }));
      
      setTopProducts(chartData);
    } catch (err) {
      console.error("Failed to load top products:", err);
      setError((prev) => ({ 
        ...prev, 
        topProducts: err.message 
      }));
    } finally {
      setLoading((prev) => ({ ...prev, topProducts: false }));
    }
  };

  const fetchRecentOrders = async () => {
    try {
      setLoading((prev) => ({ ...prev, recentOrders: true }));
      setError((prev) => ({ ...prev, recentOrders: null }));
      const res = await fetch(`http://localhost:5000/api/admin/orders/recent`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setRecentOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch recent orders:", err);
      setError((prev) => ({ ...prev, recentOrders: err.message }));
      setRecentOrders([]);
    } finally {
      setLoading((prev) => ({ ...prev, recentOrders: false }));
    }
  };

  const fetchDelayedActions = async () => {
    try {
      setLoading((prev) => ({ ...prev, delayedActions: true }));
      setError((prev) => ({ ...prev, delayedActions: null }));
      const res = await fetch(
        `http://localhost:5000/api/admin/orders/delayed-actions`
      );
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setDelayedActions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch delayed actions:", err);
      setError((prev) => ({ ...prev, delayedActions: err.message }));
      setDelayedActions([]);
    } finally {
      setLoading((prev) => ({ ...prev, delayedActions: false }));
    }
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-blue-600">
            Quantity: <span className="font-bold">{payload[0].value}</span>
          </p>
          {data.brand && (
            <p className="text-gray-600 text-sm">Brand: {data.brand}</p>
          )}
          {data.category && (
            <p className="text-gray-600 text-sm">Category: {data.category}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Orders Management
        </h1>
        <p className="text-gray-600">Manage and track all your orders here.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Products Chart */}
        <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center mb-6">
            <TrendingUp className="h-5 w-5 text-green-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Top Products Ordered
            </h2>
          </div>

          {loading.topProducts ? (
            <div className="animate-pulse">
              <div className="h-80 bg-gray-200 rounded-lg"></div>
            </div>
          ) : error.topProducts ? (
            <div className="text-center py-8 text-red-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-red-300" />
              <p className="text-sm">Failed to load top products</p>
              <p className="text-xs text-gray-400 mt-1">{error.topProducts}</p>
              <button 
                onClick={fetchTopProducts}
                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
              >
                Retry
              </button>
            </div>
          ) : topProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No product data available</p>
              <p className="text-xs text-gray-400 mt-1">
                Start processing orders to see top products
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={topProducts} 
                layout="vertical" 
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="quantity" 
                  fill="#4F46E5"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Delayed Actions */}
        <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center mb-6">
            <Clock className="h-5 w-5 text-orange-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Delayed Action Insights
            </h2>
          </div>

          {loading.delayedActions ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {delayedActions.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-300" />
                  <p className="text-sm">No delayed orders found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    All orders are processing on time
                  </p>
                </div>
              ) : (
                delayedActions.map((item, index) => {
                  const getStatusColor = (status) => {
                    if (!status)
                      return "bg-gray-100 border-gray-200 text-gray-800";

                    switch (status.toLowerCase()) {
                      case "pending":
                        return "bg-yellow-100 border-yellow-200 text-yellow-800";
                      case "processing":
                        return "bg-blue-100 border-blue-200 text-blue-800";
                      case "shipped":
                        return "bg-green-100 border-green-200 text-green-800";
                      case "delivered":
                        return "bg-purple-100 border-purple-200 text-purple-800";
                      default:
                        return "bg-gray-100 border-gray-200 text-gray-800";
                    }
                  };

                  const getUrgencyColor = (days) => {
                    if (!days || isNaN(days))
                      return "bg-gray-50 border-gray-200";
                    if (days >= 14) return "bg-red-50 border-red-200";
                    if (days >= 7) return "bg-orange-50 border-orange-200";
                    return "bg-yellow-50 border-yellow-200";
                  };

                  const getUrgencyIcon = (days) => {
                    if (!days || isNaN(days))
                      return <Clock className="h-4 w-4 text-gray-500" />;
                    if (days >= 14)
                      return <AlertTriangle className="h-4 w-4 text-red-500" />;
                    if (days >= 7)
                      return (
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                      );
                    return <Clock className="h-4 w-4 text-yellow-500" />;
                  };

                  return (
                    <div
                      key={`${item.status || "unknown"}-${index}`}
                      className={`p-4 rounded-lg border transition-all duration-200 ${getUrgencyColor(
                        item.avgDays
                      )}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          {getUrgencyIcon(item.avgDays)}
                          <span
                            className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              item.status
                            )}`}
                          >
                            {item.status || "Unknown"}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-2xl font-bold text-gray-900 mr-2">
                            {item.count || 0}
                          </span>
                          <span className="text-sm text-gray-500">orders</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">
                        <span className="font-medium">
                          {item.count || 0} orders
                        </span>{" "}
                        have been in "{item.status || "Unknown"}" status for
                        <span className="font-medium text-orange-600">
                          {" "}
                          {item.avgDays || 0} days
                        </span>{" "}
                        on average
                      </p>
                      <p className="text-xs text-gray-500">
                        Longest delay: {item.maxDays || 0} days | Shortest:{" "}
                        {item.minDays || 0} days
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center mb-6">
          <ShoppingCart className="h-5 w-5 text-blue-500 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">
            Recently Placed Orders
          </h2>
        </div>

        {loading.recentOrders ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No recent orders found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Order ID
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Inquiry ID
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Company Name
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                    <tr
                      key={order._id}
                      className="hover:bg-blue-50 transition-colors duration-200"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {order._id}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm text-gray-700">
                          {order.inquiryId || "N/A"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-900">
                          {order.companyName || "Unknown"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {order.status || "New"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;