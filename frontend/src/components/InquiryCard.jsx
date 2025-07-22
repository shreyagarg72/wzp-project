// import React from "react";

// const InquiryCard = ({
//   inquiry,
//   activeTab,
//   marginMap,
//   discountMap,
//   deliveryCharges,
//   gstRates,
//   onMarginChange,
//   onDiscountChange,
//   onDeliveryChargeChange,
//   onGstRateChange,
//   onOrderAction,
//   onOpenEmailModal,
//   calculatePrice,
// }) => {
//   const calculateTotals = (inquiry) => {
//     let subtotal = 0;
//     let totalGstAmount = 0;
//     let totalDiscount = 0;

//     inquiry.products?.forEach((product) => {
//       const quote = inquiry.supplierQuotes
//         ?.flatMap((s) => s.quotes)
//         ?.find((q) => q.productId === product.productId?.toString());
//       const base = parseFloat(quote?.price) || 0;
//       const margin =
//         parseFloat(marginMap[inquiry._id + product.productId]) || 0;
//       const discount =
//         parseFloat(discountMap[inquiry._id + product.productId]) || 0;
//       const gstRate =
//         parseFloat(gstRates[inquiry._id + product.productId]) || 0;

//       const prices = calculatePrice(base, margin, discount, gstRate);

//       subtotal += prices.priceAfterDiscount;
//       totalGstAmount += prices.gstAmount;
//       totalDiscount += prices.priceAfterMargin - prices.priceAfterDiscount;
//     });

//     const delivery = parseFloat(deliveryCharges[inquiry._id]) || 0;
//     const total = subtotal + delivery + totalGstAmount;

//     return {
//       subtotal: parseFloat(subtotal.toFixed(2)),
//       delivery: parseFloat(delivery.toFixed(2)),
//       gstAmount: parseFloat(totalGstAmount.toFixed(2)),
//       totalDiscount: parseFloat(totalDiscount.toFixed(2)),
//       total: parseFloat(total.toFixed(2)),
//     };
//   };

//   if (activeTab === "fulfilled") {
//     // Fulfilled inquiries - simple view with action buttons
//     return (
//       <div className="bg-white border rounded-lg">
//         <div className="bg-green-600 text-white p-4 rounded-t-lg">
//           <div className="flex justify-between items-center">
//             <div>
//               <h2 className="text-xl font-bold">
//                 Inquiry #{inquiry.inquiryId}
//               </h2>
//               <p className="text-green-100">
//                 {inquiry.customer?.companyName || "N/A"}
//               </p>
//             </div>
//             <div className="text-right">
//               <p className="text-sm">Status: Fulfilled</p>
//               <p className="text-sm">
//                 Products: {inquiry.products?.length || 0}
//               </p>
//             </div>
//           </div>
//         </div>
//         <div className="p-4">
//           <div className="flex justify-end space-x-3">
//             // Add this in the fulfilled inquiries section, before the action
//             buttons div
//             <div className="mb-4">
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Expected Payment Days (after delivery)
//               </label>
//               <input
//                 type="number"
//                 className="w-32 px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
//                 placeholder="Days"
//                 min="0"
//                 step="1"
//                 value=""
//                 onChange=""
//               />
//             </div>
//             <button
//               onClick={() => onOrderAction(inquiry.inquiryId, "accept")}
//               className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
//             >
//               Accept
//             </button>
//             <button
//               onClick={() => onOrderAction(inquiry.inquiryId, "edit")}
//               className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//             >
//               Edit
//             </button>
//             <button
//               onClick={() => onOrderAction(inquiry.inquiryId, "decline")}
//               className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
//             >
//               Decline
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Completed inquiries - full view with quotation functionality
//   const { subtotal, delivery, gstAmount, totalDiscount, total } =
//     calculateTotals(inquiry);

//   return (
//     <div className="bg-white border rounded-lg">
//       <div className="bg-blue-600 text-white p-4 rounded-t-lg">
//         <div className="flex justify-between items-center">
//           <div>
//             <h2 className="text-xl font-bold">Inquiry #{inquiry.inquiryId}</h2>
//             <p className="text-blue-100">
//               {inquiry.customer?.companyName || "N/A"}
//             </p>
//           </div>
//           <div className="text-right">
//             <p className="text-sm">Products: {inquiry.products?.length || 0}</p>
//           </div>
//         </div>
//       </div>

