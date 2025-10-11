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
  // This would normally come from your backend/database
  // For now, simulating real student data
  const studentData = [
    {
      name: "John Smith",
      username: "john_smith",
      section: "GRADE 4 – RIZAL",
      completionRate: 75,
      accuracy: 85,
      totalAttempts: 40,
      correctAnswers: 34,
      levelStats: {
        level1: { completed: true, accuracy: 90 },
        level2: { completed: true, accuracy: 80 },
        level3: { completed: false, accuracy: 85 },
      }
    },
    {
      name: "Maria Garcia",
      username: "maria_garcia",
      section: "GRADE 4 – RIZAL",
      completionRate: 50,
      accuracy: 70,
      totalAttempts: 30,
      correctAnswers: 21,
      levelStats: {
        level1: { completed: true, accuracy: 75 },
        level2: { completed: false, accuracy: 65 },
        level3: { completed: false, accuracy: 0 },
      }
    },
    {
      name: "Pedro Santos",
      username: "pedro_santos",
      section: "GRADE 4 – BONIFACIO",
      completionRate: 100,
      accuracy: 95,
      totalAttempts: 48,
      correctAnswers: 46,
      levelStats: {
        level1: { completed: true, accuracy: 95 },
        level2: { completed: true, accuracy: 90 },
        level3: { completed: true, accuracy: 100 },
      }
    },
    {
      name: "Ana Reyes",
      username: "ana_reyes",
      section: "GRADE 4 – BONIFACIO",
      completionRate: 25,
      accuracy: 60,
      totalAttempts: 20,
      correctAnswers: 12,
      levelStats: {
        level1: { completed: false, accuracy: 60 },
        level2: { completed: false, accuracy: 0 },
        level3: { completed: false, accuracy: 0 },
      }
    },
    {
      name: "Luis Mendoza",
      username: "luis_mendoza",
      section: "GRADE 4 – LAPU-LAPU",
      completionRate: 90,
      accuracy: 88,
      totalAttempts: 45,
      correctAnswers: 40,
      levelStats: {
        level1: { completed: true, accuracy: 85 },
        level2: { completed: true, accuracy: 90 },
        level3: { completed: true, accuracy: 90 },
      }
    }
  ];

  // Group students by section and calculate averages
  const sectionStats = {};
  studentData.forEach(student => {
    if (!sectionStats[student.section]) {
      sectionStats[student.section] = {
        students: [],
        totalStudents: 0,
        avgCompletion: 0,
        avgAccuracy: 0,
        levelDistribution: { level1: 0, level2: 0, level3: 0, level4: 0 }
      };
    }
    sectionStats[student.section].students.push(student);
  });

  // Calculate section averages
  Object.keys(sectionStats).forEach(sectionName => {
    const section = sectionStats[sectionName];
    section.totalStudents = section.students.length;
    
    // Calculate average completion rate
    section.avgCompletion = Math.round(
      section.students.reduce((sum, student) => sum + student.completionRate, 0) / section.totalStudents
    );
    
    // Calculate average accuracy
    section.avgAccuracy = Math.round(
      section.students.reduce((sum, student) => sum + student.accuracy, 0) / section.totalStudents
    );
    
    // Calculate level distribution (how many students reached each level)
    section.students.forEach(student => {
      if (student.levelStats.level1.completed) section.levelDistribution.level1++;
      if (student.levelStats.level2.completed) section.levelDistribution.level2++;
      if (student.levelStats.level3.completed) section.levelDistribution.level3++;
      if (student.completionRate === 100) section.levelDistribution.level4++;
    });
  });

  const sections = Object.keys(sectionStats).map(sectionName => ({
    name: sectionName,
    students: sectionStats[sectionName].totalStudents,
    completion: sectionStats[sectionName].avgCompletion,
    accuracy: sectionStats[sectionName].avgAccuracy,
    levelDistribution: sectionStats[sectionName].levelDistribution,
    studentList: sectionStats[sectionName].students
  }));

  // Calculate overall summary
  const summary = [
    { 
      icon: iconStudent, 
      label: "Total Students", 
      value: studentData.length 
    },
    { 
      icon: iconBox, 
      label: "Sections", 
      value: Object.keys(sectionStats).length 
    },
    { 
      icon: iconProgress, 
      label: "AVG Progress", 
      value: `${Math.round(studentData.reduce((sum, s) => sum + s.completionRate, 0) / studentData.length)}%`
    },
    { 
      icon: iconGame, 
      label: "AVG Accuracy", 
      value: `${Math.round(studentData.reduce((sum, s) => sum + s.accuracy, 0) / studentData.length)}%`
    },
  ];

  const styles = {
    page: { background: "#e0e0e0", minHeight: "100vh", fontFamily: "Poppins, Arial, sans-serif", overflowY: "auto", padding: "0 24px" },
    navbar: { background: "#f68c2e", display: "flex", alignItems: "center", padding: "0 32px", height: 80, justifyContent: "space-between", borderRadius: "0 0 16px 16px", margin: "0 -24px 24px -24px" },
    logo: { height: 64, marginRight: 24 },
    navLinks: { display: "flex", alignItems: "center", gap: 32 },
    navBtn: { background: "#fff", borderRadius: 16, padding: "8px 24px", display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#f68c2e", border: "none", fontSize: 18, cursor: "pointer" },
    navIcon: { height: 24, width: 24, display: "flex", alignItems: "center" },
    userInfo: { display: "flex", alignItems: "center", gap: 12, color: "#fff", fontSize: 14 },
    userAvatar: { width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "2px solid #fff" },
    dropdown: { height: 32, width: 32, color: "#fff", marginLeft: 16, cursor: "pointer", display: "flex", alignItems: "center" },
    summaryRow: { display: "flex", gap: 24, margin: "0 0 24px 0" },
    summaryCard: { flex: 1, background: "#fff", borderRadius: 16, padding: 20, display: "flex", alignItems: "center", gap: 16, minWidth: 160, boxShadow: "0 2px 8px #0001", flexDirection: "column" },
    summaryIcon: { height: 32, width: 32 },
    summaryLabel: { fontWeight: 500, fontSize: 16, color: "#222", marginTop: 8, textAlign: "center" },
    summaryValue: { fontWeight: 700, fontSize: 24, color: "#222" },
    searchBarWrap: { background: "#fff", borderRadius: 16, margin: "0 0 24px 0", padding: 24, boxShadow: "0 2px 8px #0001" },
    searchBar: { display: "flex", alignItems: "center", background: "#f5f5f5", borderRadius: 12, padding: "8px 16px" },
    searchInput: { border: "none", background: "transparent", fontSize: 18, flex: 1, outline: "none" },
    searchIcon: { height: 24, width: 24, opacity: 0.5 },
    sectionGrid: { display: "flex", flexWrap: "wrap", gap: 24 },
    sectionCard: { flex: "1 1 400px", background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 2px 8px #0001", minWidth: 400, display: "flex", flexDirection: "column", gap: 16 },
    sectionTitleRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    sectionTitle: { fontWeight: 700, fontSize: 24, margin: 0, color: "#222" },
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
      background: `conic-gradient(${color} 0deg ${percent * 3.6}deg, #eee ${percent * 3.6}deg 360deg)`,
      clipPath: "circle(35px at center)",
      border: "4px solid transparent",
    }),
    circleText: { position: "absolute", top: 0, left: 0, width: 70, height: 70, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, color: "#222" },
    statLabel: { color: "#888", fontSize: 14, marginTop: 8, textAlign: "center" },
    levelsRow: { display: "flex", gap: 16, margin: "16px 0 0 0", alignItems: "center", justifyContent: "space-between" },
    levelContainer: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
    levelBar: (count, total, color) => ({ 
      background: color, 
      height: 8, 
      borderRadius: 8, 
      width: Math.max(60, (count / total) * 100),
      minWidth: 20
    }),
    levelLabel: { fontSize: 12, color: "#888", textAlign: "center" },
    levelCount: { fontSize: 10, color: "#666", textAlign: "center" },
    detailBtn: { background: "#ffa366", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontWeight: 600, fontSize: 18, marginTop: 16, cursor: "pointer", transition: "background 0.3s" },
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
          <input style={styles.searchInput} placeholder="Search sections or students..." />
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
                <div style={styles.statLabel}>Avg Completion</div>
              </div>
              <div style={styles.statCircle}>
                <div style={styles.circleWrap}>
                  <div style={styles.circleBg}></div>
                  <div style={styles.circleFg(section.accuracy, "#10b981")}></div>
                  <div style={styles.circleText}>{section.accuracy}%</div>
                </div>
                <div style={styles.statLabel}>Avg Accuracy</div>
              </div>
            </div>
            <div style={styles.levelsRow}>
              <div style={styles.levelContainer}>
                <div style={styles.levelBar(section.levelDistribution.level1, section.students, "#19c37d")}></div>
                <div style={styles.levelLabel}>Level 1</div>
                <div style={styles.levelCount}>{section.levelDistribution.level1}/{section.students}</div>
              </div>
              <div style={styles.levelContainer}>
                <div style={styles.levelBar(section.levelDistribution.level2, section.students, "#3b82f6")}></div>
                <div style={styles.levelLabel}>Level 2</div>
                <div style={styles.levelCount}>{section.levelDistribution.level2}/{section.students}</div>
              </div>
              <div style={styles.levelContainer}>
                <div style={styles.levelBar(section.levelDistribution.level3, section.students, "#ffa726")}></div>
                <div style={styles.levelLabel}>Level 3</div>
                <div style={styles.levelCount}>{section.levelDistribution.level3}/{section.students}</div>
              </div>
              <div style={styles.levelContainer}>
                <div style={styles.levelBar(section.levelDistribution.level4, section.students, "#ff2d2d")}></div>
                <div style={styles.levelLabel}>Completed</div>
                <div style={styles.levelCount}>{section.levelDistribution.level4}/{section.students}</div>
              </div>
            </div>
            <button
              style={styles.detailBtn}
              onClick={() => onNavigate && onNavigate('detailedreport', section)}
              onMouseEnter={(e) => e.target.style.background = "#ff8c42"}
              onMouseLeave={(e) => e.target.style.background = "#ffa366"}
            >
              View Detailed Report
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}