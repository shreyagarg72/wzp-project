import React, { useEffect, useState } from "react";
import axios from "axios";
const API_BASE_URL = "http://localhost:5000";

const SendQuotesPage = () => {
  const [inquiries, setInquiries] = useState([]);
  const [marginMap, setMarginMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        setLoading(true);
        
        // Get token from localStorage (adjust this based on how you store your auth token)
        const token = localStorage.getItem('token');
        
        const response = await axios.get(
          `${API_BASE_URL}/api/completedquote`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        console.log('Fetched inquiries:', response.data);
        setInquiries(response.data);
        setError(null);
      } catch (err) {
        console.error("Error loading inquiries:", err);
        setError(err.response?.data?.error || err.message);
        
        // If it's a 404, the route doesn't exist
        if (err.response?.status === 404) {
          setError("The completed inquiries endpoint is not available. Please check your backend routes.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInquiries();
  }, []);

  const handleMarginChange = (inquiryId, productId, margin) => {
    setMarginMap(prev => ({
      ...prev,
      [inquiryId + productId]: margin
    }));
  };

  const calculatePrice = (basePrice, margin) => {
    return basePrice + (basePrice * (margin || 0) / 100);
  };

  const sendResponse = (inquiry) => {
    // You can replace with actual email/send logic
    alert(`Sending response for Inquiry ID: ${inquiry.inquiryId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Send Quotations</h1>
            <p className="text-gray-600">Loading inquiries...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
              <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Send Quotations
            </h1>
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    <strong>Error:</strong> {error}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (inquiries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
              <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Send Quotations
            </h1>
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-lg">No completed inquiries found.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
            <svg className="w-10 h-10 text-blue-600 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Send Quotations
          </h1>
          <p className="text-gray-600 text-lg">Review and send quotations to customers</p>
        </div>

        <div className="space-y-8">
          {inquiries.map(inquiry => (
            <div key={inquiry._id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Inquiry #{inquiry.inquiryId}</h2>
                    <p className="text-blue-100 mt-1">
                      <span className="inline-flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {inquiry.customer?.companyName || "N/A"}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="bg-white bg-opacity-20 rounded-lg px-3 py-2">
                      <p className="text-white text-sm font-medium">Products</p>
                      <p className="text-white text-xl font-bold">{inquiry.products?.length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specifications</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin %</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">Final Price</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {inquiry.products?.map((product, index) => {
                        const supplierQuote = inquiry.supplierQuotes?.flatMap(s => s.quotes)?.find(q => q.productId === product.productId?.toString());
                        const basePrice = supplierQuote?.price || 0;
                        const expectedDelivery = supplierQuote?.expectedDelivery || inquiry.expectedDelivery;
                        const margin = parseFloat(marginMap[inquiry._id + product.productId] || 0);
                        const finalPrice = calculatePrice(basePrice, margin);

                        return (
                          <tr key={product.productId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{product.brand}</div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900 max-w-xs truncate" title={product.specifications}>
                                {product.specifications}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {product.quantity}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {expectedDelivery ? new Date(expectedDelivery).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">₹{basePrice.toFixed(2)}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <input
                                  type="number"
                                  className="w-20 px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                  value={margin}
                                  onChange={e => handleMarginChange(inquiry._id, product.productId, e.target.value)}
                                  placeholder="0"
                                />
                                <span className="ml-1 text-sm text-gray-500">%</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-green-600">₹{finalPrice.toFixed(2)}</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Total and Action */}
                <div className="mt-6 flex items-center justify-between bg-gray-50 rounded-lg p-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-500">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{
                        inquiry.products?.reduce((sum, product) => {
                          const quote = inquiry.supplierQuotes?.flatMap(s => s.quotes)?.find(q => q.productId === product.productId?.toString());
                          const base = quote?.price || 0;
                          const margin = parseFloat(marginMap[inquiry._id + product.productId] || 0);
                          return sum + calculatePrice(base, margin);
                        }, 0).toFixed(2)
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => sendResponse(inquiry)}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Response to Company
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SendQuotesPage;