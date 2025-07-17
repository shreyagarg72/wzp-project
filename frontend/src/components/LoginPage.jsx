import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LoginPage() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    isAdmin: false,
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          isAdmin: form.isAdmin,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Login successful!");
        localStorage.setItem("token", data.token);
        navigate("/dashboard"); // <-- should work
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <ToastContainer />
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="max-w-96 w-full text-center border border-gray-300/60 rounded-2xl px-8 bg-white"
        >
          <h1 className="text-gray-900 text-3xl mt-10 font-medium">Login</h1>
          <p className="text-gray-500 text-sm mt-2">
            Please sign in to continue
          </p>

          {/* Username Input */}
          <div className="flex items-center w-full mt-10 bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
            <input
              type="text"
              placeholder="Username"
              className="bg-transparent text-gray-500 placeholder-gray-500 outline-none text-sm w-full h-full"
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>

          {/* Password Input */}
          <div className="flex items-center mt-4 w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
            <input
              type="password"
              placeholder="Password"
              className="bg-transparent text-gray-500 placeholder-gray-500 outline-none text-sm w-full h-full"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {/* Admin Checkbox */}
          <div className="mt-4 text-left">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isAdmin}
                onChange={(e) =>
                  setForm({ ...form, isAdmin: e.target.checked })
                }
                className="accent-indigo-500"
              />
              Are you an admin?
            </label>
          </div>

          <button
            type="submit"
            className="mt-4 w-full h-11 rounded-full text-white bg-indigo-500 hover:opacity-90 transition-opacity"
          >
            Login
          </button>

          <p className="text-gray-500 text-sm mt-3 mb-11"></p>
        </form>

        <div className="text-center mt-6 text-gray-400 text-xs">
          © 2025 WZP. All rights reserved.
        </div>
      </div>
    </div>
  );
}
