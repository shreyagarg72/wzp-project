import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, UserCheck, Monitor, ChevronLeft, ChevronRight } from 'lucide-react';

const Dashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [filterThisWeek, setFilterThisWeek] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 5; // Show 5 logs per page

  const userId = localStorage.getItem('userId'); // Make sure Sidebar sets this

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customerRes, supplierRes, inquiryRes, logsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/customers'),
          axios.get('http://localhost:5000/api/suppliers'),
          axios.get('http://localhost:5000/api/inquiries'),
          axios.get(`http://localhost:5000/api/activitylogs/user/${userId}`)
        ]);

        setCustomers(customerRes.data);
        setSuppliers(supplierRes.data);
        setInquiries(inquiryRes.data);
        setActivityLogs(logsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    if (userId) fetchData();
  }, [userId]);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterThisWeek]);

  const totalCustomers = customers.length;
  const totalSuppliers = suppliers.length;
  const activeInquiries = inquiries.filter(inq => inq.status !== 'Completed' && inq.status !== 'Fulfilled').length;

  const logsThisWeek = activityLogs.filter(log => {
    const logDate = new Date(log.timestamp);
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    return logDate >= sevenDaysAgo && logDate <= now;
  });

  const logsToShow = filterThisWeek ? logsThisWeek : activityLogs;
  
  // Calculate pagination
  const totalPages = Math.ceil(logsToShow.length / logsPerPage);
  const startIndex = (currentPage - 1) * logsPerPage;
  const endIndex = startIndex + logsPerPage;
  const currentLogs = logsToShow.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="flex-1 bg-gray-50 p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Customers */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Customers</p>
              <p className="text-2xl font-bold text-gray-800">{totalCustomers}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Suppliers */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Suppliers</p>
              <p className="text-2xl font-bold text-gray-800">{totalSuppliers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Active Inquiries */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Inquiries</p>
              <p className="text-2xl font-bold text-gray-800">{activeInquiries}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Monitor className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Logs */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Recent Activity Logs</h2>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={filterThisWeek}
              onChange={() => setFilterThisWeek(!filterThisWeek)}
              className="form-checkbox h-4 w-4 text-indigo-600"
            />
            Show only this week
          </label>
        </div>

        {logsToShow.length === 0 ? (
          <p className="text-sm text-gray-500">No activity logs found.</p>
        ) : (
          <>
            <ul className="divide-y divide-gray-200 text-sm">
              {currentLogs.map((log, index) => (
                <li key={log._id} className="py-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-gray-800">
                        <span className="inline-block w-6 h-6 bg-gray-100 rounded-full text-xs font-medium text-gray-600 text-center leading-6 mr-2">
                          {startIndex + index + 1}
                        </span>
                        <strong>{log.action}</strong> on <strong>{log.targetType}</strong>
                      </div>
                      {log.details && (
                        <div className="text-gray-600 text-xs mt-1 ml-8">
                          {Object.entries(log.details).map(([key, value]) => (
                            <div key={key}>
                              {key}: <span className="font-medium">{value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="text-gray-400 text-xs mt-1 ml-8">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, logsToShow.length)} of {logsToShow.length} entries
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-1 px-3 py-2 text-sm rounded-md ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 text-sm rounded-md ${
                          pageNum === currentPage
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-1 px-3 py-2 text-sm rounded-md ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;