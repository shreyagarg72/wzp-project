import React from "react";

const InquiryModal = ({
  inquiryModalOpen,
  selectedCustomer,
  inquiryError,
  expectedDelivery,
  setExpectedDelivery,
  productLines,
  handleProductChange,
  addProductLine,
  removeProductLine,
  inquirySubmitting,
  handleInquirySubmit,
  closeInquiryModal,
}) => {
  if (!inquiryModalOpen || !selectedCustomer) return null;

  return (
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
          Raise Inquiry for{" "}
          {selectedCustomer.companyName || selectedCustomer.customerName}
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
            <div
              key={idx}
              className="border border-gray-200 p-4 rounded-md shadow-sm bg-gray-50 space-y-3"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700">
                  Product {idx + 1}
                </h3>
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
                  <label className="block text-xs text-gray-600 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={product.productName}
                    onChange={(e) =>
                      handleProductChange(idx, "productName", e.target.value)
                    }
                    className="border border-gray-300 px-3 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={inquirySubmitting}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    placeholder="Brand"
                    value={product.brand}
                    onChange={(e) =>
                      handleProductChange(idx, "brand", e.target.value)
                    }
                    className="border border-gray-300 px-3 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={inquirySubmitting}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={product.quantity}
                    min={1}
                    onChange={(e) =>
                      handleProductChange(idx, "quantity", e.target.value)
                    }
                    className="border border-gray-300 px-3 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={inquirySubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="Category"
                    value={product.category || ""}
                    onChange={(e) =>
                      handleProductChange(idx, "category", e.target.value)
                    }
                    className="border border-gray-300 px-3 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={inquirySubmitting}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Unit of Measure
                  </label>
                  <input
                    type="text"
                    placeholder="Unit of Measure (e.g. pcs, kg)"
                    value={product.uom || ""}
                    onChange={(e) =>
                      handleProductChange(idx, "uom", e.target.value)
                    }
                    className="border border-gray-300 px-3 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={inquirySubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Description"
                  value={product.description || ""}
                  onChange={(e) =>
                    handleProductChange(idx, "description", e.target.value)
                  }
                  className="border border-gray-300 px-3 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  disabled={inquirySubmitting}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Specifications
                </label>
                <textarea
                  placeholder="Specifications"
                  value={product.specifications || ""}
                  onChange={(e) =>
                    handleProductChange(idx, "specifications", e.target.value)
                  }
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
  );
};

export default InquiryModal;
