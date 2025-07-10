import React, { useEffect, useState } from "react";
import axios from "axios";
const API_BASE_URL = "http://localhost:5000";

export default function InquiryList() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Add inside your component, below the inquiry table
  const [suppliers, setSuppliers] = useState([]);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    companyName: "",
    supplierName: "",
    email: "",
    mobile: "",
    address: "",
    gstin: "",
    specialization: "",
  });
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [productSupplierMap, setProductSupplierMap] = useState({});
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  const openQuoteModal = (inquiry) => {
    const map = {};
    inquiry.products.forEach((p) => {
      map[p.productId] = [];
    });
    setProductSupplierMap(map);
    setSelectedInquiry(inquiry);
    setShowQuoteModal(true);
  };

  const toggleSupplierForProduct = (productId, supplierId) => {
    setProductSupplierMap((prev) => {
      const current = prev[productId] || [];
      const updated = current.includes(supplierId)
        ? current.filter((id) => id !== supplierId)
        : [...current, supplierId];
      return { ...prev, [productId]: updated };
    });
  };

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/suppliers`);
      setSuppliers(res.data || []);
    } catch (err) {
      console.error("Error fetching suppliers", err);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...supplierForm,
      specialization: supplierForm.specialization
        .split(",")
        .map((s) => s.trim()),
    };

    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE_URL}/api/suppliers`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSupplierForm({
        companyName: "",
        supplierName: "",
        email: "",
        mobile: "",
        address: "",
        gstin: "",
        specialization: "",
      });
      setShowSupplierForm(false);
      fetchSuppliers();
    } catch (err) {
      console.error("Error adding supplier", err);
      alert("Failed to add supplier");
    }
  };

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_BASE_URL}/api/inquiries`);
      const filtered = res.data.filter(
        (inq) => inq.status === "Open" || inq.status === "Processing"
      );
      setInquiries(filtered);
    } catch (err) {
      console.error("Error fetching inquiries:", err);
      setError("Failed to fetch inquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        Inquiry List
      </h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500">Loading inquiries...</div>
      ) : inquiries.length === 0 ? (
        <div className="text-gray-500">
          No open or processing inquiries available.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Inquiry ID
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Expected Delivery
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {inquiries.map((inquiry) => (
                <tr
                  key={inquiry._id}
                  className="hover:bg-gray-50 transition-all"
                >
                  <td className="px-4 py-3">{inquiry.inquiryId || "N/A"}</td>
                  <td className="px-4 py-3">
                    {inquiry.customerId?.companyName || "N/A"}
                  </td>
                  <td className="px-4 py-3">
                    {inquiry.expectedDelivery
                      ? new Date(inquiry.expectedDelivery).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="px-4 py-3 font-medium">{inquiry.status}</td>
                  <td className="px-4 py-3">
                    {inquiry.status === "Open" ? (
                      <button
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        onClick={() => openQuoteModal(inquiry)}
                      >
                        Send Quote
                      </button>
                    ) : (
                      <button
                        className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600"
                        onClick={() =>
                          alert(`Update Quote for ${inquiry.inquiryId}`)
                        }
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
      <div className="mt-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Supplier List
          </h2>
          <button
            onClick={() => setShowSupplierForm(!showSupplierForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            {showSupplierForm ? "Cancel" : "+ Add Supplier"}
          </button>
        </div>

        {/* Add Supplier Form */}
        {showSupplierForm && (
          <div className="bg-gray-100 p-6 rounded-md mb-6">
            <form
              onSubmit={handleSupplierSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {Object.entries(supplierForm).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) =>
                      setSupplierForm((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder={
                      key === "specialization"
                        ? "Comma-separated (e.g. Hardware, Electrical)"
                        : ""
                    }
                    required={[
                      "companyName",
                      "supplierName",
                      "email",
                      "mobile",
                    ].includes(key)}
                  />
                </div>
              ))}
              <div className="col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                >
                  Add Supplier
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Supplier Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Supplier ID
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Specialization
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Email
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {suppliers.map((sup) => (
                <tr key={sup._id}>
                  <td className="px-4 py-3">{sup.supplierId}</td>
                  <td className="px-4 py-3">{sup.supplierName}</td>
                  <td className="px-4 py-3">{sup.companyName}</td>
                  <td className="px-4 py-3">{sup.specialization.join(", ")}</td>
                  <td className="px-4 py-3">{sup.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showQuoteModal && selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl shadow-lg overflow-y-auto max-h-[90vh] relative">
            <button
              className="absolute top-2 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setShowQuoteModal(false)}
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold mb-4">
              Inquiry: {selectedInquiry.inquiryId}
            </h2>

            <div className="mb-4 text-gray-700">
              <p>
                <strong>Customer:</strong>{" "}
                {selectedInquiry.customerId?.companyName}
              </p>
              <p>
                <strong>Expected Delivery:</strong>{" "}
                {new Date(
                  selectedInquiry.expectedDelivery
                ).toLocaleDateString()}
              </p>
            </div>

            <div className="space-y-6">
              {selectedInquiry.products.map((product, idx) => (
                <div key={idx} className="border p-4 rounded-md bg-gray-50">
                  <p>
                    <strong>Product:</strong> {product.name}
                  </p>
                  <p>
                    <strong>Brand:</strong> {product.brand}
                  </p>
                  <p>
                    <strong>Quantity:</strong> {product.quantity}
                  </p>
                  <p>
                    <strong>UOM:</strong> {product.uom}
                  </p>
                  <p>
                    <strong>Specifications:</strong> {product.specifications}
                  </p>

                  <div className="mt-3">
                    <p className="font-medium text-gray-700 mb-2">
                      Select Suppliers:
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {suppliers.map((sup) => (
                        <label
                          key={sup._id}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            checked={
                              productSupplierMap[product.productId]?.includes(
                                sup._id
                              ) || false
                            }
                            onChange={() =>
                              toggleSupplierForProduct(
                                product.productId,
                                sup._id
                              )
                            }
                          />
                          <span>
                            {sup.companyName} ({sup.supplierName})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={async () => {
                  const supplierProductMap = {};

                  selectedInquiry.products.forEach((product) => {
                    const supplierIds =
                      productSupplierMap[product.productId] || [];
                    supplierIds.forEach((supplierId) => {
                      if (!supplierProductMap[supplierId])
                        supplierProductMap[supplierId] = [];
                      supplierProductMap[supplierId].push(product);
                    });
                  });

                  try {
                    const token = localStorage.getItem("token");
                    await axios.post(
                      `${API_BASE_URL}/api/send-inquiry-mails`,
                      {
                        inquiryId: selectedInquiry.inquiryId,
                        expectedDelivery: selectedInquiry.expectedDelivery,
                        customer: selectedInquiry.customerId,
                        supplierProductMap,
                      },
                      {
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      }
                    );

                    alert("Emails sent successfully!");
                    setShowQuoteModal(false);
                    fetchInquiries();
                  } catch (err) {
                    console.error("Error sending mail:", err);
                    alert("Failed to send emails");
                  }
                }}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
              >
                Send Mail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
