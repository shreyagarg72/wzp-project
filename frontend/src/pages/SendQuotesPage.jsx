import React, { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:5000";

const SendQuotesPage = () => {
  const [inquiries, setInquiries] = useState([]);
  const [marginMap, setMarginMap] = useState({});
  const [deliveryCharges, setDeliveryCharges] = useState({});
  const [gstRates, setGstRates] = useState({}); // Changed to per-inquiry GST rates
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        setLoading(true);
        
        // Get token from localStorage (adjust this based on how you store your auth token)
        const token = localStorage.getItem('token');
        
        const response = await fetch(
          `${API_BASE_URL}/api/completedquote`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Fetched inquiries:', data);
        setInquiries(data);
        
        // Initialize GST rates with default 18% for each inquiry
        const initialGstRates = {};
        data.forEach(inquiry => {
          initialGstRates[inquiry._id] = 18;
        });
        setGstRates(initialGstRates);
        
        setError(null);
      } catch (err) {
        console.error("Error loading inquiries:", err);
        setError(err.message);
        
        // If it's a 404, the route doesn't exist
        if (err.message.includes('404')) {
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

  const handleDeliveryChargeChange = (inquiryId, charges) => {
    setDeliveryCharges(prev => ({
      ...prev,
      [inquiryId]: charges
    }));
  };

  const handleGstRateChange = (inquiryId, rate) => {
    setGstRates(prev => ({
      ...prev,
      [inquiryId]: parseFloat(rate) || 0
    }));
  };

  const calculatePrice = (basePrice, margin) => {
    return basePrice + (basePrice * (margin || 0) / 100);
  };

  const calculateTotals = (inquiry) => {
    const subtotal = inquiry.products?.reduce((sum, product) => {
      const quote = inquiry.supplierQuotes?.flatMap(s => s.quotes)?.find(q => q.productId === product.productId?.toString());
      const base = quote?.price || 0;
      const margin = parseFloat(marginMap[inquiry._id + product.productId] || 0);
      return sum + calculatePrice(base, margin);
    }, 0) || 0;

    const delivery = parseFloat(deliveryCharges[inquiry._id] || 0);
    const gstRate = gstRates[inquiry._id] || 18;
    const gstAmount = (subtotal + delivery) * (gstRate / 100);
    const total = subtotal + delivery + gstAmount;

    return { subtotal, delivery, gstAmount, total, gstRate };
  };

  const sendResponse = (inquiry) => {
    // You can replace with actual email/send logic
    alert(`Sending response for Inquiry ID: ${inquiry.inquiryId}`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Send Quotations</h1>
            <p className="text-gray-600">Loading inquiries...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Send Quotations</h1>
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-700"><strong>Error:</strong> {error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (inquiries.length === 0) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Send Quotations</h1>
            <div className="text-center py-8">
              <p className="text-gray-500">No completed inquiries found.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Send Quotations</h1>
          <p className="text-gray-600">Review and send quotations to customers</p>
        </div>

        <div className="space-y-6">
          {inquiries.map(inquiry => {
            const { subtotal, delivery, gstAmount, total, gstRate } = calculateTotals(inquiry);
            
            return (
              <div key={inquiry._id} className="bg-white border rounded-lg">
                {/* Header */}
                <div className="bg-blue-600 text-white p-4 rounded-t-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold">Inquiry #{inquiry.inquiryId}</h2>
                      <p className="text-blue-100">{inquiry.customer?.companyName || "N/A"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">Products: {inquiry.products?.length || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Products Table */}
                <div className="p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Product</th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Brand</th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Specifications</th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Qty</th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Delivery</th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Base Price</th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Margin %</th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Final Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inquiry.products?.map((product, index) => {
                          const supplierQuote = inquiry.supplierQuotes?.flatMap(s => s.quotes)?.find(q => q.productId === product.productId?.toString());
                          const basePrice = supplierQuote?.price || 0;
                          const expectedDelivery = supplierQuote?.expectedDelivery || inquiry.expectedDelivery;
                          const margin = parseFloat(marginMap[inquiry._id + product.productId] || 0);
                          const finalPrice = calculatePrice(basePrice, margin);

                          return (
                            <tr key={product.productId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="border border-gray-300 px-3 py-2 text-sm">{product.name}</td>
                              <td className="border border-gray-300 px-3 py-2 text-sm">{product.brand}</td>
                              <td className="border border-gray-300 px-3 py-2 text-sm max-w-xs truncate" title={product.specifications}>
                                {product.specifications}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-sm">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                  {product.quantity}
                                </span>
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-sm">
                                {expectedDelivery ? new Date(expectedDelivery).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-sm font-medium">₹{basePrice.toFixed(2)}</td>
                              <td className="border border-gray-300 px-3 py-2">
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                    value={margin}
                                    onChange={e => handleMarginChange(inquiry._id, product.productId, e.target.value)}
                                    placeholder="0"
                                  />
                                  <span className="ml-1 text-sm text-gray-500">%</span>
                                </div>
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-sm font-bold text-green-600">₹{finalPrice.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Delivery Charges, GST Rate, and Total Calculation */}
                  <div className="mt-6 bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Delivery Charges Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Charges</label>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-2">₹</span>
                          <input
                            type="number"
                            value={deliveryCharges[inquiry._id] || ''}
                            onChange={(e) => handleDeliveryChargeChange(inquiry._id, e.target.value)}
                            className="w-32 px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>

                      {/* GST Rate Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">GST Rate (%)</label>
                        <input
                          type="number"
                          value={gstRates[inquiry._id] || ''}
                          onChange={(e) => handleGstRateChange(inquiry._id, e.target.value)}
                          className="w-32 px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          placeholder="18"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>

                      {/* Total Calculation */}
                      <div className="text-right">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Subtotal:</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Delivery Charges:</span>
                            <span>₹{delivery.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>GST ({gstRate}%):</span>
                            <span>₹{gstAmount.toFixed(2)}</span>
                          </div>
                          <div className="border-t pt-2">
                            <div className="flex justify-between text-lg font-bold">
                              <span>Total Amount:</span>
                              <span>₹{total.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Send Button */}
                    <div className="mt-4 text-right">
                      <button
                        onClick={() => sendResponse(inquiry)}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Send Response to Company
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SendQuotesPage;