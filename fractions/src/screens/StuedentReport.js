import React from "react";

const logo = process.env.PUBLIC_URL + "/logo.png";
const iconHome = process.env.PUBLIC_URL + "/home.png";
const iconReports = process.env.PUBLIC_URL + "/reports.png";
const iconDropdown = process.env.PUBLIC_URL + "/dropdown.png";
const iconBack = process.env.PUBLIC_URL + "/chevron-left.png";
const iconTrophy = process.env.PUBLIC_URL + "/progress.png";
const iconPercent = process.env.PUBLIC_URL + "/reports.png";
const iconTime = process.env.PUBLIC_URL + "/game.png";
const iconBar = process.env.PUBLIC_URL + "/box.png";

export default function StuedentReport({ student, onNavigate }) {
  // Dummy data for demonstration
  const summary = [
    { icon: iconTrophy, label: "Overall Progress", value: "95%" },
    { icon: iconPercent, label: "Avg Accuracy", value: "80%" },
    { icon: iconTime, label: "Total Time", value: "2h 15m" },
    { icon: iconBar, label: "Sessions", value: 12 },
  ];

  const levelProgress = [
    { level: 1, title: "Basic Addition", desc: "Simple fraction addition problems", percent: 100, status: "Completed", color: "#19c37d" },
    { level: 2, title: "Basic Subtraction", desc: "Simple fraction subtraction problems", percent: 100, status: "Completed", color: "#19c37d" },
    { level: 3, title: "Mixed Operations", desc: "Addition and subtraction combined", percent: 85, status: "In Progress", color: "#ffa726" },
    { level: 4, title: "Complex Fractions", desc: "Advanced fraction operations", percent: 45, status: "In Progress", color: "#ff2d2d" },
  ];

  const performanceTrends = [
    { label: "Accuracy Improvement", value: "+12%", color: "#19c37d" },
    { label: "Avg Session Time", value: "15min", color: "#3b82f6" },
    { label: "Sessions This Week", value: 3, color: "#ffa726" },
    { label: "First Try Success", value: "92%", color: "#ff2d2d" },
  ];

  const sessionStats = [
    { label: "Problems Solved", value: 247 },
    { label: "Correct Answers", value: "232 (94%)" },
    { label: "Hints Used", value: 23 },
    { label: "Average Response Time", value: "12.5 seconds" },
    { label: "Fastest Solve Time", value: "3.2 seconds" },
  ];

  const recentActivity = [
    {
      time: "2 hours ago",
      title: "Completed Level 3 - Problem Set 5",
      desc: "Solved 15/18 problems correctly (83% accuracy)",
    },
    {
      time: "5 hours ago",
      title: "Started Level 4 - Complex Fractions",
      desc: "First attempt at advanced problems",
    },
    {
      time: "Yesterday",
      title: "Earned \"Speed Demon\" Achievement",
      desc: "Solved 10 problems in under 2 minutes each",
    },
    {
      time: "2 days ago",
      title: "Perfect Score on Level 2 Final Test",
      desc: "20/20 problems correct, unlocked Level 3",
    },
    {
      time: "3 days ago",
      title: "Study Session - Mixed Numbers Practice",
      desc: "45 minutes focused practice session",
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
    studentCard: { background: "#fff", borderRadius: 16, boxShadow: "0 2px 8px #0001", padding: 24, margin: "24px auto 0 auto", maxWidth: 1200, display: "flex", alignItems: "center", justifyContent: "space-between" },
    studentInfo: { display: "flex", alignItems: "center", gap: 16 },
    studentAvatar: { width: 48, height: 48, borderRadius: "50%", objectFit: "cover" },
    studentName: { fontWeight: 700, fontSize: 22 },
    studentMeta: { color: "#888", fontSize: 15 },
    updated: { color: "#888", fontSize: 13 },
    summaryRow: { display: "flex", gap: 24, margin: "32px 0 0 0", justifyContent: "center" },
    summaryCard: { flex: 1, background: "#fff", borderRadius: 16, padding: 20, display: "flex", alignItems: "center", gap: 16, minWidth: 160, boxShadow: "0 2px 8px #0001", flexDirection: "column" },
    summaryIcon: { height: 32, width: 32 },
    summaryLabel: { fontWeight: 500, fontSize: 16, color: "#222", marginTop: 8 },
    summaryValue: { fontWeight: 700, fontSize: 24, color: "#222" },
    mainGrid: { display: "flex", gap: 24, margin: "32px auto", maxWidth: 1200 },
    leftCol: { flex: 1.5, background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 2px 8px #0001", minWidth: 340 },
    rightCol: { flex: 1, background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 2px 8px #0001", minWidth: 340, display: "flex", flexDirection: "column", alignItems: "center" },
    sectionTitle: { fontWeight: 700, fontSize: 20, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 },
    levelRow: { display: "flex", flexDirection: "column", gap: 18 },
    levelItem: { display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid #eee", padding: "16px 0" },
    levelNum: color => ({ background: color, color: "#fff", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18 }),
    levelInfo: { flex: 1 },
    levelTitleText: { fontWeight: 600, fontSize: 16 },
    levelDesc: { color: "#888", fontSize: 14 },
    levelPercent: { fontWeight: 700, fontSize: 18, marginRight: 12 },
    levelStatus: color => ({ background: color, color: "#fff", borderRadius: 8, padding: "4px 12px", fontWeight: 600, fontSize: 13 }),
    perfTitle: { fontWeight: 700, fontSize: 20, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 },
    perfRow: { display: "flex", gap: 32, marginBottom: 16 },
    perfCol: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center" },
    perfValue: color => ({ color, fontWeight: 700, fontSize: 22 }),
    perfLabel: { color: "#888", fontSize: 14, marginTop: 4 },
    perfSmall: { color: "#888", fontSize: 13 },
    perfBig: { color: "#ff2d2d", fontWeight: 700, fontSize: 22 },
    perfGreen: { color: "#19c37d", fontWeight: 700, fontSize: 22 },
    perfBlue: { color: "#3b82f6", fontWeight: 700, fontSize: 22 },
    perfOrange: { color: "#ffa726", fontWeight: 700, fontSize: 22 },
    perfPink: { color: "#ff2d2d", fontWeight: 700, fontSize: 22 },
    statsCard: { background: "#fff", borderRadius: 16, boxShadow: "0 2px 8px #0001", padding: 32, margin: "32px auto", maxWidth: 600, minWidth: 340 },
    statsTitle: { fontWeight: 700, fontSize: 20, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 },
    statsRow: { display: "flex", flexDirection: "column", gap: 8, fontSize: 16 },
    statsLabel: { color: "#888" },
    statsValue: { fontWeight: 700, fontSize: 16, color: "#222", marginLeft: 8 },
    activityCard: { background: "#faf9fb", borderRadius: 16, boxShadow: "0 2px 8px #0001", padding: 32, margin: "32px auto", maxWidth: 1200 },
    activityTitle: { fontWeight: 700, fontSize: 20, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 },
    timeline: { borderLeft: "3px solid #3b82f6", paddingLeft: 24, marginLeft: 8 },
    timelineItem: { marginBottom: 28, position: "relative" },
    timelineDot: { position: "absolute", left: -13, top: 2, width: 12, height: 12, borderRadius: "50%", background: "#3b82f6" },
    timelineTime: { color: "#888", fontSize: 13, marginBottom: 2 },
    timelineTitle: { fontWeight: 600, fontSize: 15 },
    timelineDesc: { color: "#888", fontSize: 14 },
    perfChartWrap: { marginTop: 24, display: "flex", flexDirection: "column", alignItems: "center" },
    perfChart: { width: 180, height: 180, borderRadius: "50%", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" },
    perfChartRing: { position: "absolute", top: 0, left: 0, width: 180, height: 180, borderRadius: "50%", border: "16px solid #3b82f6", borderTopColor: "#e0e0e0", transform: "rotate(-45deg)" },
    perfChartText: { position: "absolute", top: 0, left: 0, width: 180, height: 180, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 38, color: "#222" },
    perfChartLabel: { marginTop: 16, fontWeight: 700, fontSize: 18, color: "#19c37d" },
    perfChartDesc: { marginTop: 8, color: "#888", fontSize: 15, textAlign: "center" },
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

      {/* Back Button and Student Info */}
      <button style={styles.backBtn} onClick={() => onNavigate && onNavigate('detailedreport')}>
        <img src={iconBack} alt="Back" style={{ height: 24, width: 24 }} /> Back
      </button>
      <div style={styles.studentCard}>
        <div style={styles.studentInfo}>
          <img
            src="https://ui-avatars.com/api/?name=Justine+Nabunturan&background=3b82f6&color=fff"
            alt="Student"
            style={styles.studentAvatar}
          />
          <div>
            <div style={styles.studentName}>Justine Nabunturan</div>
            <div style={styles.studentMeta}>
              Grade 4 – Rizal Section • Student ID: 2024-001 • Online Now
            </div>
          </div>
        </div>
        <div style={styles.updated}>Last Updated: 5 minutes ago</div>
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

      {/* Main Grid */}
      <div style={styles.mainGrid}>
        {/* Level Progress */}
        <div style={styles.leftCol}>
          <div style={styles.sectionTitle}>
            <span role="img" aria-label="progress">📊</span> Level Progress
          </div>
          <div style={styles.levelRow}>
            {levelProgress.map((lvl, idx) => (
              <div key={idx} style={styles.levelItem}>
                <div style={styles.levelNum(lvl.color)}>{lvl.level}</div>
                <div style={styles.levelInfo}>
                  <div style={styles.levelTitleText}>{lvl.title}</div>
                  <div style={styles.levelDesc}>{lvl.desc}</div>
                </div>
                <div style={styles.levelPercent}>{lvl.percent}%</div>
                <div style={styles.levelStatus(lvl.color)}>{lvl.status}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Overall Performance */}
        <div style={styles.rightCol}>
          <div style={styles.sectionTitle}>
            <span role="img" aria-label="performance">📈</span> Overall Performance
          </div>
          <div style={styles.perfChartWrap}>
            <div style={styles.perfChart}>
              <div style={styles.perfChartRing}></div>
              <div style={styles.perfChartText}>95%</div>
            </div>
            <div style={styles.perfChartLabel}>Excellent Performance!</div>
            <div style={styles.perfChartDesc}>
              Justine is performing exceptionally well across all levels. She shows strong understanding of fraction concepts and maintains high accuracy rates.
            </div>
          </div>
        </div>
      </div>

      {/* Performance Trends & Session Stats */}
      <div style={{ display: "flex", gap: 24, margin: "32px auto", maxWidth: 1200 }}>
        {/* Performance Trends */}
        <div style={{ flex: 1 }}>
          <div style={styles.statsCard}>
            <div style={styles.statsTitle}>
              <span role="img" aria-label="trends">📈</span> Performance Trends
            </div>
            <div style={styles.perfRow}>
              <div style={styles.perfCol}>
                <div style={styles.perfGreen}>{performanceTrends[0].value}</div>
                <div style={styles.perfLabel}>{performanceTrends[0].label}</div>
              </div>
              <div style={styles.perfCol}>
                <div style={styles.perfBlue}>{performanceTrends[1].value}</div>
                <div style={styles.perfLabel}>{performanceTrends[1].label}</div>
              </div>
              <div style={styles.perfCol}>
                <div style={styles.perfOrange}>{performanceTrends[2].value}</div>
                <div style={styles.perfLabel}>{performanceTrends[2].label}</div>
              </div>
              <div style={styles.perfCol}>
                <div style={styles.perfPink}>{performanceTrends[3].value}</div>
                <div style={styles.perfLabel}>{performanceTrends[3].label}</div>
              </div>
            </div>
          </div>
        </div>
        {/* Session Statistics */}
        <div style={{ flex: 1 }}>
          <div style={styles.statsCard}>
            <div style={styles.statsTitle}>
              <span role="img" aria-label="stats">⚡</span> Session Statistics
            </div>
            <div style={styles.statsRow}>
              {sessionStats.map((stat, idx) => (
                <div key={idx}>
                  <span style={styles.statsLabel}>{stat.label}:</span>
                  <span style={styles.statsValue}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={styles.activityCard}>
        <div style={styles.activityTitle}>
          <span role="img" aria-label="activity">🗓️</span> Recent Activity
        </div>
        <div style={styles.timeline}>
          {recentActivity.map((item, idx) => (
            <div key={idx} style={styles.timelineItem}>
              <div style={styles.timelineDot}></div>
              <div style={styles.timelineTime}>{item.time}</div>
              <div style={styles.timelineTitle}>{item.title}</div>
              <div style={styles.timelineDesc}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}