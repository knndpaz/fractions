import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import {
  Home,
  BarChart3,
  ChevronDown,
  Search,
  Users,
  Target,
  TrendingUp,
  Award,
  Download,
  Eye,
  X,
} from "lucide-react";

const logo = process.env.PUBLIC_URL + "/logo.png";

export default function Reports({ onNavigate, currentUser, onLogout }) {
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [teacherData, setTeacherData] = useState(null);

  // Load data from Supabase
  useEffect(() => {
    loadAllData();
    loadTeacherData();
  }, [currentUser?.id]);

  const loadTeacherData = async () => {
    if (!currentUser?.id) return;
    try {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (!error && data) {
        setTeacherData(data);
      }
    } catch (error) {
      console.error("Error loading teacher data:", error);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load ALL sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from("sections")
        .select("*")
        .order("created_at", { ascending: true });

      if (sectionsError) {
        console.error("Error loading sections:", sectionsError);
        setSections([]);
      } else {
        setSections(sectionsData || []);
      }

      // Load ALL students with their section data and progress
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select(
          `
          id,
          user_id,
          name,
          username,
          email,
          section_id,
          created_at,
          sections (
            id,
            name
          )
        `
        )
        .order("created_at", { ascending: true });

      if (studentsError) {
        console.error("Error loading students:", studentsError);
        setStudents([]);
      } else {
        // Now load progress for each student
        const studentsWithProgress = await Promise.all(
          (studentsData || []).map(async (student) => {
            if (!student.user_id) return { ...student, student_progress: [] };

            const { data: progressData, error: progressError } = await supabase
              .from("student_progress")
              .select("*")
              .eq("user_id", student.user_id);

            if (progressError) {
              console.error(
                `Error loading progress for student ${student.id}:`,
                progressError
              );
              return { ...student, student_progress: [] };
            }

            return { ...student, student_progress: progressData || [] };
          })
        );

        setStudents(studentsWithProgress);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setSections([]);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Aggregate helper for one user across level groups 1..3
  const summarizeUser = (student) => {
    const rows = Array.isArray(student.student_progress)
      ? student.student_progress
      : [];
    const byLevel = { 1: null, 2: null, 3: null };

    rows.forEach((r) => {
      const g = Number(r.level_group);
      if ([1, 2, 3].includes(g)) byLevel[g] = r;
    });

    // Completion: average completion_rate over groups (missing group = 0)
    const compSum = [1, 2, 3].reduce(
      (s, g) => s + (byLevel[g]?.completion_rate || 0),
      0
    );
    const overallCompletion = Math.round(compSum / 3);

    // Accuracy: total_correct / total_attempts across groups
    const totalAttempts = [1, 2, 3].reduce(
      (s, g) => s + (byLevel[g]?.total_attempts || 0),
      0
    );
    const totalCorrect = [1, 2, 3].reduce(
      (s, g) => s + (byLevel[g]?.correct_answers || 0),
      0
    );
    const overallAccuracy =
      totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    // Current level reached (rough): highest group with meaningful progress
    let currentLevel = 0;
    for (let g = 1; g <= 3; g++) {
      const r = byLevel[g];
      if (!r) continue;
      const progressed =
        (r.completion_rate || 0) > 0 ||
        (r.current_stage || 1) > 1 ||
        (r.total_attempts || 0) > 0;
      if (progressed) currentLevel = Math.max(currentLevel, g);
      if ((r.completion_rate || 0) === 100)
        currentLevel = Math.max(currentLevel, g);
    }

    // Completed all levels (1..3)
    const isCompletedAll = [1, 2, 3].every(
      (g) => (byLevel[g]?.completion_rate || 0) === 100
    );

    // Last activity
    const lastDates = rows
      .map((r) => r.last_played)
      .filter(Boolean)
      .map((d) => new Date(d).getTime());
    const lastPlayed = lastDates.length
      ? new Date(Math.max(...lastDates)).toISOString()
      : null;

    return {
      overallCompletion,
      overallAccuracy,
      currentLevel,
      isCompletedAll,
      totalAttempts,
      totalCorrect,
      lastPlayed,
    };
  };

  const calculateSectionStats = (sectionId) => {
    const roster = students.filter(
      (student) => student.section_id === sectionId
    );

    if (roster.length === 0) {
      return {
        totalStudents: 0,
        avgCompletion: 0,
        avgAccuracy: 0,
        levelDistribution: { level1: 0, level2: 0, level3: 0, completed: 0 },
      };
    }

    const summaries = roster.map(summarizeUser);
    const avgCompletion = Math.round(
      summaries.reduce((sum, x) => sum + x.overallCompletion, 0) / roster.length
    );
    const avgAccuracy = Math.round(
      summaries.reduce((sum, x) => sum + x.overallAccuracy, 0) / roster.length
    );

    const level1 = summaries.filter((x) => x.currentLevel >= 1).length;
    const level2 = summaries.filter((x) => x.currentLevel >= 2).length;
    const level3 = summaries.filter((x) => x.currentLevel >= 3).length;
    const completed = summaries.filter((x) => x.isCompletedAll).length;

    return {
      totalStudents: roster.length,
      avgCompletion,
      avgAccuracy,
      levelDistribution: { level1, level2, level3, completed },
    };
  };

  const overallStats = (() => {
    if (students.length === 0) {
      return {
        totalStudents: 0,
        totalSections: sections.length,
        avgProgress: 0,
        avgAccuracy: 0,
      };
    }
    const summaries = students.map(summarizeUser);
    const avgProgress = Math.round(
      summaries.reduce((s, x) => s + x.overallCompletion, 0) / students.length
    );
    const avgAccuracy = Math.round(
      summaries.reduce((s, x) => s + x.overallAccuracy, 0) / students.length
    );
    return {
      totalStudents: students.length,
      totalSections: sections.length,
      avgProgress,
      avgAccuracy,
    };
  })();

  const filteredSections = sections.filter((section) =>
    section.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Export report functionality
  const handleExportReport = () => {
    const reportData = filteredSections.map((section) => {
      const stats = calculateSectionStats(section.id);
      return {
        Section: section.name,
        "Total Students": stats.totalStudents,
        "Avg Completion": `${stats.avgCompletion}%`,
        "Avg Accuracy": `${stats.avgAccuracy}%`,
        "Level 1": stats.levelDistribution.level1,
        "Level 2": stats.levelDistribution.level2,
        "Level 3": stats.levelDistribution.level3,
        Completed: stats.levelDistribution.completed,
      };
    });

    // Convert to CSV
    const headers = Object.keys(reportData[0] || {});
    const csvContent = [
      headers.join(","),
      ...reportData.map((row) =>
        headers.map((header) => row[header]).join(",")
      ),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `section-reports-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Sign out + navigate to login
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Logout failed:", e?.message || e);
    } finally {
      setShowUserMenu(false);
      if (typeof onLogout === "function") onLogout();
      if (typeof onNavigate === "function") onNavigate("login");
    }
  };

  // Helper to get display name
  const getDisplayName = () => {
    return (
      teacherData?.full_name ||
      teacherData?.username ||
      currentUser?.user_metadata?.full_name ||
      currentUser?.user_metadata?.username ||
      "User"
    );
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
                      {getDisplayName()}
                    </div>
                    <div className="text-orange-100 text-xs">Admin</div>
                  </div>
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      getDisplayName()
                    )}&background=F68C2E&color=fff`}
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
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition-colors"
                    >
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
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            Reports & Analytics 📊
          </h1>
          <p className="text-gray-600">
            Track student progress, performance metrics, and section statistics
          </p>
        </div>

        {/* Overall Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 transform hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-blue-100 rounded-xl p-3">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-800">
              {overallStats.totalStudents}
            </div>
            <div className="text-sm text-gray-500 mt-1">Total Students</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 transform hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-orange-100 rounded-xl p-3">
                <Target className="text-orange-600" size={24} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-800">
              {overallStats.totalSections}
            </div>
            <div className="text-sm text-gray-500 mt-1">Sections</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 transform hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-100 rounded-xl p-3">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-800">
              {overallStats.avgProgress}%
            </div>
            <div className="text-sm text-gray-500 mt-1">Avg Progress</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 transform hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-purple-100 rounded-xl p-3">
                <Award className="text-purple-600" size={24} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-800">
              {overallStats.avgAccuracy}%
            </div>
            <div className="text-sm text-gray-500 mt-1">Avg Accuracy</div>
          </div>
        </div>

        {/* Search and Export Section */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search sections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            <button
              onClick={handleExportReport}
              disabled={filteredSections.length === 0}
              className="flex items-center justify-center space-x-2 bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Download size={20} />
              <span className="hidden sm:inline">Export Report</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading reports...</p>
          </div>
        )}

        {!loading && filteredSections.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredSections.map((section, index) => {
              const stats = calculateSectionStats(section.id);
              return (
                <div
                  key={section.id}
                  className="bg-white rounded-2xl shadow-lg p-6 transform hover:shadow-xl transition-all duration-300"
                  style={{
                    animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
                  }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800">
                      {section.name}
                    </h3>
                    <span className="bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-semibold">
                      {stats.totalStudents} Student
                      {stats.totalStudents !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Circular Progress Charts */}
                  <div className="flex justify-around mb-6">
                    <div className="flex flex-col items-center">
                      <div className="relative w-20 h-20 mb-2">
                        <svg className="transform -rotate-90 w-20 h-20">
                          <circle
                            cx="40"
                            cy="40"
                            r="32"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                            fill="none"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r="32"
                            stroke="#3b82f6"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${
                              stats.avgCompletion * 2.01
                            } 201`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-gray-800">
                            {stats.avgCompletion}%
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 text-center">
                        Avg Completion
                      </span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="relative w-20 h-20 mb-2">
                        <svg className="transform -rotate-90 w-20 h-20">
                          <circle
                            cx="40"
                            cy="40"
                            r="32"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                            fill="none"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r="32"
                            stroke="#10b981"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${stats.avgAccuracy * 2.01} 201`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-gray-800">
                            {stats.avgAccuracy}%
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 text-center">
                        Avg Accuracy
                      </span>
                    </div>
                  </div>

                  {/* Level Distribution */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Level 1</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">
                        {stats.levelDistribution.level1}/{stats.totalStudents}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            stats.totalStudents > 0
                              ? (stats.levelDistribution.level1 /
                                  stats.totalStudents) *
                                100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Level 2</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">
                        {stats.levelDistribution.level2}/{stats.totalStudents}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            stats.totalStudents > 0
                              ? (stats.levelDistribution.level2 /
                                  stats.totalStudents) *
                                100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Level 3</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">
                        {stats.levelDistribution.level3}/{stats.totalStudents}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            stats.totalStudents > 0
                              ? (stats.levelDistribution.level3 /
                                  stats.totalStudents) *
                                100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Completed</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">
                        {stats.levelDistribution.completed}/
                        {stats.totalStudents}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            stats.totalStudents > 0
                              ? (stats.levelDistribution.completed /
                                  stats.totalStudents) *
                                100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      onNavigate && onNavigate("detailedreport", section)
                    }
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                  >
                    <Eye size={20} />
                    <span>View Detailed Report</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredSections.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <BarChart3 size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No sections found
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? "Try adjusting your search query"
                : "Create sections in the Home page to see reports"}
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
