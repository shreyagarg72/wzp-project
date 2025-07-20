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
  UserPlus,
  UserCheck, Award,
} from "lucide-react";
const Customers = () => {
  const [topCustomers, setTopCustomers] = useState([]);
  const [customerCLV, setCustomerCLV] = useState({
    customers: [],
    summary: {
      totalRevenue: 0,
      avgCLV: 0,
      customersWithOrders: 0,
      customersWithoutOrders: 0,
      topCustomerRevenue: 0,
      topCustomerPercentage: 0
    },
    clvDistribution: {
      high: 0,
      medium: 0,
      low: 0,
      minimal: 0,
      zero: 0
    }
  });

  const [loading, setLoading] = useState({
    topCustomers: true,
    customerSegmentation: true,
    customerCLV: true,
  });
  const [error, setError] = useState({
    topCustomers: null,
    customerSegmentation: null,
    customerCLV: null,
  });

  const [customerSegmentation, setCustomerSegmentation] = useState({
    newCustomers: 0,
    repeatCustomers: 0,
    totalCustomers: 0,
    newCustomerPercentage: 0,
    repeatCustomerPercentage: 0,
  });

  useEffect(() => {
    fetchTopCustomers();
    fetchCustomerSegmentation();
    fetchCustomerCLV();
  }, []);

  const fetchCustomerCLV = async () => {
    try {
      setLoading((prev) => ({ ...prev, customerCLV: true }));
      setError((prev) => ({ ...prev, customerCLV: null }));
      const res = await fetch(`http://localhost:5000/api/admin/customer-lifetime-value`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setCustomerCLV(data);
    } catch (err) {
      console.error("Failed to fetch customer CLV:", err);
      setError((prev) => ({ ...prev, customerCLV: err.message }));
    } finally {
      setLoading((prev) => ({ ...prev, customerCLV: false }));
    }
  };

  const fetchCustomerSegmentation = async () => {
    try {
      setLoading((prev) => ({ ...prev, customerSegmentation: true }));
      setError((prev) => ({ ...prev, customerSegmentation: null }));
      const res = await fetch(`http://localhost:5000/api/admin/customer-segmentation`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setCustomerSegmentation(data);
    } catch (err) {
      console.error("Failed to fetch customer segmentation:", err);
      setError((prev) => ({ ...prev, customerSegmentation: err.message }));
      setCustomerSegmentation({
        newCustomers: 0,
        repeatCustomers: 0,
        totalCustomers: 0,
        newCustomerPercentage: 0,
        repeatCustomerPercentage: 0,
      });
    } finally {
      setLoading((prev) => ({ ...prev, customerSegmentation: false }));
    }
  };

  const fetchTopCustomers = async () => {
    try {
      setLoading((prev) => ({ ...prev, topCustomers: true }));
      setError((prev) => ({ ...prev, topCustomers: null }));
      const res = await fetch(`http://localhost:5000/api/admin/top-customers`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setTopCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch top customers:", err);
      setError((prev) => ({ ...prev, topCustomers: err.message }));
      setTopCustomers([]);
    } finally {
      setLoading((prev) => ({ ...prev, topCustomers: false }));
    }
  };

  // Prepare data for CLV bar chart
  const clvChartData = customerCLV.customers.slice(0, 8).map(customer => ({
    name: customer.companyName?.length > 15 ? customer.companyName.substring(0, 15) + '...' : customer.companyName,
    revenue: customer.totalRevenue,
    orders: customer.totalOrders
  }));

  // Prepare data for CLV distribution pie chart
  const clvDistributionData = [
    { name: 'High (₹1L+)', value: customerCLV.clvDistribution.high, color: '#10B981' },
    { name: 'Medium (₹50K-1L)', value: customerCLV.clvDistribution.medium, color: '#3B82F6' },
    { name: 'Low (₹10K-50K)', value: customerCLV.clvDistribution.low, color: '#F59E0B' },
    { name: 'Minimal (<₹10K)', value: customerCLV.clvDistribution.minimal, color: '#EF4444' },
    { name: 'No Orders', value: customerCLV.clvDistribution.zero, color: '#6B7280' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* CLV Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Total Revenue</p>
              <p className="text-2xl font-bold text-green-700">
                ₹{customerCLV.summary.totalRevenue?.toLocaleString() || 0}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Avg CLV</p>
              <p className="text-2xl font-bold text-blue-700">
                ₹{customerCLV.summary.avgCLV?.toLocaleString() || 0}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-800">Top Customer Share</p>
              <p className="text-2xl font-bold text-orange-700">
                {customerCLV.summary.topCustomerPercentage?.toFixed(1) || 0}%
              </p>
            </div>
            <Award className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Customer Lifetime Value Chart */}
        <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center mb-6">
            <BarChart3 className="h-5 w-5 text-purple-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Customer Lifetime Value
            </h2>
          </div>

          {loading.customerCLV ? (
            <div className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clvChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    labelFormatter={(label) => `Customer: ${label}`}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="url(#colorGradient)" 
                    radius={[4, 4, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* CLV Distribution */}
        <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center mb-6">
            <Users className="h-5 w-5 text-purple-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Customer Value Distribution
            </h2>
          </div>

          {loading.customerCLV ? (
            <div className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clvDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {clvDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [value, 'Customers']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Customers by Revenue List */}
        <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center mb-6">
            <Users className="h-5 w-5 text-purple-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Top Customers by CLV
            </h2>
          </div>

          {loading.customerCLV ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {customerCLV.customers.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Users className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No customer data available</p>
                </div>
              ) : (
                customerCLV.customers.map((customer, index) => (
                  <div
                    key={customer.customerId}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100 hover:border-purple-200 transition-all duration-200"
                  >
                    <div className="flex items-center">
                      <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {customer.companyName || 'N/A'}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {customer.totalOrders} orders • {customer.revenuePercentage}% of total
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-purple-600 font-bold text-sm">
                        ₹{customer.totalRevenue.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        Avg: ₹{Math.round(customer.avgOrderValue).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Customer Segmentation */}
        <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center mb-6">
            <Users className="h-5 w-5 text-purple-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Repeat Customers vs New Customers
            </h2>
          </div>

          {loading.customerSegmentation ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Visual Chart Representation */}
              <div className="relative">
                <div className="flex rounded-lg overflow-hidden bg-gray-100 h-8">
                  <div
                    className="bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-white text-xs font-medium"
                    style={{
                      width: `${customerSegmentation.newCustomerPercentage}%`,
                    }}
                  >
                    {customerSegmentation.newCustomerPercentage > 15 &&
                      `${customerSegmentation.newCustomerPercentage.toFixed(1)}%`}
                  </div>
                  <div
                    className="bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium"
                    style={{
                      width: `${customerSegmentation.repeatCustomerPercentage}%`,
                    }}
                  >
                    {customerSegmentation.repeatCustomerPercentage > 15 &&
                      `${customerSegmentation.repeatCustomerPercentage.toFixed(1)}%`}
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center mb-2">
                    <UserPlus className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">
                      New Customers
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    {customerSegmentation.newCustomers}
                  </div>
                  <div className="text-sm text-green-600">
                    {customerSegmentation.newCustomerPercentage.toFixed(1)}% of total
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center mb-2">
                    <UserCheck className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-800">
                      Repeat Customers
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-blue-700">
                    {customerSegmentation.repeatCustomers}
                  </div>
                  <div className="text-sm text-blue-600">
                    {customerSegmentation.repeatCustomerPercentage.toFixed(1)}% of total
                  </div>
                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="text-sm font-medium text-purple-800">
                      Total Customers
                    </span>
                  </div>
                  <div className="text-xl font-bold text-purple-700">
                    {customerSegmentation.totalCustomers}
                  </div>
                </div>
              </div>

              {/* Insights */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  Customer Loyalty Insights
                </h3>
                <div className="text-xs text-gray-600 space-y-1">
                  {customerSegmentation.repeatCustomerPercentage > 30 ? (
                    <p className="text-green-600">
                      ✓ Strong customer retention - {customerSegmentation.repeatCustomerPercentage.toFixed(1)}% are repeat customers
                    </p>
                  ) : customerSegmentation.repeatCustomerPercentage > 15 ? (
                    <p className="text-orange-600">
                      ⚠ Moderate retention - Room for improvement in customer loyalty
                    </p>
                  ) : (
                    <p className="text-red-600">
                      ⚠ Low retention - Focus on customer satisfaction and follow-up
                    </p>
                  )}
                  <p>
                    New customers represent {customerSegmentation.newCustomerPercentage.toFixed(1)}% of your customer base
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Customers;