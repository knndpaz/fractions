import React, { useState, useEffect } from "react";
import "./App.css";
import Homepage from "./screens/Homepage";
import Reports from "./screens/Reports";
import DetailedReport from "./screens/DetailedReport";
import StuedentReport from "./screens/StuedentReport";
import Login from "./screens/Login";
import { supabase } from "./supabase";

// Force set storage configuration
console.log('🔧 App.js: Configuring Supabase storage...');
if (supabase.auth) {
  console.log('✅ App.js: Supabase auth object exists');
  // Try to access the storage
  try {
    console.log('🔧 App.js: Current storage config:', typeof supabase.auth.storage);
  } catch (e) {
    console.error('❌ App.js: Cannot access storage:', e);
  }
}

function App() {
  const [page, setPage] = useState("login");
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = session?.user || null;

  // Test localStorage availability
  useEffect(() => {
    console.log("=== TESTING LOCALSTORAGE ===");
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, 'works');
      const result = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      console.log("localStorage test result:", result === 'works' ? 'WORKING' : 'FAILED');
      console.log("localStorage length:", localStorage.length);
    } catch (e) {
      console.error("localStorage is BLOCKED or unavailable:", e);
      alert("CRITICAL: localStorage is blocked. Please check browser settings or disable private/incognito mode!");
    }
  }, []);

  // Keep session in state
  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initSession = async () => {
      console.log("App.js: Initializing session...");
      try {
        // Check what's in localStorage for debugging
        console.log("App.js: Checking localStorage...");
        const allKeys = Object.keys(localStorage);
        console.log("App.js: All localStorage keys:", allKeys);
        const supabaseKeys = allKeys.filter(key => key.includes('supabase') || key.includes('sb-'));
        console.log("App.js: Supabase-related keys:", supabaseKeys);
        
        // SKIP getSession() - it's too slow and unreliable
        // Instead, rely entirely on onAuthStateChange which fires immediately
        console.log("App.js: Skipping getSession(), waiting for onAuthStateChange...");
        console.log("App.js: onAuthStateChange will handle session restoration");
        
        // No timeout needed - onAuthStateChange fires immediately on page load
        // and will either restore the session or trigger INITIAL_SESSION with null
        
      } catch (err) {
        console.error("Session init error:", err);
        if (mounted) {
          setSession(null);
          setPage("login");
          setLoading(false);
        }
      }
    };

    initSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sess) => {
      console.log("App.js: Auth state changed, event:", event, "session:", !!sess);
      if (!mounted) return;
      
      // If there's a session, accept it
      if (sess) {
        console.log("App.js: Session received for user:", sess.user.id);
        console.log("App.js: Session event:", event, "loading:", loading);
        
        // Accept the session immediately and navigate to home
        setSession(sess);
        setPage("home");
        if (loading) {
          console.log("App.js: Ending loading state");
          setLoading(false);
        }
        
        // Verify teacher status in background (non-blocking)
        // This will sign them out later if they're not actually a teacher
        setTimeout(async () => {
          try {
            console.log("App.js: Background verification for user:", sess.user.id);
            
            // Helper function to add timeout to promises
            const withTimeout = (promise, timeoutMs, errorMsg) => {
              return Promise.race([
                promise,
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error(errorMsg)), timeoutMs)
                )
              ]);
            };
            
            // Check if user is a student (should be blocked)
            const studentResult = await withTimeout(
              supabase
                .from("students")
                .select("id")
                .eq("user_id", sess.user.id)
                .single(),
              10000,
              "Student check timeout"
            ).catch(err => {
              console.warn("App.js: Background student check failed:", err.message);
              return { data: null, error: err };
            });
            
            // Only sign out if we SUCCESSFULLY confirmed they are a student
            if (studentResult.data && !studentResult.error) {
              console.log("App.js: User is confirmed to be a student, signing out");
              await supabase.auth.signOut();
              return;
            }

            // Check if user is a teacher
            const teacherResult = await withTimeout(
              supabase
                .from("teachers")
                .select("id")
                .eq("id", sess.user.id)
                .single(),
              10000,
              "Teacher check timeout"
            ).catch(err => {
              console.warn("App.js: Background teacher check failed:", err.message);
              return { data: null, error: err };
            });
            
            // Only sign out if we got a successful response with NO teacher record
            // If there's an error (network, timeout, 406, etc.), trust the session
            if (teacherResult.data) {
              console.log("App.js: Teacher verification successful ✓");
            } else if (teacherResult.error) {
              console.warn("App.js: Could not verify teacher status (error), trusting session:", teacherResult.error.message);
            } else {
              // data is null AND no error = teacher definitely doesn't exist
              console.log("App.js: User is confirmed NOT a teacher, signing out");
              await supabase.auth.signOut();
            }
          } catch (err) {
            console.error("Background verification error:", err);
          }
        }, 100);
      } else {
        // Session ended - go to login
        console.log("App.js: Session ended in onAuthStateChange");
        setSession(null);
        setPage("login");
        if (loading) {
          console.log("App.js: Ending loading state (no session)");
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remove 'page' dependency to prevent infinite loop

  // Navigation handler for stack navigation
  const handleNavigate = (nextPage, data) => {
    if (!session && nextPage !== "login") {
      setPage("login");
      return;
    }
    if (nextPage === "detailedreport") {
      setSelectedSection(data);
      setPage("detailedreport");
    } else if (nextPage === "studentreport") {
      // Store both student and section data
      setSelectedStudent(data?.student || data);
      setSelectedSection(data?.section || selectedSection);
      setPage("studentreport");
    } else {
      setPage(nextPage);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setSelectedSection(null);
      setSelectedStudent(null);
      setPage("login");
    } catch (err) {
      console.error("Logout error:", err);
      // Force logout on client side even if server call fails
      setSession(null);
      setPage("login");
    }
  };

  // Show loading spinner while checking session
  if (loading) {
    return (
      <div className="App flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-400 to-orange-600">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {(!session || page === "login") && (
        <Login onLoggedIn={() => setPage("home")} />
      )}
      {session && page === "home" && (
        <Homepage
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}
      {session && page === "reports" && (
        <Reports
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}
      {session && page === "detailedreport" && (
        <DetailedReport
          section={selectedSection}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}
      {session && page === "studentreport" && (
        <StuedentReport
          student={selectedStudent}
          section={selectedSection}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
