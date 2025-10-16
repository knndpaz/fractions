import React, { useEffect, useMemo, useState } from "react";
import {
  Home,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  Trophy,
  Percent,
  Clock,
  BookOpen,
  TrendingUp,
  Zap,
  Calendar,
  Target,
  Award,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../supabase";

const logo = process.env.PUBLIC_URL + "/logo.png";

// helpers
const MAX_STAGE = 4;
const fmtMins = (m) => {
  if (!m || m <= 0) return "0m";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${mm}m`;
};
const timeAgo = (iso) => {
  if (!iso) return "Never";
  const now = new Date();
  const d = new Date(iso);
  const diffMs = now - d;
  const h = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(h / 24);
  if (h < 1) return "Just now";
  if (h < 24) return `${h} hours ago`;
  return `${days} days ago`;
};
const dayKey = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

export default function StudentReport({ student, section, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [userRow, setUserRow] = useState(null); // users row with nested progress

  // Load this student's user + student_progress
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!student?.id) {
        if (mounted) {
          setUserRow(null);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("users")
          .select(
            `
            id,
            username,
            full_name,
            section,
            student_progress (
              level_group,
              completed_stages,
              current_stage,
              total_attempts,
              correct_answers,
              accuracy,
              completion_rate,
              last_played,
              created_at
            )
          `
          )
          .eq("id", student.id)
          .single();
        if (error) throw error;
        if (mounted) setUserRow(data || null);
      } catch (e) {
        console.error("Failed to load student report:", e);
        if (mounted) setUserRow(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [student?.id]);

  const progRows = useMemo(
    () => (Array.isArray(userRow?.student_progress) ? userRow.student_progress : []),
    [userRow]
  );

  // Aggregate metrics
  const totals = useMemo(() => {
    const byLevel = { 1: null, 2: null, 3: null };
    for (const r of progRows) {
      const g = Number(r.level_group);
      if ([1, 2, 3].includes(g)) byLevel[g] = r;
    }
    const totalAttempts = [1, 2, 3].reduce((s, g) => s + (byLevel[g]?.total_attempts || 0), 0);
    const totalCorrect = [1, 2, 3].reduce((s, g) => s + (byLevel[g]?.correct_answers || 0), 0);
    const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    const compAvg = Math.round(
      [1, 2, 3].reduce((s, g) => s + (byLevel[g]?.completion_rate || 0), 0) / 3
    );

    // Estimated total time from attempts (12.5s/attempt)
    const totalTimeMinutes = Math.round((totalAttempts * 12.5) / 60);

    // Sessions = distinct days of last_played across levels
    const daySet = new Set(
      progRows.map((r) => dayKey(r.last_played)).filter(Boolean)
    );
    const sessions = daySet.size;

    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    const sessionsThisWeek = new Set(
      progRows
        .filter((r) => r.last_played && new Date(r.last_played) >= weekAgo)
        .map((r) => dayKey(r.last_played))
        .filter(Boolean)
    ).size;

    const avgSessionTimeMin = sessions > 0 ? Math.round(totalTimeMinutes / sessions) : 0;

    // Current level heuristic
    let currentLevel = 0;
    for (let g = 1; g <= 3; g++) {
      const r = byLevel[g];
      if (!r) continue;
      const progressed =
        (r.completion_rate || 0) > 0 || (r.current_stage || 1) > 1 || (r.total_attempts || 0) > 0;
      if (progressed) currentLevel = Math.max(currentLevel, g);
      if ((r.completion_rate || 0) === 100) currentLevel = Math.max(currentLevel, g);
    }

    const lastDates = progRows
      .map((r) => r.last_played)
      .filter(Boolean)
      .map((d) => new Date(d).getTime());
    const lastActivity = lastDates.length ? new Date(Math.max(...lastDates)).toISOString() : null;

    const performanceScore = Math.round(0.6 * compAvg + 0.4 * accuracy); // simple blend

    return {
      totalAttempts,
      totalCorrect,
      accuracy,
      compAvg,
      totalTimeMinutes,
      sessions,
      sessionsThisWeek,
      avgSessionTimeMin,
      currentLevel,
      lastActivity,
      performanceScore,
    };
  }, [progRows]);

  // Per-level progress cards
  const levelProgress = useMemo(() => {
    const get = (g) => progRows.find((r) => Number(r.level_group) === g) || {};
    const mk = (g, title, desc) => {
      const r = get(g);
      const percent = Math.max(0, Math.min(100, Number(r.completion_rate || 0)));
      const status = percent === 100 ? "Completed" : percent > 0 ? "In Progress" : "Locked";
      const color = percent === 100 ? "green" : percent >= 60 ? "orange" : "red";
      return { level: g, title, desc, percent, status, color };
    };
    return [
      mk(1, "Basic Addition", "Simple fraction addition problems"),
      mk(2, "Basic Subtraction", "Simple fraction subtraction problems"),
      mk(3, "Mixed Operations", "Addition and subtraction combined"),
    ];
  }, [progRows]);

  // Performance trends (simple, based on current snapshot)
  const performanceTrends = useMemo(() => {
    return [
      {
        label: "Accuracy",
        value: `${totals.accuracy}%`,
        color: "text-green-600",
        bgColor: "bg-green-100",
      },
      {
        label: "Avg Session Time",
        value: fmtMins(totals.avgSessionTimeMin),
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      },
      {
        label: "Sessions This Week",
        value: totals.sessionsThisWeek,
        color: "text-orange-600",
        bgColor: "bg-orange-100",
      },
      {
        label: "First Try Success",
        value: `${totals.accuracy}%`, // approx = accuracy
        color: "text-purple-600",
        bgColor: "bg-purple-100",
      },
    ];
  }, [totals]);

  // Session statistics
  const sessionStats = useMemo(() => {
    return [
      { label: "Problems Solved", value: totals.totalCorrect },
      { label: "Correct Answers", value: `${totals.totalCorrect} (${totals.accuracy}%)` },
      { label: "Average Response Time", value: "12.5 seconds" },
      { label: "Sessions", value: totals.sessions },
      { label: "Avg Session Time", value: fmtMins(totals.avgSessionTimeMin) },
    ];
  }, [totals]);

  // NEW: Summary cards content
  const summary = useMemo(() => {
    return [
      {
        label: "Overall Progress",
        value: `${totals.compAvg}%`,
        icon: Trophy,
        color: "from-green-400 to-green-600",
      },
      {
        label: "Avg Accuracy",
        value: `${totals.accuracy}%`,
        icon: Percent,
        color: "from-blue-400 to-blue-600",
      },
      {
        label: "Total Time",
        value: fmtMins(totals.totalTimeMinutes),
        icon: Clock,
        color: "from-orange-400 to-orange-600",
      },
      {
        label: "Sessions",
        value: `${totals.sessions}`,
        icon: BookOpen,
        color: "from-purple-400 to-purple-600",
      },
    ];
  }, [totals]);

  // Recent activity list from student_progress
  const recentActivity = useMemo(() => {
    const rows = [...progRows].sort(
      (a, b) => new Date(b.last_played || 0) - new Date(a.last_played || 0)
    );
    return rows.map((r) => {
      const time = timeAgo(r.last_played);
      const lvl = Number(r.level_group) || 1;
      const comp = Number(r.completion_rate || 0);
      const curr = Number(r.current_stage || 1);
      const acc = Number(r.accuracy || 0);
      return {
        time,
        title: `Level ${lvl} Update`,
        desc: `Completed ${r.completed_stages || 0}/${MAX_STAGE} stages • Current Stage ${curr} • Accuracy ${acc}% • Completion ${comp}%`,
      };
    });
  }, [progRows]);

  const getLevelColor = (color) => {
    if (color === "green") return "bg-green-500";
    if (color === "orange") return "bg-orange-500";
    return "bg-red-500";
  };

  // Get student name with fallback
  const studentName = student?.name || userRow?.full_name || "Unknown Student";
  const studentSection = student?.sections?.name || userRow?.section || "Unknown Section";
  const studentId = student?.id || userRow?.id || "N/A";
  const studentEmail = student?.email || "No email";

  const perfRing = Math.max(0, Math.min(100, totals.performanceScore));
  const ringCirc = 2 * Math.PI * 88;

  // Safety check for student prop AFTER hooks to satisfy rules-of-hooks
  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
            No Student Selected
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Please select a student to view their detailed report.
          </p>
          <button
            onClick={() => onNavigate && onNavigate("reports")}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-all"
          >
            Go to Reports
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">Loading student report…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modern Navbar */}
      <nav className="bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-2xl p-2 shadow-lg transform hover:rotate-6 transition-transform duration-300">
                <img src={logo} alt="Logo" className="h-12 w-12" />
              </div>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => onNavigate && onNavigate("home")}
                className="flex items-center space-x-2 bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                <Home size={20} />
                <span>Home</span>
              </button>
              <button
                onClick={() => onNavigate && onNavigate("reports")}
                className="flex items-center space-x-2 bg-orange-400 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-300 transform hover:scale-105 transition-all duration-300"
              >
                <BarChart3 size={20} />
                <span>Reports</span>
              </button>

              {/* User Menu */}
              <div className="flex items-center space-x-3 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-xl transition-all duration-300">
                <div className="text-right hidden lg:block">
                  <div className="text-white font-semibold text-sm">Admin</div>
                  <div className="text-orange-100 text-xs">Dashboard</div>
                </div>
                <img
                  src={`https://ui-avatars.com/api/?name=Admin&background=F68C2E&color=fff`}
                  alt="User"
                  className="w-10 h-10 rounded-full border-2 border-white"
                />
                <ChevronDown size={20} className="text-white hidden lg:block" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Back Button */}
        <button
          onClick={() =>
            onNavigate &&
            onNavigate("detailedreport", {
              id: student.section_id,
              name: student.sections?.name || userRow?.section,
            })
          }
          className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 font-semibold mb-6 transform hover:translate-x-1 transition-all"
        >
          <ChevronLeft size={24} />
          <span>Back to Section Details</span>
        </button>

        {/* Student Info Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  studentName
                )}&background=3b82f6&color=fff&size=64`}
                alt="Student"
                className="w-16 h-16 rounded-full border-4 border-blue-100"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{studentName}</h1>
                <p className="text-gray-500 text-sm mt-1">
                  {studentSection} • Student ID: {studentId} • {studentEmail}
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Last Updated:{" "}
              <span className="font-semibold">{timeAgo(totals.lastActivity)}</span>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {summary.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300"
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-4`}
                >
                  <Icon className="text-white" size={32} />
                </div>
                <div className="text-gray-600 text-sm mb-1">{item.label}</div>
                <div className="text-3xl font-bold text-gray-800">{item.value}</div>
              </div>
            );
          })}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Level Progress */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-blue-100 rounded-xl p-3">
                <Target className="text-blue-600" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Level Progress</h2>
            </div>

            <div className="space-y-4">
              {levelProgress.map((lvl, idx) => (
                <div
                  key={idx}
                  className="border-2 border-gray-100 rounded-xl p-4 hover:border-orange-300 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`${getLevelColor(
                        lvl.color
                      )} text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0`}
                    >
                      {lvl.level}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 mb-1">{lvl.title}</div>
                      <div className="text-sm text-gray-500">{lvl.desc}</div>
                      <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`${getLevelColor(
                            lvl.color
                          )} h-full rounded-full transition-all duration-500`}
                          style={{ width: `${lvl.percent}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="font-bold text-xl text-gray-800">{lvl.percent}%</div>
                      <span
                        className={`${getLevelColor(
                          lvl.color
                        )} text-white px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap`}
                      >
                        {lvl.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overall Performance */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-green-100 rounded-xl p-3">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Performance</h2>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48 mb-6">
                <svg className="transform -rotate-90 w-48 h-48">
                  <circle cx="96" cy="96" r="88" stroke="#e5e7eb" strokeWidth="16" fill="none" />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="url(#gradient)"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${ringCirc * (perfRing / 100)} ${ringCirc}`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl font-bold text-gray-800">{perfRing}%</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-3">
                <Award className="text-green-600" size={24} />
                <span className="text-xl font-bold text-green-600">
                  {perfRing >= 85 ? "Excellent Performance!" : perfRing >= 60 ? "Good Progress" : "Needs Improvement"}
                </span>
              </div>

              <p className="text-center text-gray-600 text-sm">
                Performance is calculated from overall progress and accuracy.
              </p>
            </div>
          </div>
        </div>

        {/* Performance Trends & Session Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Performance Trends */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-purple-100 rounded-xl p-3">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Performance Trends</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {performanceTrends.map((trend, idx) => (
                <div key={idx} className={`${trend.bgColor} rounded-xl p-4 text-center`}>
                  <div className={`text-3xl font-bold ${trend.color} mb-2`}>{trend.value}</div>
                  <div className="text-sm text-gray-600">{trend.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Session Statistics */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-orange-100 rounded-xl p-3">
                <Zap className="text-orange-600" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Session Statistics</h2>
            </div>

            <div className="space-y-3">
              {sessionStats.map((stat, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">{stat.label}</span>
                  <span className="font-bold text-gray-800">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-indigo-100 rounded-xl p-3">
              <Calendar className="text-indigo-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Recent Activity</h2>
          </div>

          <div className="space-y-6">
            {recentActivity.length === 0 && (
              <div className="text-gray-500">No recent activity.</div>
            )}
            {recentActivity.map((item, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  {idx < recentActivity.length - 1 && (
                    <div className="w-0.5 h-full bg-blue-200 mt-2"></div>
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <div className="text-sm text-gray-500 mb-1">{item.time}</div>
                  <div className="font-semibold text-gray-800 mb-1">{item.title}</div>
                  <div className="text-sm text-gray-600">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
