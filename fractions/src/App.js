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
      try {
        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
        }
        if (mounted) {
          setSession(currentSession);
          if (currentSession) {
            setPage("home");
          } else {
            setPage("login");
          }
          setLoading(false);
        }
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      if (mounted) {
        setSession(sess);
        if (sess && page === "login") {
          setPage("home");
        }
        if (!sess) {
          setPage("login");
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
