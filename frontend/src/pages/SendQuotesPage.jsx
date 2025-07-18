// import React, { useEffect, useState } from "react";
// import InquiryCard from "../components/InquiryCard";

// const API_BASE_URL = "http://localhost:5000";

// const SendQuotesPage = () => {
//   const [completedInquiries, setCompletedInquiries] = useState([]);
//   const [fulfilledInquiries, setFulfilledInquiries] = useState([]);
//   const [activeTab, setActiveTab] = useState("completed");
//   const [marginMap, setMarginMap] = useState({});
//   const [discountMap, setDiscountMap] = useState({});
//   const [deliveryCharges, setDeliveryCharges] = useState({});
//   const [gstRates, setGstRates] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [showModal, setShowModal] = useState(false);
//   const [selectedInquiry, setSelectedInquiry] = useState(null);
//   const [emailForm, setEmailForm] = useState({
//     toEmails: "",
//     ccEmails: "",
//     subject: "",
//     message: "",
//   });

//   useEffect(() => {
//     fetchInquiries();
//   }, []);

//   const fetchInquiries = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem("token");

//       // Fetch completed inquiries
//       const completedResponse = await fetch(
//         `${API_BASE_URL}/api/inquiries/completed`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       // Fetch fulfilled inquiries
//       const fulfilledResponse = await fetch(
//         `${API_BASE_URL}/api/inquiries/fulfilled`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       if (!completedResponse.ok || !fulfilledResponse.ok) {
//         throw new Error("Failed to fetch inquiries");
//       }

//       const completedData = await completedResponse.json();
//       const fulfilledData = await fulfilledResponse.json();

//       setCompletedInquiries(completedData);
//       setFulfilledInquiries(fulfilledData);

//       // Initialize GST rates and discount with defaults for completed inquiries
//       const initialGstRates = {};
//       const initialDiscounts = {};
//       completedData.forEach((inquiry) => {
//         inquiry.products?.forEach((product) => {
//           initialGstRates[inquiry._id + product.productId] = 0;
//           initialDiscounts[inquiry._id + product.productId] = 0;
//         });
//       });
//       setGstRates(initialGstRates);
//       setDiscountMap(initialDiscounts);

//       setError(null);
//     } catch (err) {
//       console.error("Error loading inquiries:", err);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleMarginChange = (inquiryId, productId, margin) => {
//     setMarginMap((prev) => ({
//       ...prev,
//       [inquiryId + productId]: parseFloat(margin) || 0,
//     }));
//   };

//   const handleDiscountChange = (inquiryId, productId, discount) => {
//     setDiscountMap((prev) => ({
//       ...prev,
//       [inquiryId + productId]: parseFloat(discount) || 0,
//     }));
//   };

//   const handleDeliveryChargeChange = (inquiryId, charges) => {
//     setDeliveryCharges((prev) => ({
//       ...prev,
//       [inquiryId]: parseFloat(charges) || 0,
//     }));
//   };

//   const handleGstRateChange = (inquiryId, productId, rate) => {
//     setGstRates((prev) => ({
//       ...prev,
//       [inquiryId + productId]: parseFloat(rate) || 0,
//     }));
//   };

//   const openEmailModal = (inquiry) => {
//     setSelectedInquiry(inquiry);
//     setEmailForm({
//       toEmails: inquiry.customer?.email || "",
//       ccEmails: "",
//       subject: `Quotation for Inquiry ID: ${inquiry.inquiryId}`,
//       message: `Dear ${
//         inquiry.customer?.companyName || "Valued Customer"
//       },\n\nPlease find the attached quotation for your inquiry.\n\nRegards,\nCRM Team`,
//     });
//     setShowModal(true);
//   };

//   const sendResponse = async () => {
//     if (!selectedInquiry) return;

//     const { toEmails, ccEmails } = emailForm;

//     if (!toEmails.trim()) {
//       alert("Recipient email is required!");
//       return;
//     }

