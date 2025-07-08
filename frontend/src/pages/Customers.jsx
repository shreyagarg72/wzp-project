import React, { useState, useEffect } from "react";
import axios from "axios";
const API_BASE_URL = "http://localhost:5000";

export default function Customer() {
  const [form, setForm] = useState({
    companyName: "",
    customerName: "",
    email: "",
    mobile: "",
    address: "",
    gstin: "",
  });
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [productLines, setProductLines] = useState([
    { productName: "", brand: "", quantity: 1 },
  ]);
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquiryError, setInquiryError] = useState(null);

  const openInquiryForm = (customer) => {
    setSelectedCustomer(customer);
    setProductLines([{ productName: "", brand: "", quantity: 1 }]);
    setExpectedDelivery("");
    setInquiryError(null);
    setInquiryModalOpen(true);
  };

  const handleProductChange = (index, key, value) => {
    const updated = [...productLines];
    updated[index][key] = value;
    setProductLines(updated);
  };

  const addProductLine = () => {
    setProductLines([
      ...productLines,
      { productName: "", brand: "", quantity: 1 },
    ]);
  };

  const removeProductLine = (index) => {
    const updated = [...productLines];
    updated.splice(index, 1);
    setProductLines(updated);
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_BASE_URL}/api/customers`);

      // Ensure the response data is an array
      if (Array.isArray(res.data)) {
        setCustomers(res.data);
      } else if (res.data && Array.isArray(res.data.customers)) {
        setCustomers(res.data.customers);
      } else {
        setCustomers([]);
        console.warn("API response is not an array:", res.data);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError("Failed to fetch customers");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await axios.post(`${API_BASE_URL}/api/customers`, form);
      setForm({
        companyName: "",
        customerName: "",
        email: "",
        mobile: "",
        address: "",
        gstin: "",
      });
      setShowForm(false);
      fetchCustomers();
    } catch (err) {
      console.error("Error adding customer:", err);
      setError("Failed to add customer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInquirySubmit = async () => {
    try {
      setInquirySubmitting(true);
      setInquiryError(null);

      // Validate required fields
      if (!selectedCustomer || !selectedCustomer._id) {
        setInquiryError("No customer selected");
        return;
      }

      // Validate products
      const validProducts = productLines.filter(p => p.productName.trim());
      if (validProducts.length === 0) {
        setInquiryError("At least one product with a name is required");
        return;
      }

      // Validate quantities
      const invalidQuantities = validProducts.filter(p => !p.quantity || p.quantity <= 0);
      if (invalidQuantities.length > 0) {
        setInquiryError("All products must have a quantity greater than 0");
        return;
      }

      const payload = {
        inquiryId: `INQ-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        customerId: selectedCustomer._id,
        expectedDelivery: expectedDelivery || null,
        products: validProducts.map((p) => ({
          name: p.productName.trim(),
          brand: (p.brand || '').trim(),
          quantity: Number(p.quantity),
          category: (p.category || '').trim(),
          description: (p.description || '').trim(),
          specifications: (p.specifications || '').trim(),
          uom: (p.uom || '').trim()
        }))
      };

      console.log("Submitting Inquiry:", payload);
      
      const response = await axios.post(`${API_BASE_URL}/api/inquiries`, payload);
      
      console.log("Inquiry submitted successfully:", response.data);
      
      // Show success message
      alert(`Inquiry submitted successfully! Inquiry ID: ${payload.inquiryId}`);
      
      // Reset form and close modal
      setProductLines([{ productName: "", brand: "", quantity: 1 }]);
      setExpectedDelivery("");
      setInquiryModalOpen(false);
      setSelectedCustomer(null);

    } catch (err) {
      console.error("Error submitting inquiry:", err);
      
      // Handle different error types
      if (err.response) {
        // Server responded with error status
        const errorMessage = err.response.data?.error || err.response.data?.message || 'Server error occurred';
        setInquiryError(`Failed to submit inquiry: ${errorMessage}`);
      } else if (err.request) {
        // Request was made but no response received
        setInquiryError("Failed to submit inquiry: No response from server");
      } else {
        // Something else happened
        setInquiryError(`Failed to submit inquiry: ${err.message}`);
      }
    } finally {
      setInquirySubmitting(false);
    }
  };

  const formatFieldName = (key) => {
    return (
      key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")
    );
  };

  const closeForm = () => {
    setShowForm(false);
    setForm({
      companyName: "",
      customerName: "",
      email: "",
      mobile: "",
      address: "",
      gstin: "",
    });
    setError(null);
  };

  const closeInquiryModal = () => {
    setInquiryModalOpen(false);
    setSelectedCustomer(null);
    setProductLines([{ productName: "", brand: "", quantity: 1 }]);
    setExpectedDelivery("");
    setInquiryError(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Customer Management
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 shadow-md"
        >
          {showForm ? "Cancel" : "+ Add Customer"}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
          <span className="mr-2">⚠️</span>
          {error}
        </div>
      )}

      {/* Slide Down Form */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          showForm ? "max-h-96 opacity-100 mb-6" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Add New Customer
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(form).map((key) => (
                <div key={key} className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    {formatFieldName(key)}
                    {(key === "customerName" || key === "email") && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  <input
                    type={key === "email" ? "email" : "text"}
                    value={form[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={key === "customerName" || key === "email"}
                    disabled={submitting}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                {submitting ? "Adding..." : "Add Customer"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Customer List</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading customers...</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-w-full">
            <div className="min-w-full">
              {Array.isArray(customers) && customers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-4">📋</div>
                  <p className="text-lg font-medium">No customers found</p>
                  <p className="text-sm mt-1">
                    Click "Add Customer" to create your first customer
                  </p>
                </div>
              ) : (
               <table className="table-auto w-full text-sm text-left text-gray-600">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mobile
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        GSTIN
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.isArray(customers) &&
                      customers.map((cust, index) => (
                        <tr
                          key={cust._id || index}
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {cust.custId || `C${index + 1}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cust.customerName || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cust.companyName || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cust.email || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cust.mobile || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                            {cust.address || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cust.gstin || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => openInquiryForm(cust)}
                              className="text-blue-600 hover:text-blue-800 font-medium underline"
                            >
                              Raise Inquiry
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Inquiry Modal */}
      {inquiryModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl shadow-lg relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-4 text-gray-500 hover:text-gray-800 text-xl"
              onClick={closeInquiryModal}
              disabled={inquirySubmitting}
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Raise Inquiry for {selectedCustomer.companyName || selectedCustomer.customerName}
            </h2>

            {/* Inquiry Error Message */}
            {inquiryError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center">
                <span className="mr-2">⚠️</span>
                {inquiryError}
              </div>
            )}

            {/* Expected Delivery Date */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={inquirySubmitting}
              />
            </div>

            {/* Product Lines */}
            <div className="space-y-6">
              {productLines.map((product, idx) => (
                <div key={idx} className="border border-gray-200 p-4 rounded-md shadow-sm bg-gray-50 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-700">Product {idx + 1}</h3>
                    {productLines.length > 1 && (
                      <button
                        onClick={() => removeProductLine(idx)}
                        className="text-red-500 hover:text-red-700 text-sm"
                        disabled={inquirySubmitting}
                      >
                        Remove Product
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Product Name *</label>
                      <input
                        type="text"
                        placeholder="Product Name"
                        value={product.productName}
                        onChange={(e) => handleProductChange(idx, "productName", e.target.value)}
                        className="border border-gray-300 px-3 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        disabled={inquirySubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Brand</label>
                      <input
                        type="text"
                        placeholder="Brand"
                        value={product.brand}
                        onChange={(e) => handleProductChange(idx, "brand", e.target.value)}
                        className="border border-gray-300 px-3 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={inquirySubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Quantity *</label>
                      <input
                        type="number"
                        placeholder="Quantity"
                        value={product.quantity}
                        min={1}
                        onChange={(e) => handleProductChange(idx, "quantity", e.target.value)}
                        className="border border-gray-300 px-3 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={inquirySubmitting}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Category</label>
                      <input
                        type="text"
                        placeholder="Category"
                        value={product.category || ''}
                        onChange={(e) => handleProductChange(idx, "category", e.target.value)}
                        className="border border-gray-300 px-3 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={inquirySubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Unit of Measure</label>
                      <input
                        type="text"
                        placeholder="Unit of Measure (e.g. pcs, kg)"
                        value={product.uom || ''}
                        onChange={(e) => handleProductChange(idx, "uom", e.target.value)}
                        className="border border-gray-300 px-3 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={inquirySubmitting}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Description</label>
                    <textarea
                      placeholder="Description"
                      value={product.description || ''}
                      onChange={(e) => handleProductChange(idx, "description", e.target.value)}
                      className="border border-gray-300 px-3 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      disabled={inquirySubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Specifications</label>
                    <textarea
                      placeholder="Specifications"
                      value={product.specifications || ''}
                      onChange={(e) => handleProductChange(idx, "specifications", e.target.value)}
                      className="border border-gray-300 px-3 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      disabled={inquirySubmitting}
                    />
                  </div>
                </div>
              ))}

              <button
                onClick={addProductLine}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={inquirySubmitting}
              >
                + Add Another Product
              </button>

              {/* Submit */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={closeInquiryModal}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={inquirySubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleInquirySubmit}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={inquirySubmitting}
                >
                  {inquirySubmitting ? "Submitting..." : "Submit Inquiry"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}