import React, { useEffect, useState } from 'react';
import axios from 'axios';
const API_BASE_URL = 'http://localhost:5000';

export default function InquiryList() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_BASE_URL}/api/inquiries`);
      const filtered = res.data.filter(
        (inq) => inq.status === 'Open' || inq.status === 'Processing'
      );
      setInquiries(filtered);
    } catch (err) {
      console.error('Error fetching inquiries:', err);
      setError('Failed to fetch inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Inquiry List</h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>
      )}

      {loading ? (
        <div className="text-center text-gray-500">Loading inquiries...</div>
      ) : inquiries.length === 0 ? (
        <div className="text-gray-500">No open or processing inquiries available.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Inquiry ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Expected Delivery</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {inquiries.map((inquiry) => (
                <tr key={inquiry._id} className="hover:bg-gray-50 transition-all">
                  <td className="px-4 py-3">{inquiry.inquiryId || 'N/A'}</td>
                  <td className="px-4 py-3">{inquiry.customerId?.companyName || 'N/A'}</td>
                  <td className="px-4 py-3">
                    {inquiry.expectedDelivery ? new Date(inquiry.expectedDelivery).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3 font-medium">{inquiry.status}</td>
                  <td className="px-4 py-3">
                    {inquiry.status === 'Open' ? (
                      <button
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        onClick={() => alert(`Send Quote for ${inquiry.inquiryId}`)}
                      >
                        Send Quote
                      </button>
                    ) : (
                      <button
                        className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600"
                        onClick={() => alert(`Update Quote for ${inquiry.inquiryId}`)}
                      >
                        Update Inquiry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}