//     const quoteData = selectedInquiry.products.map((product) => {
//       const productId = product.productId;
//       const quote = selectedInquiry.supplierQuotes
//         ?.flatMap((s) => s.quotes)
//         ?.find((q) => q.productId === productId?.toString());

//       const basePrice = parseFloat(quote?.price) || 0;
//       const margin =
//         parseFloat(marginMap[selectedInquiry._id + productId]) || 0;
//       const discount =
//         parseFloat(discountMap[selectedInquiry._id + productId]) || 0;
//       const gstRate =
//         parseFloat(gstRates[selectedInquiry._id + productId]) || 0;

//       const prices = calculatePrice(basePrice, margin, discount, gstRate);

//       return {
//         name: product.name,
//         brand: product.brand,
//         quantity: product.quantity,
//         category: product.category,
//         description: product.description,
//         specifications: product.specifications,
//         uom: product.uom,
//         basePrice: parseFloat(basePrice.toFixed(2)),
//         margin: parseFloat(margin.toFixed(2)),
//         discount: parseFloat(discount.toFixed(2)),
//         gstRate: parseFloat(gstRate.toFixed(2)),
//         gstAmount: prices.gstAmount,
//         finalPrice: prices.finalPrice,
//       };
//     });

//     const deliveryChargeAmount =
//       parseFloat(deliveryCharges[selectedInquiry._id]) || 0;

//     try {
//       const token = localStorage.getItem("token");
//       const response = await fetch(`${API_BASE_URL}/api/sendQuoteResponse`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           toEmails: toEmails
//             .split(",")
//             .map((e) => e.trim())
//             .filter((e) => e),
//           ccEmails: ccEmails
//             ? ccEmails
//                 .split(",")
//                 .map((e) => e.trim())
//                 .filter((e) => e)
//             : [],
//           companyName: selectedInquiry.customer?.companyName || "Customer",
//           inquiryId: selectedInquiry.inquiryId,
//           quoteData,
//           deliveryCharges: deliveryChargeAmount,
//           subject: emailForm.subject,
//           message: emailForm.message,
//         }),
//       });

//       const result = await response.json();
//       if (response.ok) {
//         alert("Quote sent successfully!");
//         setShowModal(false);
//         setSelectedInquiry(null);
//         fetchInquiries();
//       } else {
//         alert(`Error: ${result.error}`);
//       }
//     } catch (err) {
//       console.error("Error sending response:", err);
//       alert("Failed to send response.");
//     }
//   };

//   const handleOrderAction = async (inquiryId, action) => {
//     if (!confirm(`Are you sure you want to ${action} this order?`)) return;

//     try {
//       const token = localStorage.getItem("token");
//       const response = await fetch(`${API_BASE_URL}/api/orders/${action}`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ inquiryId }),
//       });

//       const result = await response.json();
//       if (response.ok) {
//         alert(`Order ${action}ed successfully!`);
//         fetchInquiries();
//       } else {
//         alert(`Error: ${result.error}`);
//       }
//     } catch (err) {
//       console.error(`Error ${action}ing order:`, err);
//       alert(`Failed to ${action} order.`);
//     }
//   };

//   const handleSendClick = () => {
//     if (!selectedInquiry) return;
//     if (!confirm("Are you sure you want to send this quotation email?")) return;
//     sendResponse();
//   };

//   const calculatePrice = (basePrice, margin, discount, gstRate) => {
//     const base = parseFloat(basePrice) || 0;
//     const marginPercent = parseFloat(margin) || 0;
//     const discountPercent = parseFloat(discount) || 0;
//     const gst = parseFloat(gstRate) || 0;

//     const priceAfterMargin = base + (base * marginPercent) / 100;
//     const priceAfterDiscount =
//       priceAfterMargin - (priceAfterMargin * discountPercent) / 100;
//     const finalPrice = priceAfterDiscount + (priceAfterDiscount * gst) / 100;

