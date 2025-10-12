import React, { useState, useEffect } from "react";
import { supabase } from '../supabase';

// Images from public folder
const logo = process.env.PUBLIC_URL + "/logo.png";
const character = process.env.PUBLIC_URL + "/character.png";
const iconBox = process.env.PUBLIC_URL + "/box.png";
const iconStudent = process.env.PUBLIC_URL + "/student.png";
const iconReports = process.env.PUBLIC_URL + "/reports.png";
const iconHome = process.env.PUBLIC_URL + "/home.png";
const iconChevronLeft = process.env.PUBLIC_URL + "/chevron-left.png";
const iconChevronRight = process.env.PUBLIC_URL + "/chevron-right.png";
const iconCheck = process.env.PUBLIC_URL + "/check.png";
const iconClose = process.env.PUBLIC_URL + "/close.png";
const iconAdd = process.env.PUBLIC_URL + "/add.png";
const iconGroupAdd = process.env.PUBLIC_URL + "/group-add.png";
const iconDropdown = process.env.PUBLIC_URL + "/dropdown.png";

export default function Homepage({ onNavigate }) {
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [sectionName, setSectionName] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Single student form state
  const [studentName, setStudentName] = useState("");
  const [studentUsername, setStudentUsername] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentSection, setStudentSection] = useState("");
  
  // Multiple students mode
  const [isMultipleMode, setIsMultipleMode] = useState(false);
  const [multipleStudents, setMultipleStudents] = useState([
    { name: "", username: "", email: "", password: "", section: "" }
  ]);
  const [sameSection, setSameSection] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadSections();
    loadStudents();
  }, []);

  // Load sections from Supabase
  const loadSections = async () => {
    try {
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading sections:', error);
      } else {
        setSections(data || []);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  };

  // Load students from Supabase
  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          sections(name)
        `)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading students:', error);
      } else {
        setStudents(data || []);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  // Add section handler
  const handleAddSection = async () => {
    if (sectionName.trim()) {
      // Check if section already exists
      const exists = sections.some(
        s => s.name.toLowerCase() === sectionName.trim().toLowerCase()
      );
      
      if (exists) {
        alert('Section already exists!');
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('sections')
          .insert([{ name: sectionName.trim(), progress: 0 }])
          .select()
          .single();

        if (error) {
          alert('Error creating section: ' + error.message);
        } else {
          setSections([...sections, data]);
          setSectionName("");
          alert('Section created successfully!');
        }
      } catch (error) {
        alert('Error creating section: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // helper: normalize to lowercase without spaces
  const normalize = (s) => (s || '').trim().toLowerCase();

  // helper: check duplicates in students table by username OR email
  const checkExistingStudent = async (username, email) => {
    const uname = normalize(username);
    const mail = normalize(email);
    const { data, error } = await supabase
      .from('students')
      .select('id, username, email')
      .or(`username.eq.${uname},email.eq.${mail}`)
      .limit(1);
    if (error) throw error;
    return data?.[0] || null;
  };

  // Add single student (UPDATED: prevent 409 by pre-checking)
  const handleAddStudent = async () => {
    if (!studentName.trim() || !studentUsername.trim() || !studentEmail.trim() || !studentPassword.trim() || !studentSection.trim()) {
      alert('Please fill in all fields');
      return;
    }

    const uname = normalize(studentUsername);
    const mail = normalize(studentEmail);

    setLoading(true);
    try {
      // Check for duplicates BEFORE creating auth user
      const dup = await checkExistingStudent(uname, mail);
      if (dup) {
        if (dup.username === uname) {
          alert('Username already exists. Please choose a different username.');
        } else {
          alert('Email already exists. Please use a different email.');
        }
        setLoading(false);
        return;
      }

      // Find or create section FIRST
      const section = await findOrCreateSection(studentSection);
      if (!section) {
        alert('Error creating section');
        setLoading(false);
        return;
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: mail,
        password: studentPassword,
        options: {
          data: {
            full_name: studentName.trim(),
            username: uname,
            section: section.name,
            section_id: section.id,
            role: 'student'
          }
        }
      });

      if (authError) {
        // Common: "User already registered" -> email conflict in Auth
        alert(`Error creating user account: ${authError.message}`);
        setLoading(false);
        return;
      }

      // Insert student record; use upsert on username to avoid race 409
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .upsert([{
          user_id: authData.user.id,
          name: studentName.trim(),
          username: uname,
          email: mail,
          section_id: section.id
        }], { onConflict: 'username' })
        .select(`*, sections(name)`)
        .single();

      if (studentError) {
        alert('Error creating student record: ' + studentError.message);
      } else {
        setStudents(prev => [...prev, studentData]);
        await loadStudents();
        setStudentName("");
        setStudentUsername("");
        setStudentEmail("");
        setStudentPassword("");
        setStudentSection("");
        alert(`Student "${studentName}" created in section "${section.name}".`);
      }
    } catch (error) {
      alert('Error creating student: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add multiple students (UPDATED: pre-check duplicates per student and skip)
  const handleAddMultipleStudents = async () => {
    const validStudents = multipleStudents.filter(s =>
      s.name.trim() && s.username.trim() && s.email.trim() && s.password.trim() && s.section.trim()
    );

    if (validStudents.length === 0) {
      alert('Please fill in at least one complete student form');
      return;
    }

    setLoading(true);
    try {
      let successCount = 0;
      let skippedDuplicates = 0;
      const createdStudents = [];

      for (const s of validStudents) {
        const uname = normalize(s.username);
        const mail = normalize(s.email);

        try {
          // pre-check duplicates
          const dup = await checkExistingStudent(uname, mail);
          if (dup) {
            skippedDuplicates++;
            continue;
          }

          // section
          const section = await findOrCreateSection(s.section);
          if (!section) continue;

          // create auth user
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: mail,
            password: s.password,
            options: {
              data: {
                full_name: s.name.trim(),
                username: uname,
                section: section.name,
                section_id: section.id,
                role: 'student'
              }
            }
          });
          if (authError) {
            // skip if email already registered in auth
            continue;
          }

          // students row (use upsert to avoid race)
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .upsert([{
              user_id: authData.user.id,
              name: s.name.trim(),
              username: uname,
              email: mail,
              section_id: section.id
            }], { onConflict: 'username' })
            .select('*, sections(name)')
            .single();

          if (!studentError && studentData) {
            successCount++;
            createdStudents.push(studentData);
          }
        } catch (err) {
          // keep going with the next student
        }
      }

      if (createdStudents.length > 0) {
        setStudents(prev => [...prev, ...createdStudents]);
      }
      await loadStudents();

      setMultipleStudents([{ name: "", username: "", email: "", password: "", section: "" }]);
      setIsMultipleMode(false);
      setSameSection(false);

      alert(`${successCount} student(s) created. ${skippedDuplicates} skipped due to duplicate username/email.`);
    } catch (error) {
      alert('Error creating students: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to find or create section
  const findOrCreateSection = async (sectionName) => {
    if (!sectionName.trim()) return null;

    console.log('Finding or creating section:', sectionName.trim());

    // Check if section already exists (case-insensitive)
    const existingSection = sections.find(
      s => s.name.toLowerCase() === sectionName.trim().toLowerCase()
    );

    if (existingSection) {
      console.log('Section already exists:', existingSection);
      return existingSection;
    }

    // Create new section in database
    try {
      console.log('Creating new section:', sectionName.trim());
      
      const { data, error } = await supabase
        .from('sections')
        .insert([{ name: sectionName.trim(), progress: 0 }])
        .select()
        .single();

      if (error) {
        console.error('Error creating section:', error);
        return null;
      }

      console.log('New section created:', data);

      // Update local state
      setSections(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error creating section:', error);
      return null;
    }
  };

  // Test Supabase connection
  const testSupabaseConnection = async () => {
    try {
      console.log('Testing Supabase connection...');
      
      // Test database connection
      const { data, error } = await supabase
        .from('sections')
        .select('count')
        .limit(1);
      
      if (error) {
        alert('Connection test failed: ' + error.message);
      } else {
        alert('Connection test successful! Database is accessible.');
      }
    } catch (err) {
      console.error('Test error:', err);
      alert('Test failed: ' + err.message);
    }
  };

  // Add more student forms in multiple mode
  const addStudentForm = () => {
    const newStudent = { name: "", username: "", email: "", password: "", section: "" };
    
    // If same section is enabled and there's a section in the first form, use it
    if (sameSection && multipleStudents[0]?.section) {
      newStudent.section = multipleStudents[0].section;
    }
    
    setMultipleStudents([...multipleStudents, newStudent]);
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
    if (sameSection && index === 0 && field === 'section') {
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
        index === 0 ? student : { ...student, section: multipleStudents[0].section }
      );
      setMultipleStudents(updated);
    }
  };

  // Get students count for each section
  const getStudentCount = (sectionId) => {
    return students.filter(student => student.section_id === sectionId).length;
  };

  // Styles (same as before)
  const styles = {
    page: { background: "#e0e0e0", minHeight: "100vh", fontFamily: "Poppins, Arial, sans-serif" },
    navbar: { background: "#f68c2e", display: "flex", alignItems: "center", padding: "0 32px", height: 80, justifyContent: "space-between" },
    logo: { height: 64, marginRight: 24 },
    navLinks: { display: "flex", alignItems: "center", gap: 32 },
    navBtn: { background: "#fff", borderRadius: 16, padding: "8px 24px", display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#f68c2e", border: "none", fontSize: 18, cursor: "pointer" },
    navIcon: { height: 24, width: 24, display: "flex", alignItems: "center" },
    userInfo: { display: "flex", alignItems: "center", gap: 12, color: "#fff", fontSize: 14 },
    userAvatar: { width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "2px solid #fff" },
    dropdown: { height: 32, width: 32, color: "#fff", marginLeft: 16, cursor: "pointer", display: "flex", alignItems: "center" },
    main: { display: "flex", gap: 24, padding: 32 },
    leftCol: { flex: 2, display: "flex", flexDirection: "column", gap: 24 },
    rightCol: { flex: 1.2, display: "flex", flexDirection: "column", gap: 24 },
    card: { background: "#fff", borderRadius: 16, boxShadow: "0 2px 8px #0001", padding: 24, marginBottom: 0 },
    welcome: { display: "flex", alignItems: "center", gap: 24 },
    welcomeText: { flex: 1 },
    welcomeTitle: { fontSize: 32, fontWeight: 700, margin: 0 },
    welcomeDesc: { color: "#888", fontSize: 16, margin: "12px 0 0 0" },
    character: { width: 120, height: 120 },
    sectionHeader: { display: "flex", alignItems: "center", gap: 12, fontWeight: 700, fontSize: 20, marginBottom: 12 },
    sectionIcon: { height: 32, width: 32, background: "#ccc", borderRadius: 8, padding: 4, display: "flex", alignItems: "center", justifyContent: "center" },
    sectionForm: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
    input: { flex: 1, padding: "10px 16px", borderRadius: 8, border: "1px solid #ccc", fontSize: 16 },
    btnSave: { background: "#19c37d", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 600, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
    btnCancel: { background: "#ff2d2d", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 600, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
    sectionTable: { width: "100%", borderCollapse: "collapse", marginTop: 8 },
    sectionTh: { textAlign: "left", fontWeight: 600, padding: "8px 0", borderBottom: "2px solid #ccc" },
    sectionTd: { padding: "8px 0", borderBottom: "1px solid #eee", fontSize: 15 },
    pagination: { display: "flex", justifyContent: "center", gap: 32, marginTop: 16 },
    arrowBtn: { background: "none", border: "none", fontSize: 32, cursor: "pointer", color: "#222", display: "flex", alignItems: "center" },
    arrowIcon: { height: 32, width: 32 },
    studentHeader: { display: "flex", alignItems: "center", gap: 12, fontWeight: 700, fontSize: 20, marginBottom: 12 },
    studentIcon: { height: 32, width: 32, background: "#ccc", borderRadius: 8, padding: 4, display: "flex", alignItems: "center", justifyContent: "center" },
    studentForm: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 },
    studentFormRow: { display: "flex", gap: 12 },
    studentInput: { flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 15 },
    studentBtnRow: { display: "flex", gap: 12, marginTop: 8 },
    studentTable: { width: "100%", borderCollapse: "collapse", marginTop: 8 },
    studentTh: { textAlign: "left", fontWeight: 600, padding: "8px 0", borderBottom: "2px solid #ccc" },
    studentTd: { padding: "8px 0", borderBottom: "1px solid #eee", fontSize: 15 },
    iconBtn: { display: "flex", alignItems: "center", gap: 6 },
    icon: { height: 20, width: 20 },
    iconLarge: { height: 24, width: 24 },
    multipleStudentCard: { border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 12, position: "relative" },
    removeBtn: { position: "absolute", top: 8, right: 8, background: "#ff2d2d", color: "#fff", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer", fontSize: 12 },
    addMoreBtn: { background: "#2196f3", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
    modeToggle: { display: "flex", gap: 12, marginBottom: 16 },
    sameSectionOption: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 14 },
    testBtn: { position: "fixed", top: 20, right: 20, zIndex: 1000, background: "#007bff", color: "white", border: "none", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" },
  };

  return (
    <div style={styles.page}>
      {/* Test button */}
      <button onClick={testSupabaseConnection} style={styles.testBtn}>
        Test DB Connection
      </button>

      {/* Navbar */}
      <div style={styles.navbar}>
        <img src={logo} alt="Logo" style={styles.logo} />
        <div style={styles.navLinks}>
          <button style={styles.navBtn} onClick={() => onNavigate && onNavigate('home')}>
            <span style={styles.navIcon}><img src={iconHome} alt="Home" style={styles.iconLarge} /></span> Home
          </button>
          <button style={styles.navBtn} onClick={() => onNavigate && onNavigate('reports')}>
            <span style={styles.navIcon}><img src={iconReports} alt="Reports" style={styles.iconLarge} /></span> Reports
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

      {/* Main Content */}
      <div style={styles.main}>
        {/* Left Column */}
        <div style={styles.leftCol}>
          {/* Welcome Card */}
          <div style={styles.card}>
            <div style={styles.welcome}>
              <div style={styles.welcomeText}>
                <h1 style={styles.welcomeTitle}>WELCOME BACK, JUSTIN!</h1>
                <div style={styles.welcomeDesc}>
                  Manage your sections and students. All data is synced with the database in real-time.
                </div>
              </div>
              <img src={character} alt="Character" style={styles.character} />
            </div>
          </div>

          {/* Sections Card */}
          <div style={styles.card}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}><img src={iconBox} alt="Sections" style={styles.iconLarge} /></span>
              SECTIONS ({sections.length})
            </div>
            {/* Create Section */}
            <div style={styles.sectionForm}>
              <input
                style={styles.input}
                placeholder="Section name"
                value={sectionName}
                onChange={e => setSectionName(e.target.value)}
              />
              <button 
                style={{ ...styles.btnSave, opacity: loading ? 0.6 : 1 }}
                onClick={handleAddSection}
                disabled={loading}
              >
                <img src={iconCheck} alt="Save" style={styles.icon} /> 
                {loading ? 'SAVING...' : 'SAVE'}
              </button>
              <button style={styles.btnCancel} onClick={() => setSectionName("")}>
                <img src={iconClose} alt="Cancel" style={styles.icon} /> CANCEL
              </button>
            </div>
            {/* Section List */}
            <table style={styles.sectionTable}>
              <thead>
                <tr>
                  <th style={styles.sectionTh}>Name</th>
                  <th style={styles.sectionTh}>Students</th>
                  <th style={styles.sectionTh}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((sec) => (
                  <tr key={sec.id}>
                    <td style={styles.sectionTd}>{sec.name}</td>
                    <td style={styles.sectionTd}>{getStudentCount(sec.id)}</td>
                    <td style={styles.sectionTd}>{sec.progress}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sections.length === 0 && (
              <div style={{ textAlign: 'center', color: '#888', padding: 20 }}>
                No sections found. Create your first section above.
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={styles.rightCol}>
          {/* Students Card */}
          <div style={styles.card}>
            <div style={styles.studentHeader}>
              <span style={styles.studentIcon}><img src={iconStudent} alt="Students" style={styles.iconLarge} /></span>
              STUDENTS ({students.length})
            </div>
            
            {/* Mode Toggle */}
            <div style={styles.modeToggle}>
              <button 
                style={{ ...styles.btnSave, background: isMultipleMode ? "#ccc" : "#ff9800" }}
                onClick={() => setIsMultipleMode(false)}
              >
                <img src={iconAdd} alt="Add" style={styles.icon} /> Add new
              </button>
              <button 
                style={{ ...styles.btnSave, background: isMultipleMode ? "#ffe066" : "#ccc", color: isMultipleMode ? "#222" : "#fff" }}
                onClick={() => setIsMultipleMode(true)}
              >
                <img src={iconGroupAdd} alt="Add Multiple" style={styles.icon} /> Add Multiple
              </button>
            </div>

            {/* Single Student Form */}
            {!isMultipleMode && (
              <div style={styles.studentForm}>
                <div style={styles.studentFormRow}>
                  <input
                    style={styles.studentInput}
                    placeholder="Student Name"
                    value={studentName}
                    onChange={e => setStudentName(e.target.value)}
                  />
                  <input
                    style={styles.studentInput}
                    placeholder="Username"
                    value={studentUsername}
                    onChange={e => setStudentUsername(e.target.value)}
                  />
                </div>
                <div style={styles.studentFormRow}>
                  <input
                    style={styles.studentInput}
                    placeholder="Email"
                    type="email"
                    value={studentEmail}
                    onChange={e => setStudentEmail(e.target.value)}
                  />
                  <input
                    style={styles.studentInput}
                    placeholder="Password"
                    type="password"
                    value={studentPassword}
                    onChange={e => setStudentPassword(e.target.value)}
                  />
                </div>
                <div style={styles.studentFormRow}>
                  <input
                    style={styles.studentInput}
                    placeholder="Section (will be created if it doesn't exist)"
                    value={studentSection}
                    onChange={e => setStudentSection(e.target.value)}
                  />
                </div>
                <div style={styles.studentBtnRow}>
                  <button 
                    style={{ ...styles.btnSave, opacity: loading ? 0.6 : 1 }} 
                    onClick={handleAddStudent}
                    disabled={loading}
                  >
                    <img src={iconCheck} alt="Save" style={styles.icon} /> 
                    {loading ? 'SAVING...' : 'SAVE'}
                  </button>
                  <button style={styles.btnCancel} onClick={() => {
                    setStudentName(""); setStudentUsername(""); setStudentEmail(""); setStudentPassword(""); setStudentSection("");
                  }}>
                    <img src={iconClose} alt="Cancel" style={styles.icon} /> CANCEL
                  </button>
                </div>
              </div>
            )}

            {/* Multiple Students Form */}
            {isMultipleMode && (
              <div style={styles.studentForm}>
                {/* Same Section Option */}
                <div style={styles.sameSectionOption}>
                  <input
                    type="checkbox"
                    checked={sameSection}
                    onChange={e => handleSameSectionToggle(e.target.checked)}
                  />
                  <label>Same Section for all students</label>
                </div>

                {multipleStudents.map((student, index) => (
                  <div key={index} style={styles.multipleStudentCard}>
                    {multipleStudents.length > 1 && (
                      <button 
                        style={styles.removeBtn}
                        onClick={() => removeStudentForm(index)}
                      >
                        ×
                      </button>
                    )}
                    <div style={styles.studentFormRow}>
                      <input
                        style={styles.studentInput}
                        placeholder="Student Name"
                        value={student.name}
                        onChange={e => updateMultipleStudent(index, 'name', e.target.value)}
                      />
                      <input
                        style={styles.studentInput}
                        placeholder="Username"
                        value={student.username}
                        onChange={e => updateMultipleStudent(index, 'username', e.target.value)}
                      />
                    </div>
                    <div style={styles.studentFormRow}>
                      <input
                        style={styles.studentInput}
                        placeholder="Email"
                        type="email"
                        value={student.email}
                        onChange={e => updateMultipleStudent(index, 'email', e.target.value)}
                      />
                      <input
                        style={styles.studentInput}
                        placeholder="Password"
                        type="password"
                        value={student.password}
                        onChange={e => updateMultipleStudent(index, 'password', e.target.value)}
                      />
                    </div>
                    <div style={styles.studentFormRow}>
                      <input
                        style={styles.studentInput}
                        placeholder="Section"
                        value={student.section}
                        onChange={e => updateMultipleStudent(index, 'section', e.target.value)}
                        disabled={sameSection && index > 0}
                      />
                    </div>
                  </div>
                ))}
                
                <div style={styles.studentBtnRow}>
                  <button style={styles.addMoreBtn} onClick={addStudentForm}>
                    <img src={iconAdd} alt="Add" style={styles.icon} /> Add More
                  </button>
                  <button 
                    style={{ ...styles.btnSave, opacity: loading ? 0.6 : 1 }} 
                    onClick={handleAddMultipleStudents}
                    disabled={loading}
                  >
                    <img src={iconCheck} alt="Save" style={styles.icon} /> 
                    {loading ? 'SAVING...' : 'SAVE ALL'}
                  </button>
                  <button style={styles.btnCancel} onClick={() => {
                    setMultipleStudents([{ name: "", username: "", email: "", password: "", section: "" }]);
                    setIsMultipleMode(false);
                    setSameSection(false);
                  }}>
                    <img src={iconClose} alt="Cancel" style={styles.icon} /> CANCEL
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Student List */}
          <div style={styles.card}>
            <h4 style={{ margin: '0 0 16px 0' }}>All Students</h4>
            <table style={styles.studentTable}>
              <thead>
                <tr>
                  <th style={styles.studentTh}>Name</th>
                  <th style={styles.studentTh}>Section</th>
                  <th style={styles.studentTh}>Email</th>
                </tr>
              </thead>
              <tbody>
                {students.map((stu) => (
                  <tr key={stu.id}>
                    <td style={styles.studentTd}>{stu.name}</td>
                    <td style={styles.studentTd}>{stu.sections?.name || 'No Section'}</td>
                    <td style={styles.studentTd}>{stu.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length === 0 && (
              <div style={{ textAlign: 'center', color: '#888', padding: 20 }}>
                No students found. Create your first student above.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};