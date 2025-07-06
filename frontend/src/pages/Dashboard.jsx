import React, { useState } from 'react';
import { Search, ChevronDown, Users, UserCheck, Monitor } from 'lucide-react';

const Dashboard = () => {
  const [sortBy, setSortBy] = useState('Newest');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sample customer data
  const customers = [
    {
      id: 1,
      customerName: "Jane Cooper",
      companyName: "Microsoft",
      email: "jane@microsoft.com",
      mobileNo: "(225) 555-0118",
      status: "Active"
    },
    {
      id: 2,
      customerName: "Floyd Miles",
      companyName: "Yahoo",
      email: "floyd@yahoo.com",
      mobileNo: "(205) 555-0100",
      status: "Inactive"
    },
    {
      id: 3,
      customerName: "Ronald Richards",
      companyName: "Adobe",
      email: "ronald@adobe.com",
      mobileNo: "(302) 555-0107",
      status: "Inactive"
    },
    {
      id: 4,
      customerName: "Marvin McKinney",
      companyName: "Tesla",
      email: "marvin@tesla.com",
      mobileNo: "(252) 555-0126",
      status: "Active"
    },
    {
      id: 5,
      customerName: "Jerome Bell",
      companyName: "Google",
      email: "jerome@google.com",
      mobileNo: "(629) 555-0129",
      status: "Active"
    },
    {
      id: 6,
      customerName: "Kathryn Murphy",
      companyName: "Microsoft",
      email: "kathryn@microsoft.com",
      mobileNo: "(406) 555-0120",
      status: "Active"
    },
    {
      id: 7,
      customerName: "Jacob Jones",
      companyName: "Yahoo",
      email: "jacob@yahoo.com",
      mobileNo: "(208) 555-0112",
      status: "Active"
    },
    {
      id: 8,
      customerName: "Kristin Watson",
      companyName: "Facebook",
      email: "kristin@facebook.com",
      mobileNo: "(704) 555-0127",
      status: "Inactive"
    }
  ];

  const filteredCustomers = customers.filter(customer =>
    customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCustomers = customers.filter(c => c.status === 'Active').length;
  const totalCustomers = customers.length;
  const membersCount = 1893;

  return (
    <div className="flex-1 bg-gray-50 p-6">
      {/* Header */}
    
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Customers</p>
              <p className="text-2xl font-bold text-gray-800">{totalCustomers.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">↑ 16% this month</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Members</p>
              <p className="text-2xl font-bold text-gray-800">{membersCount.toLocaleString()}</p>
              <p className="text-sm text-red-600 mt-1">↓ 1% this month</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Now</p>
              <p className="text-2xl font-bold text-gray-800">{activeCustomers}</p>
              <div className="flex -space-x-2 mt-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white"></div>
                <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white"></div>
                <div className="w-6 h-6 bg-yellow-500 rounded-full border-2 border-white"></div>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Monitor className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">All Customers</h2>
              <p className="text-sm text-green-600 mt-1">Active Members</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Newest">Newest</option>
                    <option value="Oldest">Oldest</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Customer Name</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Company Name</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Email</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Mobile No.</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 text-sm text-gray-800">{customer.customerName}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{customer.companyName}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{customer.email}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{customer.mobileNo}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                      customer.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing data 1 to 8 of {filteredCustomers.length} entries
          </p>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">‹</button>
            <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</button>
            <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">2</button>
            <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">3</button>
            <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">4</button>
            <span className="px-3 py-1 text-sm text-gray-500">...</span>
            <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">40</button>
            <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">›</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;