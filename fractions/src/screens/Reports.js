import React from "react";

const logo = process.env.PUBLIC_URL + "/logo.png";
const iconHome = process.env.PUBLIC_URL + "/home.png";
const iconReports = process.env.PUBLIC_URL + "/reports.png";
const iconDropdown = process.env.PUBLIC_URL + "/dropdown.png";
const iconStudent = process.env.PUBLIC_URL + "/student.png";
const iconBox = process.env.PUBLIC_URL + "/box.png";
const iconProgress = process.env.PUBLIC_URL + "/progress.png";
const iconGame = process.env.PUBLIC_URL + "/game.png";
const iconSearch = process.env.PUBLIC_URL + "/search.png";

export default function Reports({ onNavigate }) {
  // Dummy data for demonstration
  const summary = [
    { icon: iconStudent, label: "Total Students", value: 64 },
    { icon: iconBox, label: "Sections", value: 3 },
    { icon: iconProgress, label: "AVG Progress", value: "78%" },
    { icon: iconGame, label: "Game Levels", value: 4 },
  ];

  const sections = [
    {
      name: "GRADE 4 – RIZAL",
      students: 32,
      completion: 70,
      accuracy: 80,
      levels: [
        { color: "#19c37d", width: "30%" },
        { color: "#3b82f6", width: "30%" },
        { color: "#ffa726", width: "20%" },
        { color: "#ff2d2d", width: "10%" },
      ],
    },
    {
      name: "GRADE 4 – RIZAL",
      students: 32,
      completion: 70,
      accuracy: 80,
      levels: [
        { color: "#19c37d", width: "30%" },
        { color: "#3b82f6", width: "30%" },
        { color: "#ffa726", width: "20%" },
        { color: "#ff2d2d", width: "10%" },
      ],
    },
  ];

  const styles = {
    page: { background: "#e0e0e0", minHeight: "100vh", fontFamily: "Poppins, Arial, sans-serif", overflowY: "auto" },
    navbar: { background: "#f68c2e", display: "flex", alignItems: "center", padding: "0 32px", height: 80, justifyContent: "space-between" },
    logo: { height: 64, marginRight: 24 },
    navLinks: { display: "flex", alignItems: "center", gap: 32 },
    navBtn: { background: "#fff", borderRadius: 16, padding: "8px 24px", display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#f68c2e", border: "none", fontSize: 18, cursor: "pointer" },
    navIcon: { height: 24, width: 24, display: "flex", alignItems: "center" },
    userInfo: { display: "flex", alignItems: "center", gap: 12, color: "#fff", fontSize: 14 },
    userAvatar: { width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "2px solid #fff" },
    dropdown: { height: 32, width: 32, color: "#fff", marginLeft: 16, cursor: "pointer", display: "flex", alignItems: "center" },
    summaryRow: { display: "flex", gap: 24, margin: "32px 0 0 0" },
    summaryCard: { flex: 1, background: "#fff", borderRadius: 16, padding: 20, display: "flex", alignItems: "center", gap: 16, minWidth: 160, boxShadow: "0 2px 8px #0001", flexDirection: "column" },
    summaryIcon: { height: 32, width: 32 },
    summaryLabel: { fontWeight: 500, fontSize: 16, color: "#222", marginTop: 8 },
    summaryValue: { fontWeight: 700, fontSize: 24, color: "#222" },
    searchBarWrap: { background: "#fff", borderRadius: 16, margin: "24px 0", padding: 24, boxShadow: "0 2px 8px #0001" },
    searchBar: { display: "flex", alignItems: "center", background: "#f5f5f5", borderRadius: 12, padding: "8px 16px" },
    searchInput: { border: "none", background: "transparent", fontSize: 18, flex: 1, outline: "none" },
    searchIcon: { height: 24, width: 24, opacity: 0.5 },
    sectionGrid: { display: "flex", gap: 24, marginTop: 8 },
    sectionCard: { flex: 1, background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 2px 8px #0001", minWidth: 320, display: "flex", flexDirection: "column", gap: 16 },
    sectionTitleRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    sectionTitle: { fontWeight: 700, fontSize: 28, margin: 0 },
    sectionStudents: { background: "#ffa366", color: "#fff", borderRadius: 20, padding: "4px 18px", fontWeight: 600, fontSize: 16 },
    sectionStats: { display: "flex", gap: 48, margin: "16px 0" },
    statCircle: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
    circleWrap: { position: "relative", width: 70, height: 70, marginBottom: 4 },
    circleBg: { position: "absolute", top: 0, left: 0, width: 70, height: 70, borderRadius: "50%", background: "#eee" },
    circleFg: (percent, color) => ({
      position: "absolute",
      top: 0,
      left: 0,
      width: 70,
      height: 70,
      borderRadius: "50%",
      border: `6px solid ${color}`,
      clipPath: `inset(${100 - percent}% 0 0 0)`,
      boxSizing: "border-box",
      transition: "border-color 0.3s",
    }),
    circleText: { position: "absolute", top: 0, left: 0, width: 70, height: 70, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, color: "#222" },
    statLabel: { color: "#888", fontSize: 14, marginTop: 8 },
    levelsRow: { display: "flex", gap: 16, margin: "16px 0 0 0", alignItems: "center" },
    levelBar: color => ({ background: color, height: 8, borderRadius: 8, width: 60 }),
    levelLabel: { fontSize: 12, color: "#888", marginTop: 4, textAlign: "center" },
    detailBtn: { background: "#ffa366", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontWeight: 600, fontSize: 18, marginTop: 16, cursor: "pointer" },
  };

  return (
    <div style={styles.page}>
      {/* Navbar */}
      <div style={styles.navbar}>
        <img src={logo} alt="Logo" style={styles.logo} />
        <div style={styles.navLinks}>
          <button style={styles.navBtn} onClick={() => onNavigate && onNavigate('home')}>
            <span style={styles.navIcon}><img src={iconHome} alt="Home" style={{ height: 24, width: 24 }} /></span> Home
          </button>
          <button style={styles.navBtn} onClick={() => onNavigate && onNavigate('reports')}>
            <span style={styles.navIcon}><img src={iconReports} alt="Reports" style={{ height: 24, width: 24 }} /></span> Reports
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

      {/* Summary Row */}
      <div style={styles.summaryRow}>
        {summary.map((item, idx) => (
          <div key={idx} style={styles.summaryCard}>
            <img src={item.icon} alt={item.label} style={styles.summaryIcon} />
            <div style={styles.summaryLabel}>{item.label}</div>
            <div style={styles.summaryValue}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div style={styles.searchBarWrap}>
        <div style={styles.searchBar}>
          <input style={styles.searchInput} placeholder="Search" />
          <img src={iconSearch} alt="Search" style={styles.searchIcon} />
        </div>
      </div>

      {/* Section Cards */}
      <div style={styles.sectionGrid}>
        {sections.map((section, idx) => (
          <div key={idx} style={styles.sectionCard}>
            <div style={styles.sectionTitleRow}>
              <div style={styles.sectionTitle}>{section.name}</div>
              <div style={styles.sectionStudents}>{section.students} Students</div>
            </div>
            <div style={styles.sectionStats}>
              <div style={styles.statCircle}>
                <div style={styles.circleWrap}>
                  <div style={styles.circleBg}></div>
                  <div style={styles.circleFg(section.completion, "#3b82f6")}></div>
                  <div style={styles.circleText}>{section.completion}%</div>
                </div>
                <div style={styles.statLabel}>Completion Rate</div>
              </div>
              <div style={styles.statCircle}>
                <div style={styles.circleWrap}>
                  <div style={styles.circleBg}></div>
                  <div style={styles.circleFg(section.accuracy, "#3b82f6")}></div>
                  <div style={styles.circleText}>{section.accuracy}%</div>
                </div>
                <div style={styles.statLabel}>Avg Accuracy</div>
              </div>
            </div>
            <div style={styles.levelsRow}>
              <div>
                <div style={styles.levelBar("#19c37d")}></div>
                <div style={styles.levelLabel}>Level 1</div>
              </div>
              <div>
                <div style={styles.levelBar("#3b82f6")}></div>
                <div style={styles.levelLabel}>Level 2</div>
              </div>
              <div>
                <div style={styles.levelBar("#ffa726")}></div>
                <div style={styles.levelLabel}>Level 3</div>
              </div>
              <div>
                <div style={styles.levelBar("#ff2d2d")}></div>
                <div style={styles.levelLabel}>Level 4</div>
              </div>
            </div>
            <button
              style={styles.detailBtn}
              onClick={() => onNavigate && onNavigate('detailedreport', section)}
            >
              View Detailed Report
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}