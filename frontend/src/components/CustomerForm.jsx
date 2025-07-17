import React from "react";

const CustomerForm = ({
  form,
  setForm,
  showForm,
  submitting,
  error,
  handleSubmit,
  closeForm,
}) => {
  const formatFieldName = (key) => {
    return (
      key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")
    );
  };

  return (
    <>
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
    </>
  );
};

export default CustomerForm;
