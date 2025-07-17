import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Users,
  FileText,
  Truck,
} from "lucide-react";

export default function Product() {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const productsPerPage = 5;

  useEffect(() => {
    setLoading(true);
    axios
      .get("http://localhost:5000/api/products/overview")
      .then((res) => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Flatten the data for table display
  const flattenedData = products.flatMap((product) =>
    product.inquiries.flatMap((inquiry) =>
      inquiry.quotes.map((quote) => ({
        productName: product.productName,
        brand: product.brand,
        specification: product.specification,
        customerName: inquiry.customerName,
        inquiryId: inquiry.inquiryId,
        quantity: inquiry.quantity,
        supplierName: quote.supplierName,
        price: quote.price,
        expectedDelivery: quote.expectedDelivery,
        availability: quote.availability,
      }))
    )
  );

  // Calculate pagination
  const totalPages = Math.ceil(flattenedData.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentData = flattenedData.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-800";
      case "limited":
        return "bg-yellow-100 text-yellow-800";
      case "out of stock":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Package className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-800">Product Overview</h2>
        </div>
        <p className="text-sm text-gray-600">
          Comprehensive view of products, inquiries, and supplier quotes
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-white p-3 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-gray-600">Total Products</span>
          </div>
          <p className="text-lg font-bold text-gray-800 mt-1">
            {products.length}
          </p>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-600">Total Inquiries</span>
          </div>
          <p className="text-lg font-bold text-gray-800 mt-1">
            {products.reduce((acc, prod) => acc + prod.inquiries.length, 0)}
          </p>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-gray-600">Total Quotes</span>
          </div>
          <p className="text-lg font-bold text-gray-800 mt-1">
            {flattenedData.length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  S.No
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                  Product Details
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-44">
                  Customer Info
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-44">
                  Supplier Quote
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Delivery
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-2 py-6 text-center text-gray-500"
                  >
                    No products found
                  </td>
                </tr>
              ) : (
                currentData.map((item, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-indigo-600">
                          {startIndex + index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="max-w-xs">
                        <div className="font-medium text-gray-900 truncate text-sm">
                          {item.productName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          Brand: {item.brand}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 truncate">
                          {item.specification}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {item.customerName}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {item.inquiryId}
                        </div>
                        <div className="text-xs text-gray-400">
                          Qty: {item.quantity}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {item.supplierName}
                        </div>
                        <div className="text-xs font-semibold text-green-600">
                          ₹{item.price?.toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        {new Date(item.expectedDelivery).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                          }
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          item.availability
                        )}`}
                      >
                        {item.availability || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t">
            <div className="text-xs text-gray-700">
              Showing {startIndex + 1} to{" "}
              {Math.min(endIndex, flattenedData.length)} of{" "}
              {flattenedData.length} entries
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md ${
                  currentPage === 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                <ChevronLeft className="w-3 h-3" />
                Prev
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage <= 2) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 1) {
                    pageNum = totalPages - 2 + i;
                  } else {
                    pageNum = currentPage - 1 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-6 h-6 text-xs rounded-md ${
                        pageNum === currentPage
                          ? "bg-indigo-600 text-white"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md ${
                  currentPage === totalPages
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Next
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
