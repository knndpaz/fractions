import React, { useState, useEffect } from "react";
import "./App.css";
import Homepage from "./screens/Homepage";
import Reports from "./screens/Reports";
import DetailedReport from "./screens/DetailedReport";
import StuedentReport from "./screens/StuedentReport";
import Login from "./screens/Login";
import { supabase } from "./supabase";

function App() {
  const [page, setPage] = useState("login");
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = session?.user || null;

  // Keep session in state
  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initSession = async () => {
      console.log("App.js: Initializing session...");
      try {
        // Skip getSession since it's timing out - just go to login
        // User will authenticate through login form
        console.log("App.js: Skipping session check, going to login");
        if (mounted) {
          setSession(null);
          setPage("login");
          setLoading(false);
        }
        return;
        
        /* DISABLED - getSession is hanging
        console.log("App.js: About to call supabase.auth.getSession()");
        
        // Add timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("getSession timeout")), 5000)
        );
        
        const {
          data: { session: currentSession },
          error,
        } = await Promise.race([sessionPromise, timeoutPromise]);
        
        console.log("App.js: getSession() completed");
        if (error) {
          console.error("Error getting session:", error);
        }
        console.log("App.js: Current session:", currentSession ? "exists" : "null");
        if (mounted) {
          // Validate session before accepting it
          if (currentSession) {
            console.log("App.js: Validating session for user:", currentSession.user.id);
            // Check if user is a student
            const { data: student } = await supabase
              .from("students")
              .select("id")
              .eq("user_id", currentSession.user.id)
              .maybeSingle();

            if (student) {
              console.log("App.js: User is a student, blocking access");
              await supabase.auth.signOut();
              setSession(null);
              setPage("login");
              setLoading(false);
              return;
            }

            // Check if user is a teacher
            const { data: teacher } = await supabase
              .from("teachers")
              .select("id")
              .eq("id", currentSession.user.id)
              .maybeSingle();

            if (!teacher) {
              console.log("App.js: User is not a teacher, blocking access");
              await supabase.auth.signOut();
              setSession(null);
              setPage("login");
              setLoading(false);
              return;
            }

            // Valid teacher session
            console.log("App.js: Valid teacher session, setting state");
            setSession(currentSession);
            setPage("home");
          } else {
            console.log("App.js: No session, going to login");
            setSession(null);
            setPage("login");
          }
          console.log("App.js: Setting loading to false");
          setLoading(false);
        }
        */
      } catch (err) {
        console.error("Session init error:", err);
        if (mounted) {
          // If getSession times out, clear storage and show login
          if (err.message === "getSession timeout") {
            console.log("App.js: Clearing storage due to timeout");
            localStorage.clear();
          }
          setSession(null);
          setPage("login");
          setLoading(false);
        }
      }
    };

    initSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      if (!mounted) return;
      
      // If there's a new session, verify the user is a teacher before allowing access
      if (sess) {
        try {
          // Check if user is a student (should be blocked)
          const { data: student } = await supabase
            .from("students")
            .select("id")
            .eq("user_id", sess.user.id)
            .maybeSingle();

          if (student) {
            // User is a student - sign them out and prevent navigation
            await supabase.auth.signOut();
            setSession(null);
            setPage("login");
            return;
          }

          // Check if user is a teacher
          const { data: teacher } = await supabase
            .from("teachers")
            .select("id")
            .eq("id", sess.user.id)
            .maybeSingle();

          if (!teacher) {
            // Not a teacher - sign them out and prevent navigation
            await supabase.auth.signOut();
            setSession(null);
            setPage("login");
            return;
          }

          // Valid teacher - allow session and navigation
          setSession(sess);
          setPage("home");
        } catch (err) {
          console.error("Auth verification error:", err);
          await supabase.auth.signOut();
          setSession(null);
          setPage("login");
        }
      } else {
        // Session ended - go to login
        setSession(null);
        setPage("login");
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
      setSelectedStudent(data);
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
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
