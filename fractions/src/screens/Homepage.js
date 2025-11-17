import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import {
  Home,
  BarChart3,
  User,
  Users,
  BookOpen,
  Plus,
  X,
  Check,
  ChevronDown,
  Save,
  Trash2,
  PlusCircle,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";

// Images from public folder
const logo = process.env.PUBLIC_URL + "/logo.png";
const character = process.env.PUBLIC_URL + "/character.png";

export default function Homepage({ onNavigate, currentUser, onLogout }) {
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [sectionName, setSectionName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);

  // Single student form state
  const [studentName, setStudentName] = useState("");
  const [studentUsername, setStudentUsername] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentSection, setStudentSection] = useState("");

  // Multiple students mode
  const [isMultipleMode, setIsMultipleMode] = useState(false);
  const [multipleStudents, setMultipleStudents] = useState([
    {
      name: "",
      username: "",
      email: "",
      password: "",
      section: "",
      showPassword: false,
    },
  ]);
  const [sameSection, setSameSection] = useState(false);

  // Show notification helper
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load data on component mount and when user changes
  useEffect(() => {
    loadSections();
    loadStudents();
  }, [currentUser?.id]);

  // Load sections from Supabase (scoped to teacher)
  const loadSections = async () => {
    try {
      let q = supabase.from("sections").select("*").order("created_at", { ascending: true });
      if (currentUser?.id) q = q.eq("created_by", currentUser.id);
      const { data, error } = await q;
      if (error) {
        console.error("Error loading sections:", error);
      } else {
        setSections(data || []);
      }
    } catch (error) {
      console.error("Error loading sections:", error);
    }
  };

  // Load students scoped to teacher’s sections (inner join)
  const loadStudents = async () => {
    try {
      let q = supabase
        .from("students")
        .select(`
          *,
          sections!inner(id, name, created_by)
        `)
        .order("created_at", { ascending: true });
      if (currentUser?.id) q = q.eq("sections.created_by", currentUser.id);
      const { data, error } = await q;
      if (error) {
        console.error("Error loading students:", error);
      } else {
        setStudents(data || []);
      }
    } catch (error) {
      console.error("Error loading students:", error);
    }
  };

  // Add section handler (attach created_by)
  const handleAddSection = async () => {
    if (sectionName.trim()) {
      const exists = sections.some(
        (s) => s.name.toLowerCase() === sectionName.trim().toLowerCase()
      );
      if (exists) {
        alert("Section already exists!");
        return;
      }

      setLoading(true);
      try {
        const payload = {
          name: sectionName.trim(),
          progress: 0,
          ...(currentUser?.id ? { created_by: currentUser.id } : {}),
        };
        const { data, error } = await supabase
          .from("sections")
          .insert([payload])
          .select()
          .single();

        if (error) {
          alert("Error creating section: " + error.message);
        } else {
          setSections([...sections, data]);
          setSectionName("");
          showNotification("Section created successfully!");
        }
      } catch (error) {
        alert("Error creating section: " + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Helper function to find or create section (attach created_by)
  const findOrCreateSection = async (sectionName) => {
    if (!sectionName.trim()) return null;

    console.log("Finding or creating section:", sectionName.trim());
    const existingSection = sections.find(
      (s) => s.name.toLowerCase() === sectionName.trim().toLowerCase()
    );
    if (existingSection) {
      console.log("Section already exists:", existingSection);
      return existingSection;
    }

    try {
      console.log("Creating new section:", sectionName.trim());
      const payload = {
        name: sectionName.trim(),
        progress: 0,
        ...(currentUser?.id ? { created_by: currentUser.id } : {}),
      };
      const { data, error } = await supabase
        .from("sections")
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error("Error creating section:", error);
        return null;
      }
      console.log("New section created:", data);
      setSections((prev) => [...prev, data]);
      return data;
    } catch (error) {
      console.error("Error creating section:", error);
      return null;
    }
  };

  // Test Supabase connection
  const testSupabaseConnection = async () => {
    try {
      console.log("Testing Supabase connection...");

      // Test database connection
      const { data, error } = await supabase
        .from("sections")
        .select("count")
        .limit(1);

      if (error) {
        alert("Connection test failed: " + error.message);
      } else {
        alert("Connection test successful! Database is accessible.");
      }
    } catch (err) {
      console.error("Test error:", err);
      alert("Test failed: " + err.message);
    }
  };

  // Add more student forms in multiple mode
  const addStudentForm = () => {
    const newStudent = {
      name: "",
      username: "",
      email: "",
      password: "",
      section: "",
      showPassword: false,
    };

    // If same section is enabled and there's a section in the first form, use it
    if (sameSection && multipleStudents[0]?.section) {
      newStudent.section = multipleStudents[0].section;
    }

    setMultipleStudents([...multipleStudents, newStudent]);
  };

  // Toggle password visibility for multiple students
  const togglePasswordVisibility = (index) => {
    const updated = [...multipleStudents];
    updated[index].showPassword = !updated[index].showPassword;
    setMultipleStudents(updated);
  };

  // Remove student form
  const removeStudentForm = (index) => {
    if (multipleStudents.length > 1) {
      setMultipleStudents(multipleStudents.filter((_, i) => i !== index));
    }
  };

  // Update multiple student field
  const updateMultipleStudent = (index, field, value) => {
    const updated = [...multipleStudents];
    updated[index][field] = value;

    // If same section is enabled and we're updating the first student's section
    if (sameSection && index === 0 && field === "section") {
      // Update all other students' sections to match
      for (let i = 1; i < updated.length; i++) {
        updated[i].section = value;
      }
    }

    setMultipleStudents(updated);
  };

  // Handle same section toggle
  const handleSameSectionToggle = (checked) => {
    setSameSection(checked);

    if (checked && multipleStudents[0]?.section) {
      // Apply first student's section to all others
      const updated = multipleStudents.map((student, index) =>
        index === 0
          ? student
          : { ...student, section: multipleStudents[0].section }
      );
      setMultipleStudents(updated);
    }
  };

  // Get students count for each section
  const getStudentCount = (sectionId) => {
    return students.filter((student) => student.section_id === sectionId)
      .length;
  };

  // Helper: normalize strings
  const normalize = (s) => (s || "").trim();

  // Helper: check for existing username or email
  const checkExistingStudent = async (username, email) => {
    try {
      const uname = normalize(username);
      const mail = normalize(email);
      if (!uname && !mail) return null;

      // Check username
      if (uname) {
        const { data, error } = await supabase
          .from("students")
          .select("id, username, email")
          .eq("username", uname)
          .limit(1);
        if (!error && data && data.length > 0) return data[0];
      }

      // Check email
      if (mail) {
        const { data, error } = await supabase
          .from("students")
          .select("id, username, email")
          .eq("email", mail)
          .limit(1);
        if (!error && data && data.length > 0) return data[0];
      }

      return null;
    } catch {
      return null;
    }
  };

  // Create single student
  const handleAddStudent = async () => {
    const name = normalize(studentName);
    const uname = normalize(studentUsername);
    const mail = normalize(studentEmail);
    const pwd = normalize(studentPassword);
    const secName = normalize(studentSection);

    if (!name || !uname || !mail || !pwd || !secName) {
      alert("Please fill out all fields.");
      return;
    }

    setLoading(true);
    try {
      // Prevent duplicates
      const dup = await checkExistingStudent(uname, mail);
      if (dup) {
        if (dup.username === uname) {
          alert("Username already exists. Choose a different username.");
        } else {
          alert("Email already exists. Use a different email.");
        }
        setLoading(false);
        return;
      }

      // Ensure section exists
      const section = await findOrCreateSection(secName);
      if (!section) {
        alert("Failed to create/find section.");
        setLoading(false);
        return;
      }

      // Insert student record WITHOUT creating auth account to avoid session conflict
      // Store password temporarily - you'll need a backend service to create auth accounts
      const { data: studentRow, error: studentError } = await supabase
        .from("students")
        .insert([
          {
            name,
            username: uname,
            email: mail,
            section_id: section.id,
            // Note: password is not stored in database for security
            // You'll need to implement a backend service to create auth accounts
          }
        ])
        .select(`*, sections(name)`)
        .single();

      if (studentError) {
        alert("Error saving student record: " + studentError.message);
      } else {
        setStudents((prev) => [...prev, studentRow]);
        await loadStudents();
        setStudentName("");
        setStudentUsername("");
        setStudentEmail("");
        setStudentPassword("");
        setStudentSection("");
        setShowPassword(false);
        showNotification(`Student "${name}" created successfully! (Auth account creation pending)`);
      }
    } catch (error) {
      alert("Error creating student: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Create multiple students
  const handleAddMultipleStudents = async () => {
    const validStudents = multipleStudents
      .map((s) => ({
        name: normalize(s.name),
        username: normalize(s.username),
        email: normalize(s.email),
        password: normalize(s.password),
        section: normalize(s.section || (sameSection ? multipleStudents[0]?.section : "")),
      }))
      .filter((s) => s.name && s.username && s.email && s.password && s.section);

    if (validStudents.length === 0) {
      alert("Please complete at least one student form.");
      return;
    }

    setLoading(true);
    try {
      let successCount = 0;
      let skippedDuplicates = 0;
      const created = [];

      for (const s of validStudents) {
        try {
          const dup = await checkExistingStudent(s.username, s.email);
          if (dup) {
            skippedDuplicates++;
            continue;
          }

          const section = await findOrCreateSection(s.section);
          if (!section) continue;

          // Insert student record WITHOUT creating auth account
          const { data: studentRow, error: studentError } = await supabase
            .from("students")
            .insert([
              {
                name: s.name,
                username: s.username,
                email: s.email,
                section_id: section.id,
              }
            ])
            .select("*, sections(name)")
            .single();

          if (!studentError && studentRow) {
            successCount++;
            created.push(studentRow);
          }
        } catch {
          // skip on error and continue with next
        }
      }

      if (created.length > 0) {
        setStudents((prev) => [...prev, ...created]);
      }
      await loadStudents();

      // Reset forms
      setMultipleStudents([
        { name: "", username: "", email: "", password: "", section: "", showPassword: false },
      ]);
      setIsMultipleMode(false);
      setSameSection(false);

      showNotification(
        `Saved ${successCount} student(s). ${skippedDuplicates > 0 ? skippedDuplicates + " skipped (duplicates). " : ""}Auth accounts will be created via admin process.`
      );
    } catch (error) {
      alert("Error creating students: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Sign out + navigate to login
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Logout failed:', e?.message || e);
    } finally {
      setShowUserMenu(false);
      if (typeof onLogout === 'function') onLogout();
      if (typeof onNavigate === 'function') onNavigate('login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 ${
            notification.type === "success" ? "bg-green-500" : "bg-red-500"
          } text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 animate-slideInRight`}
        >
          <CheckCircle size={24} />
          <span className="font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Test button */}
      <button
        onClick={testSupabaseConnection}
        className="fixed top-5 right-5 z-40 bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg shadow-lg transition-all"
      >
        Test DB Connection
      </button>

      {/* Modern Navbar */}
      <nav className="bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-2xl p-2 shadow-lg transform hover:rotate-6 transition-transform duration-300">
                <img
                  src={logo}
                  alt="Logo"
                  className="h-12 w-12 sm:h-16 sm:w-16"
                />
              </div>
            </div>

            {/* Nav Links */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => onNavigate && onNavigate("home")}
                className="flex items-center space-x-2 bg-white text-orange-600 px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                <Home size={20} />
                <span className="hidden sm:inline">Home</span>
              </button>
              <button
                onClick={() => onNavigate && onNavigate("reports")}
                className="flex items-center space-x-2 bg-orange-400 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold hover:bg-orange-300 transform hover:scale-105 transition-all duration-300"
              >
                <BarChart3 size={20} />
                <span className="hidden sm:inline">Reports</span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 sm:space-x-3 bg-white bg-opacity-20 hover:bg-opacity-30 px-2 sm:px-4 py-2 rounded-xl transition-all duration-300"
                >
                  <div className="text-right hidden sm:block">
                    <div className="text-white font-semibold text-sm">
                      {currentUser?.user_metadata?.full_name || currentUser?.email || 'User'}
                    </div>
                    <div className="text-orange-100 text-xs">Admin</div>
                  </div>
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.user_metadata?.full_name || 'User')}&background=F68C2E&color=fff`}
                    alt="User"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white"
                  />
                  <ChevronDown size={20} className="text-white hidden sm:block" />
                </button>

                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2"
                    style={{ zIndex: 9999 }}
                  >
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors" type="button">
                      Profile
                    </button>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors" type="button">
                      Settings
                    </button>
                    <hr className="my-2" />
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition-colors"
                      type="button"
                      onClick={handleLogout}
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl shadow-xl p-6 sm:p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>

          <div className="relative flex flex-col sm:flex-row items-center justify-between">
            <div className="text-center sm:text-left mb-4 sm:mb-0">
              <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">
                WELCOME BACK, {(currentUser?.user_metadata?.full_name || currentUser?.email || 'USER').toUpperCase()}! 👋
              </h1>
              <p className="text-orange-100 text-sm sm:text-lg">
                Manage your sections and students. All data is synced with the
                database in real-time.
              </p>
              <div className="flex items-center justify-center sm:justify-start space-x-4 sm:space-x-6 mt-6">
                <div className="bg-white bg-opacity-20 rounded-xl px-4 sm:px-6 py-3">
                  <div className="text-white text-xl sm:text-2xl font-bold">
                    {sections.length}
                  </div>
                  <div className="text-orange-100 text-xs sm:text-sm">
                    Sections
                  </div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-xl px-4 sm:px-6 py-3">
                  <div className="text-white text-xl sm:text-2xl font-bold">
                    {students.length}
                  </div>
                  <div className="text-orange-100 text-xs sm:text-sm">
                    Students
                  </div>
                </div>
              </div>
            </div>
            <img
              src={character}
              alt="Character"
              className="w-24 h-24 sm:w-32 sm:h-32 animate-bounce"
            />
          </div>
        </div>

        {/* NEW LAYOUT: Two Column Structure */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* LEFT COLUMN - All Students List */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 h-fit lg:sticky lg:top-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
              ALL STUDENTS ({students.length})
            </h3>
            <div className="space-y-3 max-h-[500px] lg:max-h-[700px] overflow-y-auto pr-2">
              {students.map((student, index) => (
                <div
                  key={student.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  style={{
                    animation: `slideIn 0.5s ease-out ${index * 0.1}s both`,
                  }}
                >
                  <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">
                        {student.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {student.sections?.name || "No Section"}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 pl-13 sm:pl-0 break-all">
                    {student.email}
                  </div>
                </div>
              ))}
              {students.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <User size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No students found. Create your first student.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - Students Form & Sections */}
          <div className="space-y-6 sm:space-y-8">
            {/* Students Form Card */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 transform hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-blue-100 rounded-xl p-3">
                  <Users className="text-blue-600" size={24} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                    STUDENTS
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm">
                    Create Student
                  </p>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex space-x-3 mb-6">
                <button
                  onClick={() => setIsMultipleMode(false)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-semibold transition-all text-sm sm:text-base ${
                    !isMultipleMode
                      ? "bg-orange-500 text-white shadow-lg"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Plus size={20} />
                  <span>Add new</span>
                </button>
                <button
                  onClick={() => setIsMultipleMode(true)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-semibold transition-all text-sm sm:text-base ${
                    isMultipleMode
                      ? "bg-yellow-400 text-gray-800 shadow-lg"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Users size={20} />
                  <span>Add Multiple</span>
                </button>
              </div>

              {/* Single Student Form */}
              {!isMultipleMode && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-all text-sm"
                      placeholder="Student Name"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                    />
                    <input
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-all text-sm"
                      placeholder="Username(Use for login)"
                      value={studentUsername}
                      onChange={(e) => setStudentUsername(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-all text-sm"
                      placeholder="Email"
                      type="email"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                    />
                    <div className="relative">
                      <input
                        className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-all text-sm"
                        placeholder="Password"
                        type={showPassword ? "text" : "password"}
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-all text-sm"
                      placeholder="Section (select or create new)"
                      value={studentSection}
                      onChange={(e) => setStudentSection(e.target.value)}
                      onFocus={() => setShowSectionDropdown(true)}
                      onBlur={() =>
                        setTimeout(() => setShowSectionDropdown(false), 200)
                      }
                    />
                    {showSectionDropdown && sections.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {sections.map((sec) => (
                          <button
                            key={sec.id}
                            type="button"
                            onClick={() => {
                              setStudentSection(sec.name);
                              setShowSectionDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-orange-50 transition-colors text-sm"
                          >
                            {sec.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-3">
                    <button
                      onClick={handleAddStudent}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center space-x-2 bg-green-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-green-600 transform hover:scale-105 transition-all disabled:opacity-50 text-sm"
                    >
                      <Check size={20} />
                      <span>{loading ? "SAVING..." : "SAVE"}</span>
                    </button>
                    <button
                      onClick={() => {
                        setStudentName("");
                        setStudentUsername("");
                        setStudentEmail("");
                        setStudentPassword("");
                        setStudentSection("");
                        setShowPassword(false);
                      }}
                      className="flex items-center justify-center space-x-2 bg-red-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-red-600 transform hover:scale-105 transition-all text-sm"
                    >
                      <X size={20} />
                      <span>CANCEL</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Multiple Students Form */}
              {isMultipleMode && (
                <div className="space-y-4">
                  <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sameSection}
                      onChange={(e) =>
                        handleSameSectionToggle(e.target.checked)
                      }
                      className="w-4 h-4 text-orange-500 rounded"
                    />
                    <span>Same Section for all students</span>
                  </label>

                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {multipleStudents.map((student, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-xl p-4 relative border-2 border-gray-200 hover:border-orange-300 transition-all"
                      >
                        {multipleStudents.length > 1 && (
                          <button
                            onClick={() => removeStudentForm(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                        )}
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-sm"
                              placeholder="Student Name"
                              value={student.name}
                              onChange={(e) =>
                                updateMultipleStudent(
                                  index,
                                  "name",
                                  e.target.value
                                )
                              }
                            />
                            <input
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-sm"
                              placeholder="Username"
                              value={student.username}
                              onChange={(e) =>
                                updateMultipleStudent(
                                  index,
                                  "username",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-sm"
                              placeholder="Email"
                              type="email"
                              value={student.email}
                              onChange={(e) =>
                                updateMultipleStudent(
                                  index,
                                  "email",
                                  e.target.value
                                )
                              }
                            />
                            <div className="relative">
                              <input
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-sm"
                                placeholder="Password"
                                type={
                                  student.showPassword ? "text" : "password"
                                }
                                value={student.password}
                                onChange={(e) =>
                                  updateMultipleStudent(
                                    index,
                                    "password",
                                    e.target.value
                                  )
                                }
                              />
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(index)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
                              >
                                {student.showPassword ? (
                                  <EyeOff size={16} />
                                ) : (
                                  <Eye size={16} />
                                )}
                              </button>
                            </div>
                          </div>
                          <input
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-sm"
                            placeholder="Section"
                            value={student.section}
                            onChange={(e) =>
                              updateMultipleStudent(
                                index,
                                "section",
                                e.target.value
                              )
                            }
                            disabled={sameSection && index > 0}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={addStudentForm}
                      className="flex items-center justify-center space-x-2 bg-blue-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-blue-600 transform hover:scale-105 transition-all text-sm"
                    >
                      <PlusCircle size={20} />
                      <span>Add More</span>
                    </button>
                    <button
                      onClick={handleAddMultipleStudents}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center space-x-2 bg-green-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-green-600 transform hover:scale-105 transition-all disabled:opacity-50 text-sm"
                    >
                      <Check size={20} />
                      <span>{loading ? "SAVING..." : "SAVE ALL"}</span>
                    </button>
                    <button
                      onClick={() => {
                        setMultipleStudents([
                          {
                            name: "",
                            username: "",
                            email: "",
                            password: "",
                            section: "",
                            showPassword: false,
                          },
                        ]);
                        setIsMultipleMode(false);
                        setSameSection(false);
                      }}
                      className="flex items-center justify-center space-x-2 bg-red-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-red-600 transform hover:scale-105 transition-all text-sm"
                    >
                      <X size={20} />
                      <span>CANCEL</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sections Card */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 transform hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-orange-100 rounded-xl p-3">
                  <BookOpen className="text-orange-600" size={24} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                    SECTIONS
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm">
                    Manage your class sections
                  </p>
                </div>
              </div>

              {/* Add Section Form */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <input
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-all text-sm"
                    placeholder="Section name"
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                  />
                  <button
                    onClick={handleAddSection}
                    disabled={loading}
                    className="flex items-center justify-center space-x-2 bg-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-600 transform hover:scale-105 transition-all disabled:opacity-50 text-sm"
                  >
                    <Check size={20} />
                    <span>{loading ? "SAVING..." : "SAVE"}</span>
                  </button>
                  <button
                    onClick={() => setSectionName("")}
                    className="flex items-center justify-center space-x-2 bg-red-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-red-600 transform hover:scale-105 transition-all text-sm"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Sections Table */}
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">
                        Name
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">
                        Students
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">
                        Progress
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sections.map((sec, index) => (
                      <tr
                        key={sec.id}
                        className="hover:bg-gray-50 transition-colors"
                        style={{
                          animation: `fadeIn 0.5s ease-in ${index * 0.1}s both`,
                        }}
                      >
                        <td className="px-4 sm:px-6 py-4 text-gray-800 font-medium text-sm">
                          {sec.name}
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <span className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                            {getStudentCount(sec.id)}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-orange-400 to-orange-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${sec.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-gray-700 min-w-[40px]">
                              {sec.progress}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sections.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <BookOpen
                      size={48}
                      className="mx-auto mb-4 text-gray-300"
                    />
                    <p className="text-sm">
                      No sections found. Create your first section above.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
