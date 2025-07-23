import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;;

export const customerService = {
  // Fetch all customers
  fetchCustomers: async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/customers`);

      // Ensure the response data is an array
      if (Array.isArray(res.data)) {
        return res.data;
      } else if (res.data && Array.isArray(res.data.customers)) {
        return res.data.customers;
      } else {
        console.warn("API response is not an array:", res.data);
        return [];
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw new Error("Failed to fetch customers");
    }
  },

  // Add a new customer
  addCustomer: async (customerData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API_BASE_URL}/api/customers`, customerData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error adding customer:", error);
      throw new Error("Failed to add customer");
    }
  },

  // Submit an inquiry
  submitInquiry: async (inquiryData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/api/inquiries`,
        inquiryData,{headers: {
          Authorization: `Bearer ${token}`,
        },
      }
      );
      return response.data;
    } catch (error) {
      console.error("Error submitting inquiry:", error);

      // Handle different error types
      if (error.response) {
        // Server responded with error status
        const errorMessage =
          error.response.data?.error ||
          error.response.data?.message ||
          "Server error occurred";
        throw new Error(`Failed to submit inquiry: ${errorMessage}`);
      } else if (error.request) {
        // Request was made but no response received
        throw new Error("Failed to submit inquiry: No response from server");
      } else {
        // Something else happened
        throw new Error(`Failed to submit inquiry: ${error.message}`);
      }
    }
  },
};
