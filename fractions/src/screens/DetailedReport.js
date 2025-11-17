import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabase";
import {
  Home,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  Users,
  Clock,
  Target,
  Activity,
  TrendingUp,
  AlertCircle,
  Award,
  Bell,
} from "lucide-react";

const logo = process.env.PUBLIC_URL + "/logo.png";

export default function DetailedReport({ section, onNavigate, currentUser, onLogout }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (!section || !section.id) {
      console.error("Section prop is missing or invalid");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Get ALL users in this section (not filtered by teacher)
        const { data: usersData } = await supabase
          .from("users")
          .select(`
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
              last_played
            )
          `)
          .eq("section", section.name);

        const roster = (usersData || []).map((u) => ({
          id: u.id,
          name: u.full_name || u.username,
          section_name: u.section,
          _progress: Array.isArray(u.student_progress) ? u.student_progress : [],
        }));

        setStudents(roster);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [section?.id, section?.name]); // Removed currentUser?.id dependency

  // Summarize one student across level groups (for cards and tables)
  const summarizeProgress = (st) => {
    const rows = st._progress || [];
    const byLevel = { 1: null, 2: null, 3: null };
    rows.forEach((r) => {
      const g = Number(r.level_group);
      if ([1, 2, 3].includes(g)) byLevel[g] = r;
    });

    const compSum = [1, 2, 3].reduce(
      (s, g) => s + (byLevel[g]?.completion_rate || 0),
      0
    );
    const completion_rate = Math.round(compSum / 3);

    const total_attempts = [1, 2, 3].reduce(
      (s, g) => s + (byLevel[g]?.total_attempts || 0),
      0
    );
    const correct_answers = [1, 2, 3].reduce(
      (s, g) => s + (byLevel[g]?.correct_answers || 0),
      0
    );
    const accuracy =
      total_attempts > 0
        ? Math.round((correct_answers / total_attempts) * 100)
        : 0;

    let current_level = 0;
    for (let g = 1; g <= 3; g++) {
      const r = byLevel[g];
      if (!r) continue;
      const progressed =
        (r.completion_rate || 0) > 0 ||
        (r.current_stage || 1) > 1 ||
        (r.total_attempts || 0) > 0;
      if (progressed) current_level = Math.max(current_level, g);
      if ((r.completion_rate || 0) === 100) current_level = Math.max(current_level, g);
    }

    // Approx time spent (fallback): attempts * 12.5s -> minutes
    const time_spent = Math.round((total_attempts * 12.5) / 60);

    const lastDates = rows
      .map((r) => r.last_played)
      .filter(Boolean)
      .map((d) => new Date(d).getTime());
    const last_activity = lastDates.length
      ? new Date(Math.max(...lastDates)).toISOString()
      : null;

    const wrong_attempts = total_attempts - correct_answers;

    return {
      completion_rate,
      accuracy,
      current_level,
      time_spent, // minutes (approx)
      last_activity, // ISO string
      total_attempts,
      correct_answers,
      wrong_attempts,
    };
  };

  const getStudentProgress = (studentId) => {
    const st = students.find((s) => s.id === studentId);
    if (!st) {
      return {
        completion_rate: 0,
        accuracy: 0,
        current_level: 0,
        time_spent: 0,
        last_activity: null,
      };
    }
    return summarizeProgress(st);
  };

  const getStudentStatus = (progress) => {
    if (progress.accuracy >= 90 && progress.completion_rate >= 80) {
      return { label: "Excellent", color: "#10b981" };
    } else if (progress.accuracy < 60 || progress.wrong_attempts >= 5) {
      return { label: "Struggling", color: "#ef4444" };
    } else if (progress.accuracy >= 70 && progress.completion_rate >= 50) {
      return { label: "Good", color: "#3b82f6" };
    } else {
      return { label: "Needs Help", color: "#f59e0b" };
    }
  };

  const summary = (() => {
    const totalStudents = students.length;
    if (totalStudents === 0) {
      return {
        totalStudents: 0,
        avgTimePerSession: 0,
        avgAccuracy: 0,
        avgProgress: 0,
        activeThisWeek: 0,
      };
    }
    const all = students.map(summarizeProgress);
    const avgTimePerSession = Math.round(
      all.reduce((sum, p) => sum + p.time_spent, 0) / totalStudents
    );
    const avgAccuracy = Math.round(
      all.reduce((sum, p) => sum + p.accuracy, 0) / totalStudents
    );
    const avgProgress = Math.round(
      all.reduce((sum, p) => sum + p.completion_rate, 0) / totalStudents
    );

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const activeThisWeek = all.filter(
      (p) => p.last_activity && new Date(p.last_activity) >= weekAgo
    ).length;

    return { totalStudents, avgTimePerSession, avgAccuracy, avgProgress, activeThisWeek };
  })();

  const levelStats = (() => {
    const all = students.map(summarizeProgress);
    const reached = (lvl) => all.filter((p) => p.current_level >= lvl).length;
    const completed = all.filter((p) => p.completion_rate === 100).length;
    return [
      {
        title: "Level 1: Basic Addition",
        color: "#10b981",
        students: reached(1),
        completed: all.filter((p) => p.current_level > 1).length,
        struggling: all.filter(
          (p) =>
            p.current_level === 1 &&
            (p.accuracy < 70 || p.wrong_attempts >= 5)
        ).length,
      },
      {
        title: "Level 2: Basic Subtraction",
        color: "#3b82f6",
        students: reached(2),
        completed: all.filter((p) => p.current_level > 2).length,
        struggling: all.filter(
          (p) =>
            p.current_level === 2 &&
            (p.accuracy < 70 || p.wrong_attempts >= 5)
        ).length,
      },
      {
        title: "Level 3: Mixed Operations",
        color: "#f59e0b",
        students: reached(3),
        completed,
        struggling: all.filter(
          (p) =>
            p.current_level === 3 &&
            (p.accuracy < 70 || p.wrong_attempts >= 5)
        ).length,
      },
    ];
  })();

  const filteredStudents = students.filter((student) => {
    const progress = summarizeProgress(student);
    const status = getStudentStatus(progress);
    if (filterStatus === "all") return true;
    if (filterStatus === "excellent") return status.label === "Excellent";
    if (filterStatus === "needs-help")
      return status.label === "Needs Help" || status.label === "Struggling";
    return true;
  });

  const formatTimeSpent = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatLastActivity = (date) => {
    if (!date) return "Never";
    const now = new Date();
    const activity = new Date(date);
    const diffMs = now - activity;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  // FIX: define useMemo hooks BEFORE any early return to avoid conditional hooks
  // Summaries for Recommendations (replaces old gameProgress usage)
  const summaries = useMemo(() => students.map(summarizeProgress), [students]);
  const highPerformersCount = useMemo(
    () => summaries.filter((gp) => gp.accuracy >= 90 && gp.completion_rate >= 80).length,
    [summaries]
  );
  const lowPerformersCount = useMemo(
    () => summaries.filter((gp) => gp.accuracy < 60 || gp.completion_rate < 30).length,
    [summaries]
  );

  // Safety check: show error if no section (AFTER hooks)
  if (!section) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
            No Section Selected
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Please select a section to view detailed reports.
          </p>
          <button
            onClick={() => onNavigate && onNavigate("reports")}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-all"
          >
            <ChevronLeft size={24} />
            <span>Go to Reports</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-2xl p-2 shadow-lg transform hover:rotate-6 transition-transform duration-300">
                <img
                  src={logo}
                  alt="Logo"
                  className="h-12 w-12 sm:h-16 sm:w-16"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => onNavigate && onNavigate("home")}
                className="flex items-center space-x-2 bg-orange-400 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold hover:bg-orange-300 transform hover:scale-105 transition-all duration-300"
              >
                <Home size={20} />
                <span className="hidden sm:inline">Home</span>
              </button>
              <button
                onClick={() => onNavigate && onNavigate("reports")}
                className="flex items-center space-x-2 bg-white text-orange-600 px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                <BarChart3 size={20} />
                <span className="hidden sm:inline">Reports</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 sm:space-x-3 bg-white bg-opacity-20 hover:bg-opacity-30 px-2 sm:px-4 py-2 rounded-xl transition-all duration-300"
                >
                  <div className="text-right hidden sm:block">
                    <div className="text-white font-semibold text-sm">
                      Justine Nabunturan
                    </div>
                    <div className="text-orange-100 text-xs">Admin</div>
                  </div>
                  <img
                    src="https://ui-avatars.com/api/?name=Justine+Nabunturan&background=F68C2E&color=fff"
                    alt="User"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white"
                  />
                  <ChevronDown
                    size={20}
                    className="text-white hidden sm:block"
                  />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 z-50">
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors">
                      Profile
                    </button>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors">
                      Settings
                    </button>
                    <hr className="my-2" />
                    <button className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition-colors">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Back Button & Title */}
        <div className="mb-6">
          <button
            onClick={() => onNavigate && onNavigate("reports")}
            className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 font-semibold mb-4 transition-colors"
          >
            <ChevronLeft size={24} />
            <span>Back to Reports</span>
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 text-center">
            {section.name}
          </h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 transform hover:scale-105 transition-all">
            <div className="flex flex-col items-center">
              <div className="bg-blue-100 rounded-xl p-3 mb-3">
                <Users className="text-blue-600" size={24} />
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {summary.totalStudents}
              </div>
              <div className="text-sm text-gray-500 mt-1 text-center">
                Total Students
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 transform hover:scale-105 transition-all">
            <div className="flex flex-col items-center">
              <div className="bg-purple-100 rounded-xl p-3 mb-3">
                <Clock className="text-purple-600" size={24} />
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {summary.avgTimePerSession}m
              </div>
              <div className="text-sm text-gray-500 mt-1 text-center">
                Avg Time/Session
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 transform hover:scale-105 transition-all">
            <div className="flex flex-col items-center">
              <div className="bg-green-100 rounded-xl p-3 mb-3">
                <Target className="text-green-600" size={24} />
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {summary.avgAccuracy}%
              </div>
              <div className="text-sm text-gray-500 mt-1 text-center">
                Avg Accuracy
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 transform hover:scale-105 transition-all">
            <div className="flex flex-col items-center">
              <div className="bg-orange-100 rounded-xl p-3 mb-3">
                <TrendingUp className="text-orange-600" size={24} />
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {summary.avgProgress}%
              </div>
              <div className="text-sm text-gray-500 mt-1 text-center">
                Avg Progress
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 transform hover:scale-105 transition-all">
            <div className="flex flex-col items-center">
              <div className="bg-indigo-100 rounded-xl p-3 mb-3">
                <Activity className="text-indigo-600" size={24} />
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {summary.activeThisWeek}
              </div>
              <div className="text-sm text-gray-500 mt-1 text-center">
                Active This Week
              </div>
            </div>
          </div>
        </div>

        {/* Level Performance Analysis */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Level Performance Analysis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {levelStats.map((level, index) => (
              <div
                key={index}
                className="border-l-4 bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-all"
                style={{ borderColor: level.color }}
              >
                <h3 className="font-bold text-lg mb-4">{level.title}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Reached Level:</span>
                    <span className="font-semibold text-gray-800">
                      {level.students} students
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span className="font-semibold text-gray-800">
                      {level.completed} students
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Struggling:</span>
                    <span className="font-semibold text-red-600">
                      {level.struggling} students
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            summary.totalStudents > 0
                              ? (level.completed / summary.totalStudents) * 100
                              : 0
                          }%`,
                          backgroundColor: level.color,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <Bell className="mr-2 text-blue-600" size={24} />
            Recommendations & Action Items
          </h2>
          <div className="space-y-4">
            {levelStats[2].struggling > 0 && (
              <div className="flex items-start space-x-3 bg-white rounded-lg p-4">
                <AlertCircle
                  className="text-orange-500 flex-shrink-0 mt-1"
                  size={20}
                />
                <div>
                  <span className="font-semibold text-gray-800">
                    Focus Area: Level 3 Support -{" "}
                  </span>
                  <span className="text-gray-600">
                    {levelStats[2].struggling} students are struggling with
                    mixed operations. Consider additional practice sessions.
                  </span>
                </div>
              </div>
            )}

            {highPerformersCount > 0 && (
              <div className="flex items-start space-x-3 bg-white rounded-lg p-4">
                <Award
                  className="text-green-500 flex-shrink-0 mt-1"
                  size={20}
                />
                <div>
                  <span className="font-semibold text-gray-800">
                    High Performers -{" "}
                  </span>
                  <span className="text-gray-600">
                    {highPerformersCount} students are excelling. Consider advanced challenges.
                  </span>
                </div>
              </div>
            )}

            {lowPerformersCount > 0 && (
              <div className="flex items-start space-x-3 bg-white rounded-lg p-4">
                <AlertCircle
                  className="text-red-500 flex-shrink-0 mt-1"
                  size={20}
                />
                <div>
                  <span className="font-semibold text-gray-800">
                    Students Needing Immediate Attention -{" "}
                  </span>
                  <span className="text-gray-600">
                    {lowPerformersCount} students with low performance. Schedule one-on-one sessions.
                  </span>
                </div>
              </div>
            )}

            {summaries.length === 0 && (
              <div className="flex items-start space-x-3 bg-white rounded-lg p-4">
                <AlertCircle
                  className="text-gray-400 flex-shrink-0 mt-1"
                  size={20}
                />
                <div>
                  <span className="text-gray-600">
                    No student activity data available yet. Students need to
                    complete game sessions to generate insights.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Individual Student Progress */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-gray-800">
              Individual Student Progress
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  filterStatus === "all"
                    ? "bg-orange-500 text-white shadow-lg"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All Students
              </button>
              <button
                onClick={() => setFilterStatus("excellent")}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  filterStatus === "excellent"
                    ? "bg-green-500 text-white shadow-lg"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Excellent
              </button>
              <button
                onClick={() => setFilterStatus("needs-help")}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  filterStatus === "needs-help"
                    ? "bg-red-500 text-white shadow-lg"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Needs Help
              </button>
            </div>
          </div>

          {/* Mobile View */}
          <div className="block lg:hidden space-y-4">
            {filteredStudents.map((student) => {
              const progress = getStudentProgress(student.id);
              const status = getStudentStatus(progress);
              return (
                <div
                  key={student.id}
                  className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() =>
                    onNavigate &&
                    onNavigate("studentreport", { student, section })
                  }
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: status.color }}
                    >
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">
                        {student.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Level {progress.current_level}
                      </div>
                    </div>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: status.color }}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Progress:</span>
                      <span className="ml-2 font-semibold">
                        {progress.completion_rate}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Accuracy:</span>
                      <span className="ml-2 font-semibold">
                        {progress.accuracy}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Time:</span>
                      <span className="ml-2 font-semibold">
                        {formatTimeSpent(progress.time_spent || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Last Active:</span>
                      <span className="ml-2 font-semibold">
                        {formatLastActivity(progress.last_activity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Progress
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Current Level
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Accuracy
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Time Spent
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Last Activity
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student) => {
                  const progress = getStudentProgress(student.id);
                  const status = getStudentStatus(progress);
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() =>
                        onNavigate && onNavigate("studentreport", student)
                      }
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: status.color }}
                          >
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">
                            {student.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${progress.completion_rate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">
                            {progress.completion_rate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-800 font-medium">
                        Level {progress.current_level}
                      </td>
                      <td className="px-6 py-4 text-gray-800 font-medium">
                        {progress.accuracy}%
                      </td>
                      <td className="px-6 py-4 text-gray-800">
                        {formatTimeSpent(progress.time_spent || 0)}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {formatLastActivity(progress.last_activity)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: status.color }}
                        >
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Users size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No students found with the selected filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