//       <div className="p-4">
//         <div className="overflow-x-auto">
//           <table className="w-full border-collapse">
//             <thead>
//               <tr className="bg-gray-50">
//                 <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
//                   Product
//                 </th>
//                 <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
//                   Brand
//                 </th>
//                 <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
//                   Specifications
//                 </th>
//                 <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
//                   Qty
//                 </th>
//                 <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
//                   Base Price
//                 </th>
//                 <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
//                   Margin %
//                 </th>
//                 <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
//                   Discount %
//                 </th>
//                 <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
//                   GST %
//                 </th>
//                 <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
//                   Final Price
//                 </th>
//               </tr>
//             </thead>
//             <tbody>
//               {inquiry.products?.map((product, index) => {
//                 const supplierQuote = inquiry.supplierQuotes
//                   ?.flatMap((s) => s.quotes)
//                   ?.find((q) => q.productId === product.productId?.toString());
//                 const basePrice = parseFloat(supplierQuote?.price) || 0;
//                 const margin =
//                   parseFloat(marginMap[inquiry._id + product.productId]) || 0;
//                 const discount =
//                   parseFloat(discountMap[inquiry._id + product.productId]) || 0;
//                 const gstRate =
//                   parseFloat(gstRates[inquiry._id + product.productId]) || 0;

//                 const prices = calculatePrice(
//                   basePrice,
//                   margin,
//                   discount,
//                   gstRate
//                 );

//                 return (
//                   <tr
//                     key={product.productId}
//                     className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
//                   >
//                     <td className="border border-gray-300 px-3 py-2 text-sm">
//                       {product.name}
//                     </td>
//                     <td className="border border-gray-300 px-3 py-2 text-sm">
//                       {product.brand}
//                     </td>
//                     <td
//                       className="border border-gray-300 px-3 py-2 text-sm max-w-xs truncate"
//                       title={product.specifications}
//                     >
//                       {product.specifications}
//                     </td>
//                     <td className="border border-gray-300 px-3 py-2 text-sm">
//                       <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
//                         {product.quantity}
//                       </span>
//                     </td>
//                     <td className="border border-gray-300 px-3 py-2 text-sm font-medium">
//                       ₹{basePrice.toFixed(2)}
//                     </td>
//                     <td className="border border-gray-300 px-3 py-2">
//                       <div className="flex items-center">
//                         <input
//                           type="number"
//                           className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
//                           value={margin}
//                           onChange={(e) =>
//                             onMarginChange(
//                               inquiry._id,
//                               product.productId,
//                               e.target.value
//                             )
//                           }
//                           placeholder="0"
//                           min="0"
//                           step="0.1"
//                         />
//                         <span className="ml-1 text-sm text-gray-500">%</span>
//                       </div>
//                     </td>
//                     <td className="border border-gray-300 px-3 py-2">
//                       <div className="flex items-center">
//                         <input
//                           type="number"
//                           className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
//                           value={discount}
//                           onChange={(e) =>
//                             onDiscountChange(
//                               inquiry._id,
//                               product.productId,
//                               e.target.value
//                             )
//                           }
//                           placeholder="0"
//                           min="0"
//                           step="0.1"
//                         />
//                         <span className="ml-1 text-sm text-gray-500">%</span>
//                       </div>
//                     </td>
//                     <td className="border border-gray-300 px-3 py-2">
//                       <div className="flex items-center">
//                         <input
//                           type="number"
//                           className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
//                           value={gstRate}
//                           onChange={(e) =>
//                             onGstRateChange(
//                               inquiry._id,
//                               product.productId,
//                               e.target.value
//                             )
//                           }
//                           placeholder="0"
//                           min="0"
//                           max="100"
//                           step="0.1"
//                         />
//                         <span className="ml-1 text-sm text-gray-500">%</span>
//                       </div>
//                     </td>
//                     <td className="border border-gray-300 px-3 py-2 text-sm font-bold text-green-600">
//                       ₹{prices.finalPrice.toFixed(2)}
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>

//         <div className="mt-6 bg-gray-50 rounded-lg p-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Delivery Charges
//               </label>
//               <div className="flex items-center">
//                 <span className="text-sm text-gray-500 mr-2">₹</span>
//                 <input
//                   type="number"
//                   value={deliveryCharges[inquiry._id] || ""}
//                   onChange={(e) =>
//                     onDeliveryChargeChange(inquiry._id, e.target.value)
//                   }
//                   className="w-32 px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="0.00"
//                   min="0"
//                   step="0.01"
//                 />
//               </div>
//             </div>

//             <div className="text-right">
//               <div className="space-y-2">
//                 <div className="flex justify-between text-sm">
//                   <span>Subtotal:</span>
//                   <span>₹{subtotal.toFixed(2)}</span>
//                 </div>
//                 <div className="flex justify-between text-sm">
//                   <span>Total Discount:</span>
//                   <span className="text-red-600">
//                     -₹{totalDiscount.toFixed(2)}
//                   </span>
//                 </div>
//                 <div className="flex justify-between text-sm">
//                   <span>Total GST:</span>
//                   <span>₹{gstAmount.toFixed(2)}</span>
//                 </div>
//                 <div className="flex justify-between text-sm">
//                   <span>Delivery Charges:</span>
//                   <span>₹{delivery.toFixed(2)}</span>
//                 </div>
//                 <div className="border-t pt-2">
//                   <div className="flex justify-between text-lg font-bold">
//                     <span>Total Amount:</span>
//                     <span>₹{total.toFixed(2)}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="mt-4 text-right">
//             <button
//               onClick={() => onOpenEmailModal(inquiry)}
//               className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               Send Response to Company
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default InquiryCard;
import React from "react";

