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
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    console.log("Login: Starting login...");
    setIsLoading(true);
    setErrorMessage("");
    
    try {
      // Step 1: Authenticate user credentials
      console.log("Login: Calling signInWithPassword...");
      
      const loginPromise = supabase.auth.signInWithPassword({
        email: username.trim().toLowerCase(),
        password,
      });
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Login timeout")), 15000)
      );
      
      const { data, error } = await Promise.race([loginPromise, timeoutPromise]);
      
      console.log("Login: signInWithPassword completed");
      
      if (error) {
        console.log("Login: Error:", error.message);
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }
      
      const user = data.user;
      console.log("Login: User authenticated:", user.id);
      console.log("Login: Session created:", !!data.session);
      if (data.session) {
        console.log("Login: Session access_token exists:", !!data.session.access_token);
        console.log("Login: Session expires_at:", data.session.expires_at);
      }

      // Step 2: IMMEDIATELY check if user is a student (should be blocked)
      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (student) {
        // User is a student - sign out IMMEDIATELY before any state change
        await supabase.auth.signOut();
        setErrorMessage("Access denied. Students cannot access the web portal. Please use the mobile app.");
        setIsLoading(false);
        return;
      }

      // Step 3: Check if user is a teacher (required for web access)
      const { data: teacher } = await supabase
        .from("teachers")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!teacher) {
        // User is not a teacher - sign out IMMEDIATELY
        await supabase.auth.signOut();
        setErrorMessage("Access denied. Only teachers can access the web portal.");
        setIsLoading(false);
        return;
      }

      // Step 4: Update last_login for teacher
      await supabase
        .from("teachers")
        .update({ last_login: new Date().toISOString() })
        .eq("id", user.id);

      // Step 5: Only call onLoggedIn if user is verified as a teacher
      console.log("Login: Teacher verified, session should be persisted");
      console.log("Login: Checking localStorage after login...");
      const savedSession = localStorage.getItem('supabase.auth.token');
      console.log("Login: Session saved to localStorage:", !!savedSession);
      
      setIsLoading(false);
      if (onLoggedIn) {
        console.log("Login: Calling onLoggedIn callback");
        onLoggedIn();
      }
    } catch (err) {
      console.error("Login error:", err);
      // Make sure to sign out if something went wrong
      if (err.message === "Login timeout") {
        setErrorMessage("Login is taking too long. Please check your internet connection and try again.");
      } else {
        setErrorMessage("Login failed. Please try again.");
      }
      try {
        await supabase.auth.signOut();
      } catch (signOutErr) {
        console.error("Sign out error:", signOutErr);
      }
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
            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 animate-shake">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-500"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

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
          <p className="text-white text-sm font-semibold">Powered by Pogi</p>
        </div>
      </div>
    </div>
  );
}
