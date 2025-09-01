import React from "react";

const logo = process.env.PUBLIC_URL + "/logo.png";
const iconHome = process.env.PUBLIC_URL + "/home.png";
const iconReports = process.env.PUBLIC_URL + "/reports.png";
const iconDropdown = process.env.PUBLIC_URL + "/dropdown.png";
const iconBack = process.env.PUBLIC_URL + "/chevron-left.png";
const iconStudent = process.env.PUBLIC_URL + "/student.png";
const iconBox = process.env.PUBLIC_URL + "/box.png";
const iconProgress = process.env.PUBLIC_URL + "/progress.png";
const iconGame = process.env.PUBLIC_URL + "/game.png";

export default function DetailedReport({ section, onNavigate }) {
  // Dummy data for demonstration
  const summary = [
    { icon: iconStudent, label: "Total Students", value: 64 },
    { icon: iconProgress, label: "Avg Time/Session", value: "45m" },
    { icon: iconBox, label: "Avg Accuracy", value: "80%" },
    { icon: iconBox, label: "Avg Progress", value: "80%" },
    { icon: iconGame, label: "Active This Week", value: 28 },
  ];

  const levelData = [
    {
      title: "Level 1: Basic Addition",
      complete: "85% Complete",
      students: "27 students completed",
      accuracy: "92% average accuracy",
      struggling: "5 students struggling",
      time: "12min avg completion time",
      color: "#19c37d",
    },
    {
      title: "Level 2: Basic Subtraction",
      complete: "72% Complete",
      students: "23 students completed",
      accuracy: "85% average accuracy",
      struggling: "9 students struggling",
      time: "18min avg completion time",
      color: "#3b82f6",
    },
    {
      title: "Level 3: Mixed Operations",
      complete: "58% Complete",
      students: "14 students completed",
      accuracy: "76% average accuracy",
      struggling: "14 students struggling",
      time: "25min avg completion time",
      color: "#ffa726",
    },
    {
      title: "Level 4: Complex Fractions",
      complete: "43% Complete",
      students: "18 students completed",
      accuracy: "69% average accuracy",
      struggling: "18 students struggling",
      time: "35min avg completion time",
      color: "#ff2d2d",
    },
  ];

  const students = [
    {
      initials: "AM",
      name: "Ana Martinez",
      status: "Online",
      progress: 95,
      level: "Level 4",
      accuracy: "94%",
      time: "2h 15m",
      last: "2 hours ago",
      tag: "Excellent",
      tagColor: "#19c37d",
    },
    {
      initials: "JR",
      name: "John Rivera",
      status: "Offline",
      progress: 78,
      level: "Level 3",
      accuracy: "82%",
      time: "1h 45m",
      last: "5 hours ago",
      tag: "Good",
      tagColor: "#3b82f6",
    },
    {
      initials: "MG",
      name: "Maria Garcia",
      status: "Online",
      progress: 52,
      level: "Level 2",
      accuracy: "65%",
      time: "3h 20m",
      last: "1 day ago",
      tag: "Needs Help",
      tagColor: "#ffa726",
    },
    {
      initials: "LT",
      name: "Luis Torres",
      status: "Away",
      progress: 28,
      level: "Level 1",
      accuracy: "45%",
      time: "45m",
      last: "3 days ago",
      tag: "Struggling",
      tagColor: "#ff2d2d",
    },
    {
      initials: "SC",
      name: "Sofia Cruz",
      status: "Online",
      progress: 88,
      level: "Level 4",
      accuracy: "99%",
      time: "1h 55m",
      last: "1 hour ago",
      tag: "Excellent",
      tagColor: "#19c37d",
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
    backBtn: { display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#f68c2e", fontWeight: 600, fontSize: 18, cursor: "pointer", margin: "24px 0 0 24px" },
    sectionTitle: { fontWeight: 700, fontSize: 32, margin: "0 auto", textAlign: "center" },
    summaryRow: { display: "flex", gap: 24, margin: "32px 0 0 0", justifyContent: "center" },
    summaryCard: { flex: 1, background: "#fff", borderRadius: 16, padding: 20, display: "flex", alignItems: "center", gap: 16, minWidth: 160, boxShadow: "0 2px 8px #0001", flexDirection: "column" },
    summaryIcon: { height: 32, width: 32 },
    summaryLabel: { fontWeight: 500, fontSize: 16, color: "#222", marginTop: 8 },
    summaryValue: { fontWeight: 700, fontSize: 24, color: "#222" },
    card: { background: "#faf9fb", borderRadius: 16, boxShadow: "0 2px 8px #0001", padding: 32, margin: "32px auto", maxWidth: 1200 },
    cardTitle: { fontWeight: 700, fontSize: 20, marginBottom: 16 },
    levelRow: { display: "flex", gap: 24, marginBottom: 24 },
    levelCard: color => ({
      flex: 1,
      background: "#fff",
      borderRadius: 12,
      borderLeft: `6px solid ${color}`,
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      minWidth: 180,
    }),
    levelTitle: { fontWeight: 600, fontSize: 16 },
    levelComplete: { fontWeight: 600, fontSize: 15 },
    levelStats: { fontSize: 14, color: "#444" },
    recommendations: { background: "#faf9fb", borderRadius: 16, boxShadow: "0 2px 8px #0001", padding: 32, margin: "32px auto", maxWidth: 1200 },
    recTitle: { fontWeight: 700, fontSize: 20, marginBottom: 16 },
    recItem: { display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 18 },
    recIcon: { fontSize: 18, marginTop: 3 },
    recLabel: { fontWeight: 600, fontSize: 15 },
    recText: { fontSize: 15 },
    tableWrap: { background: "#faf9fb", borderRadius: 16, boxShadow: "0 2px 8px #0001", padding: 32, margin: "32px auto", maxWidth: 1200, overflowX: "auto" },
    table: { width: "100%", borderCollapse: "collapse", marginTop: 8 },
    th: { textAlign: "left", fontWeight: 700, padding: "12px 8px", borderBottom: "2px solid #ccc", fontSize: 15, background: "#f5f5f5" },
    td: { padding: "10px 8px", borderBottom: "1px solid #eee", fontSize: 15, verticalAlign: "middle" },
    studentInitial: color => ({
      display: "inline-block",
      width: 32,
      height: 32,
      borderRadius: "50%",
      background: color,
      color: "#fff",
      fontWeight: 700,
      textAlign: "center",
      lineHeight: "32px",
      marginRight: 8,
      fontSize: 15,
    }),
    tag: color => ({
      background: color,
      color: "#fff",
      borderRadius: 12,
      padding: "4px 12px",
      fontWeight: 600,
      fontSize: 13,
      display: "inline-block",
    }),
    filterRow: { display: "flex", gap: 12, marginBottom: 16, justifyContent: "flex-end" },
    filterBtn: active => ({
      background: active ? "#3b82f6" : "#f5f5f5",
      color: active ? "#fff" : "#222",
      border: "none",
      borderRadius: 8,
      padding: "6px 18px",
      fontWeight: 600,
      fontSize: 14,
      cursor: "pointer",
    }),
  };

  // Recommendations & Action Items
  const recommendations = [
    {
      icon: <span style={{ color: "#ff2d2d", fontSize: 18 }}>🔴</span>,
      label: "Real-Time Monitoring",
      text: (
        <>
          <b>8 students currently online:</b> Ana Martinez, Maria Garcia, Sofia Cruz, and 5 others. Consider sending encouragement messages to students who are online but struggling.
        </>
      ),
    },
    {
      icon: <span style={{ color: "#7c3aed", fontSize: 18 }}>🟣</span>,
      label: "Focus Area: Level 3 & 4 Support",
      text: (
        <>
          14 students are struggling with mixed operations. Consider additional practice sessions or peer tutoring for complex fraction problems.
        </>
      ),
    },
    {
      icon: <span style={{ color: "#ffb300", fontSize: 18 }}>⚠️</span>,
      label: "Students Needing Immediate Attention",
      text: (
        <>
          <b>Luis Torres, Maria Garcia, Carlos Mendez</b> - Low accuracy and completion rates. Schedule one-on-one sessions.
        </>
      ),
    },
    {
      icon: <span style={{ color: "#ffd600", fontSize: 18 }}>🌟</span>,
      label: "High Performers",
      text: (
        <>
          <b>Ana Martinez, Sofia Cruz</b> - Consider advanced challenges or have them mentor struggling classmates.
        </>
      ),
    },
    {
      icon: <span style={{ color: "#3b82f6", fontSize: 18 }}>🔔</span>,
      label: "Engagement Alert",
      text: (
        <>
          4 students haven't been active in 3+ days. Send reminder notifications or check for technical issues.
        </>
      ),
    },
  ];

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

      {/* Back Button and Section Title */}
      <button style={styles.backBtn} onClick={() => onNavigate && onNavigate('reports')}>
        <img src={iconBack} alt="Back" style={{ height: 24, width: 24 }} /> Back
      </button>
      <div style={styles.sectionTitle}>{section?.name || "GRADE 4 – RIZAL"}</div>

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

      {/* Level Performance Analysis */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Level Performance Analysis</div>
        <div style={styles.levelRow}>
          {levelData.map((level, idx) => (
            <div key={idx} style={styles.levelCard(level.color)}>
              <div style={styles.levelTitle}>{level.title}</div>
              <div style={styles.levelComplete}>{level.complete}</div>
              <div style={styles.levelStats}>{level.students}</div>
              <div style={styles.levelStats}>{level.accuracy}</div>
              <div style={styles.levelStats}>{level.struggling}</div>
              <div style={styles.levelStats}>{level.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations & Action Items */}
      <div style={styles.recommendations}>
        <div style={styles.recTitle}>Recommendations & Action Items</div>
        {recommendations.map((rec, idx) => (
          <div key={idx} style={styles.recItem}>
            <span style={styles.recIcon}>{rec.icon}</span>
            <div>
              <span style={styles.recLabel}>{rec.label}</span>
              <span style={{ marginLeft: 8 }}>{rec.text}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Individual Student Progress */}
      <div style={styles.tableWrap}>
        <div style={styles.cardTitle}>Individual Student Progress</div>
        <div style={styles.filterRow}>
          <button style={styles.filterBtn(false)}>All Students</button>
          <button style={styles.filterBtn(false)}>Online Now</button>
          <button style={styles.filterBtn(true)}>Excellent</button>
          <button style={styles.filterBtn(false)}>Needs Help</button>
          <button style={styles.filterBtn(false)}>Inactive</button>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Student</th>
              <th style={styles.th}>Online Status</th>
              <th style={styles.th}>Overall Progress</th>
              <th style={styles.th}>Current Level</th>
              <th style={styles.th}>Accuracy</th>
              <th style={styles.th}>Time Spent</th>
              <th style={styles.th}>Last Activity</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((stu, idx) => (
              <tr
                key={idx}
                style={{ cursor: "pointer" }}
                onClick={() => onNavigate && onNavigate('studentreport', stu)}
              >
                <td style={styles.td}>
                  <span style={styles.studentInitial(stu.tagColor)}>{stu.initials}</span>
                  {stu.name}
                </td>
                <td style={styles.td}>
                  <span style={{
                    color:
                      stu.status === "Online"
                        ? "#19c37d"
                        : stu.status === "Away"
                        ? "#ffa726"
                        : "#888",
                    fontWeight: 600,
                  }}>
                    ● {stu.status}
                  </span>
                </td>
                <td style={styles.td}>
                  <div style={{
                    background: "#e0e0e0",
                    borderRadius: 8,
                    height: 8,
                    width: 80,
                    display: "inline-block",
                    marginRight: 8,
                    verticalAlign: "middle"
                  }}>
                    <div style={{
                      background: "#19c37d",
                      width: `${stu.progress}%`,
                      height: 8,
                      borderRadius: 8,
                    }}></div>
                  </div>
                  {stu.progress}%
                </td>
                <td style={styles.td}>{stu.level}</td>
                <td style={styles.td}>{stu.accuracy}</td>
                <td style={styles.td}>{stu.time}</td>
                <td style={styles.td}>{stu.last}</td>
                <td style={styles.td}>
                  <span style={styles.tag(stu.tagColor)}>{stu.tag}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}