//     return {
//       priceAfterMargin: parseFloat(priceAfterMargin.toFixed(2)),
//       priceAfterDiscount: parseFloat(priceAfterDiscount.toFixed(2)),
//       gstAmount: parseFloat(((priceAfterDiscount * gst) / 100).toFixed(2)),
//       finalPrice: parseFloat(finalPrice.toFixed(2)),
//     };
//   };

//   if (loading) {
//     return (
//       <div className="p-6">
//         <div className="max-w-6xl mx-auto">
//           <div className="text-center">
//             <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
//             <h1 className="text-2xl font-bold text-gray-800 mb-2">
//               Send Quotations
//             </h1>
//             <p className="text-gray-600">Loading inquiries...</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="p-6">
//         <div className="max-w-6xl mx-auto">
//           <div className="bg-white border rounded-lg p-6">
//             <h1 className="text-2xl font-bold text-gray-800 mb-4">
//               Send Quotations
//             </h1>
//             <div className="bg-red-50 border border-red-200 rounded p-4">
//               <p className="text-red-700">
//                 <strong>Error:</strong> {error}
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const currentInquiries =
//     activeTab === "completed" ? completedInquiries : fulfilledInquiries;

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">
//       <div className="max-w-7xl mx-auto">
//         <div className="mb-6">
//           <h1 className="text-2xl font-bold text-gray-800 mb-2">
//             Send Quotations
//           </h1>
//           <p className="text-gray-600">
//             Review and send quotations to customers
//           </p>
//         </div>

//         {/* Tab Navigation */}
//         <div className="mb-6">
//           <div className="border-b border-gray-200">
//             <nav className="-mb-px flex space-x-8">
//               <button
//                 onClick={() => setActiveTab("completed")}
//                 className={`py-2 px-1 border-b-2 font-medium text-sm ${
//                   activeTab === "completed"
//                     ? "border-blue-500 text-blue-600"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                 }`}
//               >
//                 Send Quote to Company ({completedInquiries.length})
//               </button>
//               <button
//                 onClick={() => setActiveTab("fulfilled")}
//                 className={`py-2 px-1 border-b-2 font-medium text-sm ${
//                   activeTab === "fulfilled"
//                     ? "border-blue-500 text-blue-600"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                 }`}
//               >
//                 Pending Updates ({fulfilledInquiries.length})
//               </button>
//             </nav>
//           </div>
//         </div>

//         {currentInquiries.length === 0 ? (
//           <div className="bg-white border rounded-lg p-6">
//             <div className="text-center py-8">
//               <p className="text-gray-500">No {activeTab} inquiries found.</p>
//             </div>
//           </div>
//         ) : (
//           <div className="space-y-6">
//             {currentInquiries.map((inquiry) => (
//               <InquiryCard
//                 key={inquiry._id}
//                 inquiry={inquiry}
//                 activeTab={activeTab}
//                 marginMap={marginMap}
//                 discountMap={discountMap}
//                 deliveryCharges={deliveryCharges}
//                 gstRates={gstRates}
//                 onMarginChange={handleMarginChange}
//                 onDiscountChange={handleDiscountChange}
//                 onDeliveryChargeChange={handleDeliveryChargeChange}
//                 onGstRateChange={handleGstRateChange}
//                 onOrderAction={handleOrderAction}
//                 onOpenEmailModal={openEmailModal}
//                 calculatePrice={calculatePrice}
//               />
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Email Modal */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
//             <h2 className="text-xl font-bold mb-4">Send Quotation Email</h2>

