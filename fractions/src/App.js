import React, { useState } from "react";
import "./App.css";
import Homepage from "./screens/Homepage";
import Reports from "./screens/Reports";
import DetailedReport from "./screens/DetailedReport";
import StuedentReport from "./screens/StuedentReport";

function App() {
  const [page, setPage] = useState("home");
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Navigation handler for stack navigation
  const handleNavigate = (nextPage, data) => {
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

  return (
    <div className="App">
      {page === "home" && <Homepage onNavigate={handleNavigate} />}
      {page === "reports" && <Reports onNavigate={handleNavigate} />}
      {page === "detailedreport" && (
        <DetailedReport section={selectedSection} onNavigate={handleNavigate} />
      )}
      {page === "studentreport" && (
        <StuedentReport student={selectedStudent} onNavigate={handleNavigate} />
      )}
    </div>
  );
}

export default App;
