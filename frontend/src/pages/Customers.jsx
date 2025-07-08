import React, { useState, useEffect } from "react";
import CustomerForm from "../components/CustomerForm";
import CustomerList from "../components/CustomerList";
import InquiryModal from "../components/InquiryModal";
import { customerService } from "../api/customerService";

export default function Customer() {
  // Customer form state
  const [form, setForm] = useState({
    companyName: "",
    customerName: "",
    email: "",
    mobile: "",
    address: "",
    gstin: "",
  });

  // UI state
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Inquiry state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [productLines, setProductLines] = useState([
    { productName: "", brand: "", quantity: 1 },
  ]);
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquiryError, setInquiryError] = useState(null);

  // Customer operations
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const customersData = await customerService.fetchCustomers();
      setCustomers(customersData);
    } catch (err) {
      setError(err.message);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await customerService.addCustomer(form);
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
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
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

  // Inquiry operations
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
      
      const response = await customerService.submitInquiry(payload);
      
      console.log("Inquiry submitted successfully:", response);
      
      // Show success message
      alert(`Inquiry submitted successfully! Inquiry ID: ${payload.inquiryId}`);
      
      // Reset form and close modal
      setProductLines([{ productName: "", brand: "", quantity: 1 }]);
      setExpectedDelivery("");
      setInquiryModalOpen(false);
      setSelectedCustomer(null);

    } catch (err) {
      setInquiryError(err.message);
    } finally {
      setInquirySubmitting(false);
    }
  };

  const closeInquiryModal = () => {
    setInquiryModalOpen(false);
    setSelectedCustomer(null);
    setProductLines([{ productName: "", brand: "", quantity: 1 }]);
    setExpectedDelivery("");
    setInquiryError(null);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

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

      {/* Customer Form */}
      <CustomerForm
        form={form}
        setForm={setForm}
        showForm={showForm}
        submitting={submitting}
        error={error}
        handleSubmit={handleSubmit}
        closeForm={closeForm}
      />

      {/* Customer List */}
      <CustomerList
        customers={customers}
        loading={loading}
        openInquiryForm={openInquiryForm}
      />

      {/* Inquiry Modal */}
      <InquiryModal
        inquiryModalOpen={inquiryModalOpen}
        selectedCustomer={selectedCustomer}
        inquiryError={inquiryError}
        expectedDelivery={expectedDelivery}
        setExpectedDelivery={setExpectedDelivery}
        productLines={productLines}
        handleProductChange={handleProductChange}
        addProductLine={addProductLine}
        removeProductLine={removeProductLine}
        inquirySubmitting={inquirySubmitting}
        handleInquirySubmit={handleInquirySubmit}
        closeInquiryModal={closeInquiryModal}
      />
    </div>
  );
}