//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   To (Email addresses)
//                 </label>
//                 <input
//                   type="email"
//                   value={emailForm.toEmails}
//                   onChange={(e) =>
//                     setEmailForm({ ...emailForm, toEmails: e.target.value })
//                   }
//                   className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="customer@company.com, another@company.com"
//                   required
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   CC (Optional)
//                 </label>
//                 <input
//                   type="email"
//                   value={emailForm.ccEmails}
//                   onChange={(e) =>
//                     setEmailForm({ ...emailForm, ccEmails: e.target.value })
//                   }
//                   className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="manager@yourcompany.com"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Subject
//                 </label>
//                 <input
//                   type="text"
//                   value={emailForm.subject}
//                   onChange={(e) =>
//                     setEmailForm({ ...emailForm, subject: e.target.value })
//                   }
//                   className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
//                   required
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Message
//                 </label>
//                 <textarea
//                   value={emailForm.message}
//                   onChange={(e) =>
//                     setEmailForm({ ...emailForm, message: e.target.value })
//                   }
//                   rows={4}
//                   className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
//                   required
//                 />
//               </div>
//             </div>

//             <div className="flex justify-end space-x-3 mt-6">
//               <button
//                 onClick={() => setShowModal(false)}
//                 className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSendClick}
//                 className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//               >
//                 Send Email
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default SendQuotesPage;
import React, { useEffect, useState } from "react";
import InquiryCard from "../components/InquiryCard";

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
      const completedResponse = await fetch(
        `${API_BASE_URL}/api/inquiries/completed`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Fetch fulfilled inquiries
      const fulfilledResponse = await fetch(
        `${API_BASE_URL}/api/inquiries/fulfilled`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!completedResponse.ok || !fulfilledResponse.ok) {
        throw new Error("Failed to fetch inquiries");
      }

      const completedData = await completedResponse.json();
      const fulfilledData = await fulfilledResponse.json();

      setCompletedInquiries(completedData);
      setFulfilledInquiries(fulfilledData);

      // Initialize GST rates, discounts, and margins with defaults for completed inquiries
      const initialGstRates = {};
      const initialDiscounts = {};
      const initialMargins = {};
      const initialDeliveryCharges = {};

      completedData.forEach((inquiry) => {
        inquiry.products?.forEach((product) => {
          const key = inquiry._id + product.productId;
          initialGstRates[key] = 0;
          initialDiscounts[key] = 0;
          initialMargins[key] = 0;
        });
        initialDeliveryCharges[inquiry._id] = 0;
      });

      setGstRates(initialGstRates);
      setDiscountMap(initialDiscounts);
      setMarginMap(initialMargins);
      setDeliveryCharges(initialDeliveryCharges);

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

  const openEmailModal = (inquiry) => {
    setSelectedInquiry(inquiry);
    
    // Check if this is a revision (inquiry was edited before)
    const isRevision = inquiry.status === 'Completed' && inquiry.orderId;
    
    setEmailForm({
      toEmails: inquiry.customer?.email || "",
      ccEmails: "",
      subject: `${isRevision ? 'REVISED ' : ''}Quotation for Inquiry ID: ${inquiry.inquiryId}`,
      message: `Dear ${
        inquiry.customer?.companyName || "Valued Customer"
      },\n\n${isRevision ? 'Please find the attached revised quotation with updated pricing for your inquiry.' : 'Please find the attached quotation for your inquiry.'}\n\nRegards,\nCRM Team`,
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
      const margin =
        parseFloat(marginMap[selectedInquiry._id + productId]) || 0;
      const discount =
        parseFloat(discountMap[selectedInquiry._id + productId]) || 0;
      const gstRate =
        parseFloat(gstRates[selectedInquiry._id + productId]) || 0;

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

    const deliveryChargeAmount =
      parseFloat(deliveryCharges[selectedInquiry._id]) || 0;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/sendQuoteResponse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          toEmails: toEmails
            .split(",")
            .map((e) => e.trim())
            .filter((e) => e),
          ccEmails: ccEmails
            ? ccEmails
                .split(",")
                .map((e) => e.trim())
                .filter((e) => e)
            : [],
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
        alert(result.message || "Quote sent successfully!");
        setShowModal(false);
        setSelectedInquiry(null);
        // Reset form data for this inquiry
        resetInquiryData(selectedInquiry._id);
        fetchInquiries();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      console.error("Error sending response:", err);
      alert("Failed to send response.");
    }
  };

  const resetInquiryData = (inquiryId) => {
    // Reset all form data for this inquiry
    setMarginMap(prev => {
      const newMap = { ...prev };
      Object.keys(newMap).forEach(key => {
        if (key.startsWith(inquiryId)) {
          delete newMap[key];
        }
      });
      return newMap;
    });

    setDiscountMap(prev => {
      const newMap = { ...prev };
      Object.keys(newMap).forEach(key => {
        if (key.startsWith(inquiryId)) {
          delete newMap[key];
        }
      });
      return newMap;
    });

    setGstRates(prev => {
      const newMap = { ...prev };
      Object.keys(newMap).forEach(key => {
        if (key.startsWith(inquiryId)) {
          delete newMap[key];
        }
      });
      return newMap;
    });

    setDeliveryCharges(prev => {
      const newMap = { ...prev };
      delete newMap[inquiryId];
      return newMap;
    });
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
        if (action === 'edit') {
          alert("Order moved to editing mode. You can now modify the pricing and resend the quotation.");
          // Switch to completed tab to show the inquiry for editing
          setActiveTab("completed");
        } else {
          alert(`Order ${action}ed successfully!`);
        }
        fetchInquiries();
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

  const calculatePrice = (basePrice, margin, discount, gstRate) => {
    const base = parseFloat(basePrice) || 0;
    const marginPercent = parseFloat(margin) || 0;
    const discountPercent = parseFloat(discount) || 0;
    const gst = parseFloat(gstRate) || 0;

    const priceAfterMargin = base + (base * marginPercent) / 100;
    const priceAfterDiscount =
      priceAfterMargin - (priceAfterMargin * discountPercent) / 100;
    const finalPrice = priceAfterDiscount + (priceAfterDiscount * gst) / 100;

    return {
      priceAfterMargin: parseFloat(priceAfterMargin.toFixed(2)),
      priceAfterDiscount: parseFloat(priceAfterDiscount.toFixed(2)),
      gstAmount: parseFloat(((priceAfterDiscount * gst) / 100).toFixed(2)),
      finalPrice: parseFloat(finalPrice.toFixed(2)),
    };
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Send Quotations
            </h1>
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
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Send Quotations
            </h1>
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-700">
                <strong>Error:</strong> {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentInquiries =
    activeTab === "completed" ? completedInquiries : fulfilledInquiries;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Send Quotations
          </h1>
          <p className="text-gray-600">
            Review and send quotations to customers
          </p>
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
                Send Quote to Company ({completedInquiries.length})
              </button>
              <button
                onClick={() => setActiveTab("fulfilled")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "fulfilled"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Sent Quotations ({fulfilledInquiries.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {currentInquiries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No {activeTab === "completed" ? "completed" : "fulfilled"} inquiries found.
              </p>
            </div>
          ) : (
            currentInquiries.map((inquiry) => (
              <InquiryCard
                key={inquiry._id}
                inquiry={inquiry}
                activeTab={activeTab}
                marginMap={marginMap}
                discountMap={discountMap}
                deliveryCharges={deliveryCharges}
                gstRates={gstRates}
                onMarginChange={handleMarginChange}
                onDiscountChange={handleDiscountChange}
                onDeliveryChargeChange={handleDeliveryChargeChange}
                onGstRateChange={handleGstRateChange}
                onOrderAction={handleOrderAction}
                onOpenEmailModal={openEmailModal}
                calculatePrice={calculatePrice}
              />
            ))
          )}
        </div>

        {/* Email Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
              <h3 className="text-lg font-semibold mb-4">Send Quotation Email</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Emails (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={emailForm.toEmails}
                    onChange={(e) => setEmailForm({...emailForm, toEmails: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    placeholder="customer@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CC Emails (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={emailForm.ccEmails}
                    onChange={(e) => setEmailForm({...emailForm, ccEmails: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    placeholder="manager@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    value={emailForm.message}
                    onChange={(e) => setEmailForm({...emailForm, message: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
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
    </div>
  );
};

export default SendQuotesPage;