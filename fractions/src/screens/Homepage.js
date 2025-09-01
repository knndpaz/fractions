import React, { useState } from "react";

// Images from public folder
const logo = process.env.PUBLIC_URL + "/logo.png";
const character = process.env.PUBLIC_URL + "/character.png";
const iconBox = process.env.PUBLIC_URL + "/box.png";
const iconStudent = process.env.PUBLIC_URL + "/student.png";
const iconReports = process.env.PUBLIC_URL + "/reports.png";
const iconHome = process.env.PUBLIC_URL + "/home.png";
const iconChevronLeft = process.env.PUBLIC_URL + "/chevron-left.png";
const iconChevronRight = process.env.PUBLIC_URL + "/chevron-right.png";
const iconCheck = process.env.PUBLIC_URL + "/check.png";
const iconClose = process.env.PUBLIC_URL + "/close.png";
const iconAdd = process.env.PUBLIC_URL + "/add.png";
const iconGroupAdd = process.env.PUBLIC_URL + "/group-add.png";
const iconDropdown = process.env.PUBLIC_URL + "/dropdown.png";

const initialSections = [
  { name: "GRADE 4 - Rizal", progress: 85 },
  { name: "GRADE 4 - Bonifacio", progress: 80 },
  { name: "GRADE 4 - Prince", progress: 50 },
  { name: "GRADE 4 - Umpad", progress: 50 },
];

const initialStudents = [
  { name: "Prince Numpad", section: "Rizal" },
];

