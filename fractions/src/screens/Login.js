import React, { useState } from "react";
import { Eye, EyeOff, User, Lock, LogIn } from "lucide-react";

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert("Login successful! (Demo)");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-300 opacity-10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-300 opacity-10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        {/* Floating quiz elements */}
        <div className="absolute -top-8 -left-8 bg-white rounded-2xl shadow-2xl p-4 transform rotate-12 hover:rotate-0 transition-transform duration-300">
          <div className="text-4xl">🎯</div>
        </div>
        <div className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-2xl p-4 transform -rotate-12 hover:rotate-0 transition-transform duration-300">
          <div className="text-4xl">🎮</div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-0 hover:opacity-5 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="inline-block bg-white rounded-2xl p-4 mb-4 shadow-lg transform hover:rotate-6 transition-transform duration-300">
                <div className="text-6xl">🎲</div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Admin Portal
              </h1>
              <p className="text-orange-100 text-sm">
                Quiz Game Management System
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="p-8 space-y-6">
            {/* Username Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Username
              </label>
              <div
                className={`relative transform transition-all duration-300 ${
                  focusedInput === "username" ? "scale-105" : ""
                }`}
              >
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-500">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedInput("username")}
                  onBlur={() => setFocusedInput("")}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-all duration-300 hover:border-orange-300"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div
                className={`relative transform transition-all duration-300 ${
                  focusedInput === "password" ? "scale-105" : ""
                }`}
              >
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-500">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput("")}
                  className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-all duration-300 hover:border-orange-300"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                />
                <span className="text-gray-600 group-hover:text-orange-500 transition-colors duration-200">
                  Remember me
                </span>
              </label>
              <button
                type="button"
                className="text-orange-500 hover:text-orange-600 font-semibold transition-colors duration-200"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn size={24} />
                  <span>Login to Dashboard</span>
                </>
              )}
            </button>

            {/* Additional Info */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-500">
                Need help?{" "}
                <button
                  type="button"
                  className="text-orange-500 hover:text-orange-600 font-semibold"
                >
                  Contact Support
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Footer decoration */}
        <div className="text-center mt-8 space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-white rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className="w-2 h-2 bg-white rounded-full animate-bounce"
              style={{ animationDelay: "0.4s" }}
            ></div>
          </div>
          <p className="text-white text-sm font-semibold">
            Powered by Quiz Pro
          </p>
        </div>
      </div>
    </div>
  );
}