const InquiryCard = ({
  inquiry,
  activeTab,
  marginMap,
  discountMap,
  deliveryCharges,
  gstRates,
  paymentDaysMap,
  onMarginChange,
  onDiscountChange,
  onDeliveryChargeChange,
  onGstRateChange,
  onPaymentDaysChange,
  onOrderAction,
  onOpenEmailModal,
  calculatePrice,
}) => {
  const calculateTotals = (inquiry) => {
    let subtotal = 0;
    let totalGstAmount = 0;
    let totalDiscount = 0;

    inquiry.products?.forEach((product) => {
      const quote = inquiry.supplierQuotes
        ?.flatMap((s) => s.quotes)
        ?.find((q) => q.productId === product.productId?.toString());
      const base = parseFloat(quote?.price) || 0;
      const margin =
        parseFloat(marginMap[inquiry._id + product.productId]) || 0;
      const discount =
        parseFloat(discountMap[inquiry._id + product.productId]) || 0;
      const gstRate =
        parseFloat(gstRates[inquiry._id + product.productId]) || 0;

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

  if (activeTab === "fulfilled") {
    // Fulfilled inquiries - simple view with action buttons and payment days field
    return (
      <div className="bg-white border rounded-lg">
        <div className="bg-green-600 text-white p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">
                Inquiry #{inquiry.inquiryId}
              </h2>
              <p className="text-green-100">
                {inquiry.customer?.companyName || "N/A"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm">Status: Fulfilled</p>
              <p className="text-sm">
                Products: {inquiry.products?.length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Payment Days (after delivery)
            </label>
            <input
              type="number"
              className="w-32 px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              placeholder="Days"
              min="0"
              step="1"
              value={paymentDaysMap[inquiry.inquiryId] || ""}
              onChange={(e) =>
                onPaymentDaysChange(inquiry.inquiryId, e.target.value)
              }
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => onOrderAction(inquiry.inquiryId, "accept")}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Accept
            </button>
            <button
              onClick={() => onOrderAction(inquiry.inquiryId, "edit")}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Edit
            </button>
            <button
              onClick={() => onOrderAction(inquiry.inquiryId, "decline")}
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
  const { subtotal, delivery, gstAmount, totalDiscount, total } =
    calculateTotals(inquiry);

  return (
    <div className="bg-white border rounded-lg">
      <div className="bg-blue-600 text-white p-4 rounded-t-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Inquiry #{inquiry.inquiryId}</h2>
            <p className="text-blue-100">
              {inquiry.customer?.companyName || "N/A"}
            </p>
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
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
                  Product
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
                  Brand
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
                  Specifications
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
                  Qty
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
                  Base Price
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
                  Margin %
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
                  Discount %
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
                  GST %
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
                  Final Price
                </th>
              </tr>
            </thead>
            <tbody>
              {inquiry.products?.map((product, index) => {
                const supplierQuote = inquiry.supplierQuotes
                  ?.flatMap((s) => s.quotes)
                  ?.find((q) => q.productId === product.productId?.toString());
                const basePrice = parseFloat(supplierQuote?.price) || 0;
                const margin =
                  parseFloat(marginMap[inquiry._id + product.productId]) || 0;
                const discount =
                  parseFloat(discountMap[inquiry._id + product.productId]) || 0;
                const gstRate =
                  parseFloat(gstRates[inquiry._id + product.productId]) || 0;

                const prices = calculatePrice(
                  basePrice,
                  margin,
                  discount,
                  gstRate
                );

                return (
                  <tr
                    key={product.productId}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="border border-gray-300 px-3 py-2 text-sm">
                      {product.name}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">
                      {product.brand}
                    </td>
                    <td
                      className="border border-gray-300 px-3 py-2 text-sm max-w-xs truncate"
                      title={product.specifications}
                    >
                      {product.specifications}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {product.quantity}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium">
                      ₹{basePrice.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <div className="flex items-center">
                        <input
                          type="number"
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          value={margin}
                          onChange={(e) =>
                            onMarginChange(
                              inquiry._id,
                              product.productId,
                              e.target.value
                            )
                          }
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
                          onChange={(e) =>
                            onDiscountChange(
                              inquiry._id,
                              product.productId,
                              e.target.value
                            )
                          }
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
                          onChange={(e) =>
                            onGstRateChange(
                              inquiry._id,
                              product.productId,
                              e.target.value
                            )
                          }
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Charges
              </label>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">₹</span>
                <input
                  type="number"
                  value={deliveryCharges[inquiry._id] || ""}
                  onChange={(e) =>
                    onDeliveryChargeChange(inquiry._id, e.target.value)
                  }
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
                  <span className="text-red-600">
                    -₹{totalDiscount.toFixed(2)}
                  </span>
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
              onClick={() => onOpenEmailModal(inquiry)}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Send Response to Company
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InquiryCard;