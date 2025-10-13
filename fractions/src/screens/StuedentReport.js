import React from "react";
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

const logo = process.env.PUBLIC_URL + "/logo.png";

export default function StudentReport({ student, onNavigate }) {
  // Safety check for student prop
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

  // Dummy data for demonstration - In real app, fetch this based on student.id
  const summary = [
    {
      icon: Trophy,
      label: "Overall Progress",
      value: "95%",
      color: "from-yellow-400 to-orange-500",
    },
    {
      icon: Percent,
      label: "Avg Accuracy",
      value: "80%",
      color: "from-green-400 to-emerald-500",
    },
    {
      icon: Clock,
      label: "Total Time",
      value: "2h 15m",
      color: "from-blue-400 to-cyan-500",
    },
    {
      icon: BookOpen,
      label: "Sessions",
      value: 12,
      color: "from-purple-400 to-pink-500",
    },
  ];

  const levelProgress = [
    {
      level: 1,
      title: "Basic Addition",
      desc: "Simple fraction addition problems",
      percent: 100,
      status: "Completed",
      color: "green",
    },
    {
      level: 2,
      title: "Basic Subtraction",
      desc: "Simple fraction subtraction problems",
      percent: 100,
      status: "Completed",
      color: "green",
    },
    {
      level: 3,
      title: "Mixed Operations",
      desc: "Addition and subtraction combined",
      percent: 85,
      status: "In Progress",
      color: "orange",
    },
    {
      level: 4,
      title: "Complex Fractions",
      desc: "Advanced fraction operations",
      percent: 45,
      status: "In Progress",
      color: "red",
    },
  ];

  const performanceTrends = [
    {
      label: "Accuracy Improvement",
      value: "+12%",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Avg Session Time",
      value: "15min",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "Sessions This Week",
      value: 3,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      label: "First Try Success",
      value: "92%",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
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
      title: 'Earned "Speed Demon" Achievement',
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

  const getLevelColor = (color) => {
    if (color === "green") return "bg-green-500";
    if (color === "orange") return "bg-orange-500";
    return "bg-red-500";
  };

  // Get student name with fallback
  const studentName = student.name || "Unknown Student";
  const studentSection = student.sections?.name || "Unknown Section";
  const studentId = student.id || "N/A";
  const studentEmail = student.email || "No email";

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
                  <div className="text-white font-semibold text-sm">
                    Justine Nabunturan
                  </div>
                  <div className="text-orange-100 text-xs">Admin</div>
                </div>
                <img
                  src="https://ui-avatars.com/api/?name=Justine+Nabunturan&background=F68C2E&color=fff"
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
          onClick={() => onNavigate && onNavigate("detailedreport", student)}
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
                <h1 className="text-2xl font-bold text-gray-800">
                  {studentName}
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  {studentSection} • Student ID: {studentId} • {studentEmail}
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Last Updated: <span className="font-semibold">5 minutes ago</span>
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
                <div className="text-3xl font-bold text-gray-800">
                  {item.value}
                </div>
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
              <h2 className="text-2xl font-bold text-gray-800">
                Level Progress
              </h2>
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
                      <div className="font-semibold text-gray-800 mb-1">
                        {lvl.title}
                      </div>
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
                      <div className="font-bold text-xl text-gray-800">
                        {lvl.percent}%
                      </div>
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
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="#e5e7eb"
                    strokeWidth="16"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="url(#gradient)"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 88 * 0.95} ${
                      2 * Math.PI * 88
                    }`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient
                      id="gradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl font-bold text-gray-800">95%</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-3">
                <Award className="text-green-600" size={24} />
                <span className="text-xl font-bold text-green-600">
                  Excellent Performance!
                </span>
              </div>

              <p className="text-center text-gray-600 text-sm">
                {studentName} is performing exceptionally well across all
                levels. Shows strong understanding of fraction concepts and
                maintains high accuracy rates.
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
              <h2 className="text-2xl font-bold text-gray-800">
                Performance Trends
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {performanceTrends.map((trend, idx) => (
                <div
                  key={idx}
                  className={`${trend.bgColor} rounded-xl p-4 text-center`}
                >
                  <div className={`text-3xl font-bold ${trend.color} mb-2`}>
                    {trend.value}
                  </div>
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
              <h2 className="text-2xl font-bold text-gray-800">
                Session Statistics
              </h2>
            </div>

            <div className="space-y-3">
              {sessionStats.map((stat, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
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
            <h2 className="text-2xl font-bold text-gray-800">
              Recent Activity
            </h2>
          </div>

          <div className="space-y-6">
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
                  <div className="font-semibold text-gray-800 mb-1">
                    {item.title}
                  </div>
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
