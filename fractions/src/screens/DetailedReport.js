import React, { useState, useEffect } from "react";
import { supabase } from "../supabase"; // Add this import
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

export default function DetailedReport({ section, onNavigate }) {
  const [students, setStudents] = useState([]);
  const [gameProgress, setGameProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    // Define async function inside useEffect
    const fetchData = async () => {
      try {
        // Load students in this section
        const { data: studentsData } = await supabase
          .from("students")
          .select("*, sections(name)")
          .eq("section_id", section.id);

        setStudents(studentsData || []);

        // Load game progress
        const studentIds = studentsData?.map((s) => s.id) || [];
        const { data: progressData } = await supabase
          .from("game_progress")
          .select("*")
          .in("student_id", studentIds);

        setGameProgress(progressData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    // Call the async function
    fetchData();
  }, [section.id]); // Add section.id as dependency

  const getStudentProgress = (studentId) => {
    return (
      gameProgress.find((gp) => gp.student_id === studentId) || {
        completion_rate: 0,
        accuracy: 0,
        current_level: 0,
        time_spent: 0,
        last_activity: null,
      }
    );
  };

  const getStudentStatus = (progress) => {
    if (progress.accuracy >= 90 && progress.completion_rate >= 80) {
      return { label: "Excellent", color: "#10b981" };
    } else if (progress.accuracy >= 70 && progress.completion_rate >= 50) {
      return { label: "Good", color: "#3b82f6" };
    } else if (progress.completion_rate >= 25) {
      return { label: "Needs Help", color: "#f59e0b" };
    } else {
      return { label: "Struggling", color: "#ef4444" };
    }
  };

  const summary = {
    totalStudents: students.length,
    avgTimePerSession:
      gameProgress.length > 0
        ? Math.round(
            gameProgress.reduce((sum, gp) => sum + (gp.time_spent || 0), 0) /
              gameProgress.length
          )
        : 0,
    avgAccuracy:
      gameProgress.length > 0
        ? Math.round(
            gameProgress.reduce((sum, gp) => sum + (gp.accuracy || 0), 0) /
              gameProgress.length
          )
        : 0,
    avgProgress:
      gameProgress.length > 0
        ? Math.round(
            gameProgress.reduce(
              (sum, gp) => sum + (gp.completion_rate || 0),
              0
            ) / gameProgress.length
          )
        : 0,
    activeThisWeek: gameProgress.filter((gp) => {
      if (!gp.last_activity) return false;
      const lastActivity = new Date(gp.last_activity);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return lastActivity >= weekAgo;
    }).length,
  };

  const levelStats = [
    {
      title: "Level 1: Basic Addition",
      color: "#10b981",
      students: gameProgress.filter((gp) => gp.current_level >= 1).length,
      completed: gameProgress.filter((gp) => gp.current_level > 1).length,
      struggling: gameProgress.filter(
        (gp) => gp.current_level === 1 && gp.accuracy < 70
      ).length,
    },
    {
      title: "Level 2: Basic Subtraction",
      color: "#3b82f6",
      students: gameProgress.filter((gp) => gp.current_level >= 2).length,
      completed: gameProgress.filter((gp) => gp.current_level > 2).length,
      struggling: gameProgress.filter(
        (gp) => gp.current_level === 2 && gp.accuracy < 70
      ).length,
    },
    {
      title: "Level 3: Mixed Operations",
      color: "#f59e0b",
      students: gameProgress.filter((gp) => gp.current_level >= 3).length,
      completed: gameProgress.filter((gp) => gp.completion_rate === 100).length,
      struggling: gameProgress.filter(
        (gp) => gp.current_level === 3 && gp.accuracy < 70
      ).length,
    },
  ];

  const filteredStudents = students.filter((student) => {
    const progress = getStudentProgress(student.id);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <button
            onClick={() => onNavigate && onNavigate("reports")}
            className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 font-semibold mb-4 transition-colors"
          >
            <ChevronLeft size={24} />
            <span>Back to Reports</span>
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 text-center">
            {section?.name || "Section Details"}
          </h1>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
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

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
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

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
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

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
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

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
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

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Level Performance Analysis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {levelStats.map((level, index) => (
              <div
                key={index}
                className="border-l-4 bg-gray-50 rounded-lg p-6"
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

            {gameProgress.filter(
              (gp) => gp.accuracy >= 90 && gp.completion_rate >= 80
            ).length > 0 && (
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
                    {
                      gameProgress.filter(
                        (gp) => gp.accuracy >= 90 && gp.completion_rate >= 80
                      ).length
                    }{" "}
                    students are excelling. Consider advanced challenges.
                  </span>
                </div>
              </div>
            )}

            {gameProgress.filter(
              (gp) => gp.accuracy < 60 || gp.completion_rate < 30
            ).length > 0 && (
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
                    {
                      gameProgress.filter(
                        (gp) => gp.accuracy < 60 || gp.completion_rate < 30
                      ).length
                    }{" "}
                    students with low performance. Schedule one-on-one sessions.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

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

          <div className="block lg:hidden space-y-4">
            {filteredStudents.map((student) => {
              const progress = getStudentProgress(student.id);
              const status = getStudentStatus(progress);
              return (
                <div
                  key={student.id}
                  className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() =>
                    onNavigate && onNavigate("studentreport", student)
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
