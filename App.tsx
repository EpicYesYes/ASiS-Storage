
import React, { useState, useMemo, useEffect } from 'react';
import { generateMockStudents } from './mockData';
import { Student, View, BehaviorType, StudentRecord, TeacherProfile, DisciplinaryCase, CaseSeverity, CaseStatus } from './types';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import StudentDetail from './components/StudentDetail';
import Sidebar from './components/Sidebar';
import AdminPortal from './components/AdminPortal';
import AccountPage from './components/AccountPage';
import CaseManagement from './components/CaseManagement';
import Login from './components/Login';
import { INITIAL_BATCH_COLORS, CLASS_NAMES } from './constants';
import { translations, Language } from './translations';

const INITIAL_TEACHERS: TeacherProfile[] = [
  {
    id: 't-3',
    name: 'Cikgu Pelawat',
    role: 'Guru Pelawat (Admin)',
    email: 'guru@asis.edu.my',
    staffId: 'GURU-2025',
    department: 'Pentadbiran',
    meritsGiven: 0,
    demeritsGiven: 0,
    avatar: '',
    subjects: ['Bahasa Melayu'],
    isAdmin: true,
    password: 'password123'
  },
  {
    id: 't-1',
    name: 'Encik Harrison',
    role: 'Penolong Kanan Hal Kebajikan Murid',
    email: 'harrison@school.edu.my',
    staffId: 'STAFF-9921',
    department: 'Pentadbiran',
    meritsGiven: 124,
    demeritsGiven: 18,
    avatar: '',
    subjects: ['Bahasa Melayu', 'Sejarah'],
    isAdmin: true,
    password: 'password123'
  },
  {
    id: 't-2',
    name: 'Puan Sarah',
    role: 'Guru Kelas',
    email: 'sarah@school.edu.my',
    staffId: 'STAFF-1022',
    department: 'Sains & Matematik',
    meritsGiven: 45,
    demeritsGiven: 5,
    avatar: '',
    subjects: ['Matematik', 'Sains'],
    isAdmin: false,
    password: 'password123'
  }
];