export default function Homepage({ onNavigate }) {
  const [sections, setSections] = useState(initialSections);
  const [students, setStudents] = useState(initialStudents);
  const [sectionName, setSectionName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentUsername, setStudentUsername] = useState("");
  const [studentSection, setStudentSection] = useState("");
  const [sameSection, setSameSection] = useState(false);

  // Handlers for forms (dummy, no backend)
  const handleAddSection = () => {
    if (sectionName.trim()) {
      setSections([...sections, { name: sectionName, progress: 0 }]);
      setSectionName("");
    }
  };

  const handleAddStudent = () => {
    if (studentName.trim() && studentSection.trim()) {
      setStudents([...students, { name: studentName, section: studentSection }]);
      setStudentName("");
      setStudentUsername("");
      setStudentSection("");
      setSameSection(false);
    }
  };

  // Styles (for brevity, inline)
  const styles = {
    page: { background: "#e0e0e0", minHeight: "100vh", fontFamily: "Poppins, Arial, sans-serif" },
    navbar: { background: "#f68c2e", display: "flex", alignItems: "center", padding: "0 32px", height: 80, justifyContent: "space-between" },
    logo: { height: 64, marginRight: 24 },
    navLinks: { display: "flex", alignItems: "center", gap: 32 },
    navBtn: { background: "#fff", borderRadius: 16, padding: "8px 24px", display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#f68c2e", border: "none", fontSize: 18, cursor: "pointer" },
    navIcon: { height: 24, width: 24, display: "flex", alignItems: "center" },
    userInfo: { display: "flex", alignItems: "center", gap: 12, color: "#fff", fontSize: 14 },
    userAvatar: { width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "2px solid #fff" },
    dropdown: { height: 32, width: 32, color: "#fff", marginLeft: 16, cursor: "pointer", display: "flex", alignItems: "center" },
    main: { display: "flex", gap: 24, padding: 32 },
    leftCol: { flex: 2, display: "flex", flexDirection: "column", gap: 24 },
    rightCol: { flex: 1.2, display: "flex", flexDirection: "column", gap: 24 },
    card: { background: "#fff", borderRadius: 16, boxShadow: "0 2px 8px #0001", padding: 24, marginBottom: 0 },
    welcome: { display: "flex", alignItems: "center", gap: 24 },
    welcomeText: { flex: 1 },
    welcomeTitle: { fontSize: 32, fontWeight: 700, margin: 0 },
    welcomeDesc: { color: "#888", fontSize: 16, margin: "12px 0 0 0" },
    character: { width: 120, height: 120 },
    sectionHeader: { display: "flex", alignItems: "center", gap: 12, fontWeight: 700, fontSize: 20, marginBottom: 12 },
    sectionIcon: { height: 32, width: 32, background: "#ccc", borderRadius: 8, padding: 4, display: "flex", alignItems: "center", justifyContent: "center" },
    sectionForm: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
    input: { flex: 1, padding: "10px 16px", borderRadius: 8, border: "1px solid #ccc", fontSize: 16 },
    btnSave: { background: "#19c37d", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 600, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
    btnCancel: { background: "#ff2d2d", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 600, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
    sectionTable: { width: "100%", borderCollapse: "collapse", marginTop: 8 },
    sectionTh: { textAlign: "left", fontWeight: 600, padding: "8px 0", borderBottom: "2px solid #ccc" },
    sectionTd: { padding: "8px 0", borderBottom: "1px solid #eee", fontSize: 15 },
    pagination: { display: "flex", justifyContent: "center", gap: 32, marginTop: 16 },
    arrowBtn: { background: "none", border: "none", fontSize: 32, cursor: "pointer", color: "#222", display: "flex", alignItems: "center" },
    arrowIcon: { height: 32, width: 32 },
    studentHeader: { display: "flex", alignItems: "center", gap: 12, fontWeight: 700, fontSize: 20, marginBottom: 12 },
    studentIcon: { height: 32, width: 32, background: "#ccc", borderRadius: 8, padding: 4, display: "flex", alignItems: "center", justifyContent: "center" },
    studentForm: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 },
    studentFormRow: { display: "flex", gap: 12 },
    studentInput: { flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 15 },
    studentBtnRow: { display: "flex", gap: 12, marginTop: 8 },
    studentTable: { width: "100%", borderCollapse: "collapse", marginTop: 8 },
    studentTh: { textAlign: "left", fontWeight: 600, padding: "8px 0", borderBottom: "2px solid #ccc" },
    studentTd: { padding: "8px 0", borderBottom: "1px solid #eee", fontSize: 15 },
    iconBtn: { display: "flex", alignItems: "center", gap: 6 },
    icon: { height: 20, width: 20 },
    iconLarge: { height: 24, width: 24 },
  };

  return (
    <div style={styles.page}>
      {/* Navbar */}
      <div style={styles.navbar}>
        <img src={logo} alt="Logo" style={styles.logo} />
        <div style={styles.navLinks}>
          <button style={styles.navBtn} onClick={() => onNavigate && onNavigate('home')}>
            <span style={styles.navIcon}><img src={iconHome} alt="Home" style={styles.iconLarge} /></span> Home
          </button>
          <button style={styles.navBtn} onClick={() => onNavigate && onNavigate('reports')}>
            <span style={styles.navIcon}><img src={iconReports} alt="Reports" style={styles.iconLarge} /></span> Reports
          </button>
        </div>
        <div style={styles.userInfo}>
          <div>
            Justine Nabunturan
            <div style={{ fontSize: 12, color: "#ffe" }}>Admin</div>
          </div>
          <img
            src="https://ui-avatars.com/api/?name=Justine+Nabunturan&background=F68C2E&color=fff"
            alt="User"
            style={styles.userAvatar}
          />
          <span style={styles.dropdown}><img src={iconDropdown} alt="Dropdown" style={{ height: 24, width: 24 }} /></span>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {/* Left Column */}
        <div style={styles.leftCol}>
          {/* Welcome Card */}
          <div style={styles.card}>
            <div style={styles.welcome}>
              <div style={styles.welcomeText}>
                <h1 style={styles.welcomeTitle}>WELCOME BACK, JUSTIN!</h1>
                <div style={styles.welcomeDesc}>
                  Sorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.
                </div>
              </div>
              <img src={character} alt="Character" style={styles.character} />
            </div>
          </div>

          {/* Sections Card */}
          <div style={styles.card}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}><img src={iconBox} alt="Sections" style={styles.iconLarge} /></span>
              SECTIONS
            </div>
            {/* Create Section */}
            <div style={styles.sectionForm}>
              <input
                style={styles.input}
                placeholder="Section name"
                value={sectionName}
                onChange={e => setSectionName(e.target.value)}
              />
              <button style={styles.btnSave} onClick={handleAddSection}>
                <img src={iconCheck} alt="Save" style={styles.icon} /> SAVE
              </button>
              <button style={styles.btnCancel} onClick={() => setSectionName("")}>
                <img src={iconClose} alt="Cancel" style={styles.icon} /> CANCEL
              </button>
            </div>
            {/* Section List */}
            <table style={styles.sectionTable}>
              <thead>
                <tr>
                  <th style={styles.sectionTh}>Name</th>
                  <th style={styles.sectionTh}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((sec, idx) => (
                  <tr key={idx}>
                    <td style={styles.sectionTd}>{sec.name}</td>
                    <td style={styles.sectionTd}>{sec.progress}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination */}
            <div style={styles.pagination}>
              <button style={styles.arrowBtn}><img src={iconChevronLeft} alt="Prev" style={styles.arrowIcon} /></button>
              <button style={styles.arrowBtn}><img src={iconChevronRight} alt="Next" style={styles.arrowIcon} /></button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={styles.rightCol}>
          {/* Students Card */}
          <div style={styles.card}>
            <div style={styles.studentHeader}>
              <span style={styles.studentIcon}><img src={iconStudent} alt="Students" style={styles.iconLarge} /></span>
              STUDENTS
            </div>
            {/* Create Student */}
            <div style={styles.studentForm}>
              <div style={styles.studentFormRow}>
                <button style={{ ...styles.btnSave, background: "#ff9800" }}>
                  <img src={iconAdd} alt="Add" style={styles.icon} /> Add new
                </button>
                <button style={{ ...styles.btnSave, background: "#ffe066", color: "#222" }}>
                  <img src={iconGroupAdd} alt="Add Multiple" style={styles.icon} /> Add Multiple
                </button>
              </div>
              <div style={styles.studentFormRow}>
                <input
                  style={styles.studentInput}
                  placeholder="Student Name"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                />
                <input
                  style={styles.studentInput}
                  placeholder="Student Username (use for login)"
                  value={studentUsername}
                  onChange={e => setStudentUsername(e.target.value)}
                />
              </div>
              <div style={styles.studentFormRow}>
                <input
                  style={styles.studentInput}
                  placeholder="Section"
                  value={studentSection}
                  onChange={e => setStudentSection(e.target.value)}
                />
                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={sameSection}
                    onChange={e => setSameSection(e.target.checked)}
                  />
                  Same Section
                </label>
              </div>
              <div style={styles.studentBtnRow}>
                <button style={styles.btnSave} onClick={handleAddStudent}>
                  <img src={iconCheck} alt="Save" style={styles.icon} /> SAVE
                </button>
                <button style={styles.btnCancel} onClick={() => {
                  setStudentName(""); setStudentUsername(""); setStudentSection(""); setSameSection(false);
                }}>
                  <img src={iconClose} alt="Cancel" style={styles.icon} /> CANCEL
                </button>
              </div>
            </div>
          </div>
          {/* Student List */}
          <div style={styles.card}>
            <table style={styles.studentTable}>
              <thead>
                <tr>
                  <th style={styles.studentTh}>Name</th>
                  <th style={styles.studentTh}>Section</th>
                </tr>
              </thead>
              <tbody>
                {students.map((stu, idx) => (
                  <tr key={idx}>
                    <td style={styles.studentTd}>{stu.name}</td>
                    <td style={styles.studentTd}>{stu.section}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination */}
            <div style={styles.pagination}>
              <button style={styles.arrowBtn}><img src={iconChevronLeft} alt="Prev" style={styles.arrowIcon} /></button>
              <button style={styles.arrowBtn}><img src={iconChevronRight} alt="Next" style={styles.arrowIcon} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};