import React, { useState } from "react";
import { Eye, EyeOff, User, Lock, LogIn } from "lucide-react";
import { supabase } from "../supabase";
const logo = process.env.PUBLIC_URL + "/logo.png";

export default function AdminLogin({ onLoggedIn }) {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState(""); // email or username
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setIsLoading(true);
    try {
      // Allow email login (recommended)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username.trim().toLowerCase(),
        password,
      });
      if (error) {
        alert(error.message);
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        
        // Fetch teacher data from database
        const { data: teacher } = await supabase
          .from("teachers")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!teacher) {
          // first-time login: create teacher profile row
          await supabase.from("teachers").insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || null,
            username: user.user_metadata?.username || null,
          });
        } else {
          // update last_login
          await supabase
            .from("teachers")
            .update({ last_login: new Date().toISOString() })
            .eq("id", user.id);
        }

        // Pass user with teacher data merged
        const enrichedUser = {
          ...user,
          user_metadata: {
            ...user.user_metadata,
            full_name: teacher?.full_name || user.user_metadata?.full_name,
            username: teacher?.username || user.user_metadata?.username,
          }
        };
        
        onLoggedIn && onLoggedIn(enrichedUser);
      }
    } catch (err) {
      alert("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
        <div className="absolute -top-20 -left-20 bg-white rounded-2xl shadow-2xl p-4 transform rotate-12 hover:rotate-0 transition-transform duration-300">
          <div className="text-4xl">
            <img src={logo} alt="Logo" className="h-12 w-12 sm:h-16 sm:w-16" />
          </div>
        </div>
        <div className="absolute -top-20 -right-20 bg-white rounded-2xl shadow-2xl p-4 transform -rotate-12 hover:rotate-0 transition-transform duration-300">
          <div className="text-4xl">
            <img src={logo} alt="Logo" className="h-12 w-12 sm:h-16 sm:w-16" />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-0 hover:opacity-5 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="inline-block bg-white rounded-2xl p-4 mb-4 shadow-lg transform hover:rotate-6 transition-transform duration-300">
                <div className="text-6xl">
                  <img
                    src={logo}
                    alt="Logo"
                    className="h-12 w-12 sm:h-16 sm:w-16"
                  />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Admin Portal
              </h1>
              <p className="text-orange-100 text-sm">Games of Fractions</p>
              <p className="text-orange-100 text-sm">
                PLease login your account
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="p-8 space-y-6">
            {/* Username Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Email Address
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
            Powered by Kenn Depaz
          </p>
        </div>
      </div>
    </div>
  );
}
