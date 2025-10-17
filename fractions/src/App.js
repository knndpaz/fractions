import React, { useState } from "react";
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
  const currentUser = session?.user || null;

  // Keep session in state
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) setSession(data.session || null);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess && page === "login") setPage("home");
      if (!sess) setPage("login");
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
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
    await supabase.auth.signOut();
    setSelectedSection(null);
    setSelectedStudent(null);
    setPage("login");
  };

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
