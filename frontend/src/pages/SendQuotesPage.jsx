import React, { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:5000";

const SendQuotesPage = () => {
  const [completedInquiries, setCompletedInquiries] = useState([]);
  const [fulfilledInquiries, setFulfilledInquiries] = useState([]);
  const [activeTab, setActiveTab] = useState("completed");
  const [marginMap, setMarginMap] = useState({});
  const [discountMap, setDiscountMap] = useState({});
  const [deliveryCharges, setDeliveryCharges] = useState({});
  const [gstRates, setGstRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [emailForm, setEmailForm] = useState({
    toEmails: "",
    ccEmails: "",
    subject: "",
    message: "",
  });

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Fetch completed inquiries
      const completedResponse = await fetch(`${API_BASE_URL}/api/inquiries/completed`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Fetch fulfilled inquiries
      const fulfilledResponse = await fetch(`${API_BASE_URL}/api/inquiries/fulfilled`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!completedResponse.ok || !fulfilledResponse.ok) {
        throw new Error("Failed to fetch inquiries");
      }

      const completedData = await completedResponse.json();
      const fulfilledData = await fulfilledResponse.json();

      setCompletedInquiries(completedData);
      setFulfilledInquiries(fulfilledData);

      // Initialize GST rates and discount with defaults for completed inquiries
      const initialGstRates = {};
      const initialDiscounts = {};
      completedData.forEach((inquiry) => {
        inquiry.products?.forEach((product) => {
          initialGstRates[inquiry._id + product.productId] = 0;
          initialDiscounts[inquiry._id + product.productId] = 0;
        });
      });
      setGstRates(initialGstRates);
      setDiscountMap(initialDiscounts);

      setError(null);
    } catch (err) {
      console.error("Error loading inquiries:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarginChange = (inquiryId, productId, margin) => {
    setMarginMap((prev) => ({
      ...prev,
      [inquiryId + productId]: parseFloat(margin) || 0,
    }));
  };

  const handleDiscountChange = (inquiryId, productId, discount) => {
    setDiscountMap((prev) => ({
      ...prev,
      [inquiryId + productId]: parseFloat(discount) || 0,
    }));
  };

  const handleDeliveryChargeChange = (inquiryId, charges) => {
    setDeliveryCharges((prev) => ({
      ...prev,
      [inquiryId]: parseFloat(charges) || 0,
    }));
  };

  const handleGstRateChange = (inquiryId, productId, rate) => {
    setGstRates((prev) => ({
      ...prev,
      [inquiryId + productId]: parseFloat(rate) || 0,
    }));
  };

  const calculatePrice = (basePrice, margin, discount, gstRate) => {
    const base = parseFloat(basePrice) || 0;
    const marginPercent = parseFloat(margin) || 0;
    const discountPercent = parseFloat(discount) || 0;
    const gst = parseFloat(gstRate) || 0;

    const priceAfterMargin = base + (base * marginPercent) / 100;
    const priceAfterDiscount = priceAfterMargin - (priceAfterMargin * discountPercent) / 100;
    const finalPrice = priceAfterDiscount + (priceAfterDiscount * gst) / 100;

    return {
      priceAfterMargin: parseFloat(priceAfterMargin.toFixed(2)),
      priceAfterDiscount: parseFloat(priceAfterDiscount.toFixed(2)),
      gstAmount: parseFloat(((priceAfterDiscount * gst) / 100).toFixed(2)),
      finalPrice: parseFloat(finalPrice.toFixed(2)),
    };
  };

  const calculateTotals = (inquiry) => {
    let subtotal = 0;
    let totalGstAmount = 0;
    let totalDiscount = 0;

    inquiry.products?.forEach((product) => {
      const quote = inquiry.supplierQuotes
        ?.flatMap((s) => s.quotes)
        ?.find((q) => q.productId === product.productId?.toString());
      const base = parseFloat(quote?.price) || 0;
      const margin = parseFloat(marginMap[inquiry._id + product.productId]) || 0;
      const discount = parseFloat(discountMap[inquiry._id + product.productId]) || 0;
      const gstRate = parseFloat(gstRates[inquiry._id + product.productId]) || 0;

      const prices = calculatePrice(base, margin, discount, gstRate);

      subtotal += prices.priceAfterDiscount;
      totalGstAmount += prices.gstAmount;
      totalDiscount += prices.priceAfterMargin - prices.priceAfterDiscount;
    });

    const delivery = parseFloat(deliveryCharges[inquiry._id]) || 0;
    const total = subtotal + delivery + totalGstAmount;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      delivery: parseFloat(delivery.toFixed(2)),
      gstAmount: parseFloat(totalGstAmount.toFixed(2)),
      totalDiscount: parseFloat(totalDiscount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    };
  };

  const openEmailModal = (inquiry) => {
    setSelectedInquiry(inquiry);
    setEmailForm({
      toEmails: inquiry.customer?.email || "",
      ccEmails: "",
      subject: `Quotation for Inquiry ID: ${inquiry.inquiryId}`,
      message: `Dear ${inquiry.customer?.companyName || "Valued Customer"},\n\nPlease find the attached quotation for your inquiry.\n\nRegards,\nCRM Team`,
    });
    setShowModal(true);
  };

  const sendResponse = async () => {
    if (!selectedInquiry) return;

    const { toEmails, ccEmails } = emailForm;

    if (!toEmails.trim()) {
      alert("Recipient email is required!");
      return;
    }

    const quoteData = selectedInquiry.products.map((product) => {
      const productId = product.productId;
      const quote = selectedInquiry.supplierQuotes
        ?.flatMap((s) => s.quotes)
        ?.find((q) => q.productId === productId?.toString());

      const basePrice = parseFloat(quote?.price) || 0;
      const margin = parseFloat(marginMap[selectedInquiry._id + productId]) || 0;
      const discount = parseFloat(discountMap[selectedInquiry._id + productId]) || 0;
      const gstRate = parseFloat(gstRates[selectedInquiry._id + productId]) || 0;

      const prices = calculatePrice(basePrice, margin, discount, gstRate);

      return {
        name: product.name,
        brand: product.brand,
        quantity: product.quantity,
        category: product.category,
        description: product.description,
        specifications: product.specifications,
        uom: product.uom,
        basePrice: parseFloat(basePrice.toFixed(2)),
        margin: parseFloat(margin.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        gstRate: parseFloat(gstRate.toFixed(2)),
        gstAmount: prices.gstAmount,
        finalPrice: prices.finalPrice,
      };
    });

    const deliveryChargeAmount = parseFloat(deliveryCharges[selectedInquiry._id]) || 0;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/sendQuoteResponse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          toEmails: toEmails.split(",").map((e) => e.trim()).filter((e) => e),
          ccEmails: ccEmails ? ccEmails.split(",").map((e) => e.trim()).filter((e) => e) : [],
          companyName: selectedInquiry.customer?.companyName || "Customer",
          inquiryId: selectedInquiry.inquiryId,
          quoteData,
          deliveryCharges: deliveryChargeAmount,
          subject: emailForm.subject,
          message: emailForm.message,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        alert("Quote sent successfully!");
        setShowModal(false);
        setSelectedInquiry(null);
        // Refresh inquiries to update the tabs
        fetchInquiries();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      console.error("Error sending response:", err);
      alert("Failed to send response.");
    }
  };

  const handleOrderAction = async (inquiryId, action) => {
    if (!confirm(`Are you sure you want to ${action} this order?`)) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/orders/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inquiryId }),
      });

      const result = await response.json();
      if (response.ok) {
        alert(`Order ${action}ed successfully!`);
        fetchInquiries(); // Refresh data
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      console.error(`Error ${action}ing order:`, err);
      alert(`Failed to ${action} order.`);
    }
  };

  const handleSendClick = () => {
    if (!selectedInquiry) return;
    if (!confirm("Are you sure you want to send this quotation email?")) return;
    sendResponse();
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

  const currentInquiries = activeTab === "completed" ? completedInquiries : fulfilledInquiries;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Send Quotations</h1>
          <p className="text-gray-600">Review and send quotations to customers</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("completed")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "completed"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Send Quote to Comapany ({completedInquiries.length})
              </button>
              <button
                onClick={() => setActiveTab("fulfilled")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "fulfilled"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Pending Updates ({fulfilledInquiries.length})
              </button>
            </nav>
          </div>
        </div>

        {currentInquiries.length === 0 ? (
          <div className="bg-white border rounded-lg p-6">
            <div className="text-center py-8">
              <p className="text-gray-500">
                No {activeTab} inquiries found.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {currentInquiries.map((inquiry) => {
              if (activeTab === "fulfilled") {
                // Fulfilled inquiries - simple view with action buttons
                return (
                  <div key={inquiry._id} className="bg-white border rounded-lg">
                    <div className="bg-green-600 text-white p-4 rounded-t-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <h2 className="text-xl font-bold">Inquiry #{inquiry.inquiryId}</h2>
                          <p className="text-green-100">{inquiry.customer?.companyName || "N/A"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">Status: Fulfilled</p>
                          <p className="text-sm">Products: {inquiry.products?.length || 0}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => handleOrderAction(inquiry.inquiryId, "accept")}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleOrderAction(inquiry.inquiryId, "edit")}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleOrderAction(inquiry.inquiryId, "decline")}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // Completed inquiries - full view with quotation functionality
              const { subtotal, delivery, gstAmount, totalDiscount, total } = calculateTotals(inquiry);

              return (
                <div key={inquiry._id} className="bg-white border rounded-lg">
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

                  <div className="p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Product</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Brand</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Specifications</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Qty</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Base Price</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Margin %</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Discount %</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">GST %</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Final Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inquiry.products?.map((product, index) => {
                            const supplierQuote = inquiry.supplierQuotes
                              ?.flatMap((s) => s.quotes)
                              ?.find((q) => q.productId === product.productId?.toString());
                            const basePrice = parseFloat(supplierQuote?.price) || 0;
                            const margin = parseFloat(marginMap[inquiry._id + product.productId]) || 0;
                            const discount = parseFloat(discountMap[inquiry._id + product.productId]) || 0;
                            const gstRate = parseFloat(gstRates[inquiry._id + product.productId]) || 0;

                            const prices = calculatePrice(basePrice, margin, discount, gstRate);

                            return (
                              <tr key={product.productId} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                <td className="border border-gray-300 px-3 py-2 text-sm">{product.name}</td>
                                <td className="border border-gray-300 px-3 py-2 text-sm">{product.brand}</td>
                                <td className="border border-gray-300 px-3 py-2 text-sm max-w-xs truncate" title={product.specifications}>
                                  {product.specifications}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-sm">
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{product.quantity}</span>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-sm font-medium">₹{basePrice.toFixed(2)}</td>
                                <td className="border border-gray-300 px-3 py-2">
                                  <div className="flex items-center">
                                    <input
                                      type="number"
                                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                      value={margin}
                                      onChange={(e) => handleMarginChange(inquiry._id, product.productId, e.target.value)}
                                      placeholder="0"
                                      min="0"
                                      step="0.1"
                                    />
                                    <span className="ml-1 text-sm text-gray-500">%</span>
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-3 py-2">
                                  <div className="flex items-center">
                                    <input
                                      type="number"
                                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                      value={discount}
                                      onChange={(e) => handleDiscountChange(inquiry._id, product.productId, e.target.value)}
                                      placeholder="0"
                                      min="0"
                                      step="0.1"
                                    />
                                    <span className="ml-1 text-sm text-gray-500">%</span>
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-3 py-2">
                                  <div className="flex items-center">
                                    <input
                                      type="number"
                                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                      value={gstRate}
                                      onChange={(e) => handleGstRateChange(inquiry._id, product.productId, e.target.value)}
                                      placeholder="0"
                                      min="0"
                                      max="100"
                                      step="0.1"
                                    />
                                    <span className="ml-1 text-sm text-gray-500">%</span>
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-sm font-bold text-green-600">
                                  ₹{prices.finalPrice.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-6 bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Charges</label>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-2">₹</span>
                            <input
                              type="number"
                              value={deliveryCharges[inquiry._id] || ""}
                              onChange={(e) => handleDeliveryChargeChange(inquiry._id, e.target.value)}
                              className="w-32 px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Subtotal:</span>
                              <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Total Discount:</span>
                              <span className="text-red-600">-₹{totalDiscount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Total GST:</span>
                              <span>₹{gstAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Delivery Charges:</span>
                              <span>₹{delivery.toFixed(2)}</span>
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

                      <div className="mt-4 text-right">
                        <button
                          onClick={() => openEmailModal(inquiry)}
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
        )}
      </div>

      {/* Email Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Send Quotation Email</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To (Email addresses)</label>
                <input
                  type="email"
                  value={emailForm.toEmails}
                  onChange={(e) => setEmailForm({ ...emailForm, toEmails: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder="customer@company.com, another@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CC (Optional)</label>
                <input
                  type="email"
                  value={emailForm.ccEmails}
                  onChange={(e) => setEmailForm({ ...emailForm, ccEmails: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder="manager@yourcompany.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendClick}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendQuotesPage;