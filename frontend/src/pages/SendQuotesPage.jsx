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
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Send Quotation to Customers</h1>
        <div className="text-center">Loading inquiries...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Send Quotation to Customers</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (inquiries.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Send Quotation to Customers</h1>
        <div className="text-center text-gray-500">No completed inquiries found.</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Send Quotation to Customers</h1>

      {inquiries.map(inquiry => (
        <div key={inquiry._id} className="border p-4 mb-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-2">Inquiry ID: {inquiry.inquiryId}</h2>
          <p className="mb-4">Customer: {inquiry.customer?.companyName || "N/A"}</p>

          <table className="w-full border mb-4 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Product</th>
                <th className="p-2 border">Brand</th>
                <th className="p-2 border">Specifications</th>
                <th className="p-2 border">Qty</th>
                <th className="p-2 border">Supplier Delivery</th>
                <th className="p-2 border">Base Price</th>
                <th className="p-2 border">Margin %</th>
                <th className="p-2 border">Final Price</th>
              </tr>
            </thead>
            <tbody>
              {inquiry.products?.map(product => {
                const supplierQuote = inquiry.supplierQuotes?.flatMap(s => s.quotes)?.find(q => q.productId === product.productId?.toString());
                const basePrice = supplierQuote?.price || 0;
                const expectedDelivery = supplierQuote?.expectedDelivery || inquiry.expectedDelivery;
                const margin = parseFloat(marginMap[inquiry._id + product.productId] || 0);
                const finalPrice = calculatePrice(basePrice, margin);

                return (
                  <tr key={product.productId}>
                    <td className="p-2 border">{product.name}</td>
                    <td className="p-2 border">{product.brand}</td>
                    <td className="p-2 border">{product.specifications}</td>
                    <td className="p-2 border">{product.quantity}</td>
                    <td className="p-2 border">
                      {expectedDelivery ? new Date(expectedDelivery).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-2 border">₹{basePrice.toFixed(2)}</td>
                    <td className="p-2 border">
                      <input
                        type="number"
                        className="w-20 border px-2"
                        value={margin}
                        onChange={e => handleMarginChange(inquiry._id, product.productId, e.target.value)}
                      />%
                    </td>
                    <td className="p-2 border font-semibold">₹{finalPrice.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="font-bold mb-3">
            Total: ₹{
              inquiry.products?.reduce((sum, product) => {
                const quote = inquiry.supplierQuotes?.flatMap(s => s.quotes)?.find(q => q.productId === product.productId?.toString());
                const base = quote?.price || 0;
                const margin = parseFloat(marginMap[inquiry._id + product.productId] || 0);
                return sum + calculatePrice(base, margin);
              }, 0).toFixed(2)
            }
          </div>

          <button
            onClick={() => sendResponse(inquiry)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Send Response to Company
          </button>
        </div>
      ))}
    </div>
  );
};

export default SendQuotesPage;