const INITIAL_CASES: DisciplinaryCase[] = [
  {
    id: 'case-1',
    category: 'Vandalisme',
    title: 'Kerosakan Harta Benda Makmal Komputer',
    description: 'Sekumpulan murid dikesan merosakkan beberapa unit papan kekunci dan tetikus di Makmal Komputer 2 semasa waktu rehat.',
    perpetratorIds: [],
    victimIds: [],
    date: Date.now() - 86400000 * 3,
    location: 'Makmal Komputer 2',
    decision: 'Gantirugi kos peralatan dan khidmat masyarakat selama 10 jam di perpustakaan.',
    severity: CaseSeverity.MAJOR,
    status: CaseStatus.RESOLVED,
    loggedBy: 'Encik Harrison'
  },
  {
    id: 'case-2',
    category: 'Siber',
    title: 'Hantaran Media Sosial Kurang Sopan',
    description: 'Aduan diterima mengenai hantaran di Instagram yang mengandungi unsur buli siber terhadap guru.',
    perpetratorIds: [],
    victimIds: [],
    date: Date.now() - 86400000,
    location: 'Luar Kawasan Sekolah (Platform Digital)',
    decision: 'Sesi kaunseling bersemuka dan surat amaran pertama dikeluarkan.',
    severity: CaseSeverity.MINOR,
    status: CaseStatus.INVESTIGATING,
    loggedBy: 'Puan Sarah'
  }
];

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [cases, setCases] = useState<DisciplinaryCase[]>([]);
  const [batchColors, setBatchColors] = useState<Record<number, string>>(INITIAL_BATCH_COLORS);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<TeacherProfile | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('asis_theme') as any) || 'system';
  });
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('asis_lang') as Language) || 'ms';
  });

  // Translation helper
  const t = (key: keyof typeof translations['ms']) => {
    return (translations[language] as any)[key] || (translations['ms'] as any)[key] || key;
  };

  // Theme effect
  useEffect(() => {
    const root = window.document.documentElement;
    const updateTheme = () => {
      if (theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', isDark);
      } else {
        root.classList.toggle('dark', theme === 'dark');
      }
      localStorage.setItem('asis_theme', theme);
    };

    updateTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Language effect
  useEffect(() => {
    localStorage.setItem('asis_lang', language);
  }, [language]);

  useEffect(() => {
    const savedStudents = localStorage.getItem('asis_students');
    const savedColors = localStorage.getItem('asis_batch_colors');
    const savedTeachers = localStorage.getItem('asis_teachers');
    const savedCases = localStorage.getItem('asis_cases');
    const savedUser = localStorage.getItem('asis_current_user');
    
    if (savedStudents) {
      setStudents(JSON.parse(savedStudents));
    } else {
      const mockData = generateMockStudents(550);
      setStudents(mockData);
    }

    if (savedTeachers) {
      const loadedTeachers: TeacherProfile[] = JSON.parse(savedTeachers);
      if (!loadedTeachers.find(t => t.email === 'guru@asis.edu.my')) {
        setTeachers([...INITIAL_TEACHERS]);
      } else {
        setTeachers(loadedTeachers);
      }
    } else {
      setTeachers(INITIAL_TEACHERS);
    }

    if (savedCases) {
      setCases(JSON.parse(savedCases));
    } else {
      setCases(INITIAL_CASES);
    }

    if (savedColors) {
      setBatchColors(JSON.parse(savedColors));
    }

    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('asis_students', JSON.stringify(students));
      localStorage.setItem('asis_batch_colors', JSON.stringify(batchColors));
      localStorage.setItem('asis_teachers', JSON.stringify(teachers));
      localStorage.setItem('asis_cases', JSON.stringify(cases));
      if (currentUser) {
        localStorage.setItem('asis_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('asis_current_user');
      }
    }
  }, [students, batchColors, teachers, cases, currentUser, isLoaded]);

  const handleUpdateStudent = (studentId: string, record: Omit<StudentRecord, 'id' | 'timestamp' | 'teacherName'>) => {
    if (!currentUser) return;
    
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        const newRecord: StudentRecord = {
          ...record,
          id: `${studentId}-rec-${Date.now()}`,
          timestamp: Date.now(),
          teacherName: currentUser.name
        };
        return {
          ...s,
          totalPoints: s.totalPoints + record.points,
          records: [newRecord, ...s.records]
        };
      }
      return s;
    }));

    setTeachers(prev => prev.map(t => {
      if (t.id === currentUser.id) {
        return {
          ...t,
          meritsGiven: record.points > 0 ? t.meritsGiven + 1 : t.meritsGiven,
          demeritsGiven: record.points < 0 ? t.demeritsGiven + 1 : t.demeritsGiven
        };
      }
      return t;
    }));
    
    setCurrentUser(prev => prev ? ({
      ...prev,
      meritsGiven: record.points > 0 ? prev.meritsGiven + 1 : prev.meritsGiven,
      demeritsGiven: record.points < 0 ? prev.demeritsGiven + 1 : prev.demeritsGiven
    }) : null);
  };

  const handleAddStudent = (newS: Omit<Student, 'id' | 'records' | 'totalPoints' | 'avatar'>) => {
    const student: Student = {
      ...newS,
      id: `std-${Date.now()}`,
      records: [],
      totalPoints: 100,
      avatar: `https://picsum.photos/seed/${Date.now()}/200/200`
    };
    setStudents(prev => [student, ...prev]);
  };

  const handleAddBatch = (count: number) => {
    const newStudents = generateMockStudents(count).map(s => ({
      ...s,
      grade: 1,
      classGroup: `1 ${CLASS_NAMES[Math.floor(Math.random() * CLASS_NAMES.length)]}`
    }));
    setStudents(prev => [...newStudents, ...prev]);
  };

  const handleUpdateStudentProfile = (id: string, updates: Partial<Student>) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleRemoveStudent = (id: string) => {
    if (window.confirm(t('confirm_delete_student') || "Hapus rekod murid ini?")) {
      setStudents(prev => prev.filter(s => s.id !== id));
      if (selectedStudentId === id) {
        setSelectedStudentId(null);
        setActiveView('students');
      }
    }
  };

  const handleAddCase = (newCase: DisciplinaryCase) => {
    setCases(prev => [newCase, ...prev]);
  };

  const handleUpdateCase = (updatedCase: DisciplinaryCase) => {
    setCases(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c));
  };

  const handleRemoveCase = (id: string) => {
    if (window.confirm("Padam rekod kes ini?")) {
      setCases(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveView('dashboard');
  };

  const selectedStudent = useMemo(() => {
    const found = students.find(s => s.id === selectedStudentId);
    return found || null;
  }, [students, selectedStudentId]);

  const navigateToDetail = (id: string) => {
    setSelectedStudentId(id);
    setActiveView('student-detail');
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-asis-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-asis-text mx-auto"></div>
          <p className="mt-4 text-asis-text font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login teachers={teachers} onLogin={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="flex min-h-screen bg-asis-bg text-asis-text relative transition-colors duration-300">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        activeView={activeView} 
        setView={(view) => {
          setActiveView(view);
          setIsSidebarOpen(false);
        }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        t={t}
      />

      <main className="flex-1 overflow-y-auto max-h-screen relative">
        <header className="sticky top-0 z-30 bg-asis-bg/80 backdrop-blur-md border-b border-asis-border px-4 sm:px-8 py-4 flex items-center justify-between transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-asis-text/5 rounded-xl transition-colors text-asis-text"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
            <h1 className="text-lg sm:text-xl font-black text-asis-text">
              {activeView === 'dashboard' && t('nav_dashboard')}
              {activeView === 'students' && t('nav_students')}
              {activeView === 'student-detail' && t('sd_title')}
              {activeView === 'admin' && t('nav_admin')}
              {activeView === 'cases' && t('nav_cases')}
              {activeView === 'account' && t('nav_account')}
            </h1>
          </div>
          <button onClick={() => setActiveView('account')} className="flex items-center gap-3 p-1 pr-3 rounded-2xl hover:bg-asis-text/5 transition-all border border-transparent hover:border-asis-border">
             <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-asis-text">{currentUser.name}</p>
              <p className="text-[10px] text-asis-text/60 font-black uppercase tracking-widest">{currentUser.role}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-asis-primary flex items-center justify-center text-asis-text font-black shadow-md overflow-hidden">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                currentUser.name.split(' ').map(n => n[0]).join('')
              )}
            </div>
          </button>
        </header>

        <div className="p-4 sm:p-8">
          {activeView === 'dashboard' && (
            <Dashboard students={students} onSelectStudent={navigateToDetail} batchColors={batchColors} t={t} />
          )}
          {activeView === 'students' && (
            <StudentList 
              students={students} 
              onSelectStudent={navigateToDetail}
              onQuickAction={handleUpdateStudent}
              onBatchAction={(ids, record) => {
                ids.forEach(id => handleUpdateStudent(id, record));
              }} 
              batchColors={batchColors}
              t={t}
            />
          )}
          {activeView === 'student-detail' && selectedStudent && (
            <StudentDetail 
              student={selectedStudent} 
              teacher={currentUser}
              onBack={() => setActiveView('students')}
              onUpdate={handleUpdateStudent}
              onUpdateAvatar={(id, av) => handleUpdateStudentProfile(id, { avatar: av })}
              onRemove={handleRemoveStudent}
              t={t}
            />
          )}
          {activeView === 'admin' && (
            <AdminPortal 
              students={students}
              batchColors={batchColors}
              teacher={currentUser}
              allTeachers={teachers}
              onSelectStudent={navigateToDetail}
              onUpdateTeacher={(t) => {
                setTeachers(prev => prev.map(pt => pt.id === t.id ? t : pt));
                if (t.id === currentUser.id) setCurrentUser(t);
              }}
              onAddTeacher={(nt) => setTeachers(prev => [{ ...nt, id: `t-${Date.now()}`, meritsGiven: 0, demeritsGiven: 0, avatar: '' }, ...prev])}
              onRemoveTeacher={(id) => setTeachers(prev => prev.filter(t => t.id !== id))}
              onUpdateColors={setBatchColors}
              onBulkReassign={(re) => setStudents(prev => prev.map(s => re[s.id] ? { ...s, ...re[s.id] } : s))}
              onAddBatch={handleAddBatch}
              onImportStudents={setStudents}
              onClearAll={() => { if(window.confirm("Kosongkan semua data?")) setStudents([]); }}
              onAddStudent={handleAddStudent}
              onRemoveStudent={handleRemoveStudent}
              t={t}
            />
          )}
          {activeView === 'cases' && (
            <CaseManagement 
              cases={cases}
              students={students}
              teacher={currentUser}
              onSelectStudent={navigateToDetail}
              onAddCase={handleAddCase}
              onUpdateCase={handleUpdateCase}
              onRemoveCase={handleRemoveCase}
              onAllocatePoints={handleUpdateStudent}
              t={t}
            />
          )}
          {activeView === 'account' && (
            <AccountPage 
              teacher={currentUser} 
              theme={theme}
              setTheme={setTheme}
              language={language}
              setLanguage={setLanguage}
              onUpdateProfile={(t) => {
                setTeachers(prev => prev.map(pt => pt.id === t.id ? t : pt));
                setCurrentUser(t);
              }} 
              onLogout={handleLogout}
              t={t}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
