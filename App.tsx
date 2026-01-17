
import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
    roles: ['Guru Biasa'],
    email: 'guru@asis.edu.my',
    staffId: 'GURU-2025',
    department: 'Pentadbiran',
    meritsGiven: 0,
    demeritsGiven: 0,
    avatar: '',
    subjects: ['Bahasa Melayu'],
    isAdmin: true,
    password: 'password123'
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<number>(() => Number(localStorage.getItem('asis_last_sync')) || 0);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const [schoolPassword, setSchoolPassword] = useState(() => localStorage.getItem('asis_school_password') || 'ASIS2025');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => (localStorage.getItem('asis_theme') as any) || 'system');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('asis_lang') as Language) || 'ms');

  const t = (key: keyof typeof translations['ms']) => (translations[language] as any)[key] || (translations['ms'] as any)[key] || key;

  // Cloud Logic
  const performCloudPush = useCallback(async (currentStudents: Student[], currentTeachers: TeacherProfile[], currentCases: DisciplinaryCase[], currentColors: Record<number, string>) => {
    setIsSyncing(true);
    setSyncStatusMsg("Menghantar...");
    await new Promise(r => setTimeout(r, 800));

    const data = { 
      students: currentStudents, 
      teachers: currentTeachers, 
      cases: currentCases, 
      batchColors: currentColors, 
      timestamp: Date.now(),
      pushedBy: currentUser?.name || 'Sistem'
    };
    
    // Simulation of global storage
    localStorage.setItem('ASIS_GLOBAL_CLOUD_STORAGE', JSON.stringify(data));
    setLastSync(Date.now());
    setIsSyncing(false);
    setSyncStatusMsg("Berjaya");
    setTimeout(() => setSyncStatusMsg(null), 2000);
  }, [currentUser]);

  const handleCloudPull = async () => {
    setIsSyncing(true);
    setSyncStatusMsg("Menarik...");
    await new Promise(r => setTimeout(r, 1200));

    const cloudDataRaw = localStorage.getItem('ASIS_GLOBAL_CLOUD_STORAGE');
    if (cloudDataRaw) {
      const cloudData = JSON.parse(cloudDataRaw);
      setStudents(cloudData.students || []);
      setTeachers(cloudData.teachers || []);
      setCases(cloudData.cases || []);
      setBatchColors(cloudData.batchColors || INITIAL_BATCH_COLORS);
      setLastSync(cloudData.timestamp);
      setSyncStatusMsg("Sinkronisasi Selesai");
    } else {
      setSyncStatusMsg("Tiada Data Awan");
    }
    setIsSyncing(false);
    setTimeout(() => setSyncStatusMsg(null), 2000);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'system') root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
    else root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('asis_theme', theme);
  }, [theme]);

  // Initial Load
  useEffect(() => {
    const s = localStorage.getItem('asis_students');
    const te = localStorage.getItem('asis_teachers');
    const cas = localStorage.getItem('asis_cases');
    const c = localStorage.getItem('asis_batch_colors');
    const rem = localStorage.getItem('asis_remember_me') === 'true';
    const cu = localStorage.getItem('asis_current_user');

    if (s) setStudents(JSON.parse(s)); else setStudents(generateMockStudents(550));
    if (te) setTeachers(JSON.parse(te)); else setTeachers(INITIAL_TEACHERS);
    if (cas) setCases(JSON.parse(cas));
    if (c) setBatchColors(JSON.parse(c));
    if (rem && cu) setCurrentUser(JSON.parse(cu));
    setIsLoaded(true);
  }, []);

  // Local persistence (backup)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('asis_students', JSON.stringify(students));
      localStorage.setItem('asis_teachers', JSON.stringify(teachers));
      localStorage.setItem('asis_cases', JSON.stringify(cases));
      localStorage.setItem('asis_batch_colors', JSON.stringify(batchColors));
      localStorage.setItem('asis_school_password', schoolPassword);
      localStorage.setItem('asis_lang', language);
      localStorage.setItem('asis_last_sync', lastSync.toString());
      if (currentUser) localStorage.setItem('asis_current_user', JSON.stringify(currentUser));
    }
  }, [students, teachers, cases, batchColors, currentUser, schoolPassword, language, isLoaded, lastSync]);

  const handleUpdateStudent = (id: string, record: Omit<StudentRecord, 'id' | 'timestamp' | 'teacherName'>) => {
    if (!currentUser) return;
    const newRec = { ...record, id: `rec-${Date.now()}-${Math.random()}`, timestamp: Date.now(), teacherName: currentUser.name };
    const updatedStudents = students.map(s => s.id === id ? { ...s, totalPoints: s.totalPoints + record.points, records: [newRec, ...s.records] } : s);
    setStudents(updatedStudents);
    performCloudPush(updatedStudents, teachers, cases, batchColors);
  };

  const handleBatchUpdate = (ids: string[], record: Omit<StudentRecord, 'id' | 'timestamp' | 'teacherName'>) => {
    if (!currentUser) return;
    const updatedStudents = students.map(s => {
      if (ids.includes(s.id)) {
        const newRec = { ...record, id: `rec-${Date.now()}-${Math.random()}`, timestamp: Date.now(), teacherName: currentUser.name };
        return { ...s, totalPoints: s.totalPoints + record.points, records: [newRec, ...s.records] };
      }
      return s;
    });
    setStudents(updatedStudents);
    performCloudPush(updatedStudents, teachers, cases, batchColors);
  };

  const handleAddStudent = (newS: Omit<Student, 'id' | 'records' | 'totalPoints' | 'avatar'>) => {
    const student: Student = { ...newS, id: `std-${Date.now()}`, records: [], totalPoints: 100, avatar: `https://picsum.photos/seed/${Date.now()}/200/200` };
    const updated = [student, ...students];
    setStudents(updated);
    performCloudPush(updated, teachers, cases, batchColors);
  };

  const handleRemoveStudent = (id: string) => {
    const updated = students.filter(s => s.id !== id);
    setStudents(updated);
    performCloudPush(updated, teachers, cases, batchColors);
  };

  const handleAddCase = (nc: DisciplinaryCase) => {
    const updated = [nc, ...cases];
    setCases(updated);
    performCloudPush(students, teachers, updated, batchColors);
  };

  const handleUpdateCase = (uc: DisciplinaryCase) => {
    const updated = cases.map(c => c.id === uc.id ? uc : c);
    setCases(updated);
    performCloudPush(students, teachers, updated, batchColors);
  };

  const handleRemoveCase = (id: string) => {
    const updated = cases.filter(c => c.id !== id);
    setCases(updated);
    performCloudPush(students, teachers, updated, batchColors);
  };

  const handleUpdateTeacher = (ut: TeacherProfile) => {
    const updated = teachers.map(t => t.id === ut.id ? ut : t);
    setTeachers(updated);
    if (ut.id === currentUser?.id) setCurrentUser(ut);
    performCloudPush(students, updated, cases, batchColors);
  };

  const handleAddTeacher = (nt: TeacherProfile) => {
    const updated = [nt, ...teachers];
    setTeachers(updated);
    performCloudPush(students, updated, cases, batchColors);
  };

  const handleRemoveTeacher = (id: string) => {
    const updated = teachers.filter(t => t.id !== id);
    setTeachers(updated);
    performCloudPush(students, updated, cases, batchColors);
  };

  if (!isLoaded) return <div className="min-h-screen bg-asis-bg flex items-center justify-center font-black">Memulakan Sistem...</div>;
  if (!currentUser) return <Login teachers={teachers} onLogin={(u, r) => { localStorage.setItem('asis_remember_me', r ? 'true' : 'false'); setCurrentUser(u); }} t={t} />;

  return (
    <div className="flex min-h-screen bg-asis-bg text-asis-text relative">
      <Sidebar activeView={activeView} setView={v => { setActiveView(v); setIsSidebarOpen(false); }} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} t={t} />
      <main className="flex-1 overflow-y-auto max-h-screen">
        <header className="sticky top-0 z-30 bg-asis-bg/80 backdrop-blur-md border-b border-asis-border px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"/></svg></button>
             <h1 className="text-xl font-black capitalize tracking-tight">{t(activeView === 'student-detail' ? 'sd_title' : `nav_${activeView}` as any)}</h1>
          </div>
          <div className="flex items-center gap-4">
            {syncStatusMsg && (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-asis-card border border-asis-border rounded-xl shadow-sm animate-in fade-in slide-in-from-right-4">
                <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                <span className="text-[10px] font-black uppercase tracking-widest">{syncStatusMsg}</span>
              </div>
            )}
            <button onClick={handleCloudPull} disabled={isSyncing} className={`p-2.5 rounded-xl border border-asis-border bg-asis-card shadow-sm transition-all hover:bg-asis-primary group ${isSyncing ? 'animate-spin' : 'hover:scale-105 active:scale-95'}`} title="Tarik Data Terkini (Manual Pull)">
              <svg className="w-5 h-5 group-hover:text-[#0000bf]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </button>
            <button onClick={() => setActiveView('account')} className="w-10 h-10 rounded-xl bg-asis-primary flex items-center justify-center text-asis-text font-black shadow-md overflow-hidden hover:scale-105 transition-transform">{currentUser.name[0]}</button>
          </div>
        </header>
        <div className="p-8">
          {activeView === 'dashboard' && <Dashboard students={students} onSelectStudent={id => { setSelectedStudentId(id); setActiveView('student-detail'); }} batchColors={batchColors} t={t} />}
          {activeView === 'students' && <StudentList students={students} onSelectStudent={id => { setSelectedStudentId(id); setActiveView('student-detail'); }} onQuickAction={handleUpdateStudent} onBatchAction={handleBatchUpdate} batchColors={batchColors} t={t} />}
          {activeView === 'student-detail' && students.find(s => s.id === selectedStudentId) && <StudentDetail student={students.find(s => s.id === selectedStudentId)!} teacher={currentUser} onBack={() => setActiveView('students')} onUpdate={handleUpdateStudent} onUpdateAvatar={(id, av) => { const updated = students.map(s => s.id === id ? {...s, avatar: av} : s); setStudents(updated); performCloudPush(updated, teachers, cases, batchColors); }} onRemove={handleRemoveStudent} t={t} />}
          {activeView === 'admin' && (
            <AdminPortal 
              students={students} batchColors={batchColors} teacher={currentUser} allTeachers={teachers} schoolPassword={schoolPassword} onUpdateSchoolPassword={setSchoolPassword}
              onSelectStudent={id => { setSelectedStudentId(id); setActiveView('student-detail'); }}
              onUpdateTeacher={handleUpdateTeacher} onAddTeacher={handleAddTeacher} onRemoveTeacher={handleRemoveTeacher}
              onAddStudent={handleAddStudent} onRemoveStudent={handleRemoveStudent}
              onBulkReassign={r => { const updated = students.map(s => r[s.id] ? { ...s, ...r[s.id] } : s); setStudents(updated); performCloudPush(updated, teachers, cases, batchColors); }}
              onUpdateColors={c => { setBatchColors(c); performCloudPush(students, teachers, cases, c); }} 
              onClearAll={() => { setStudents([]); performCloudPush([], teachers, cases, batchColors); }} 
              onAddBatch={c => { const updated = [...generateMockStudents(c), ...students]; setStudents(updated); performCloudPush(updated, teachers, cases, batchColors); }} 
              onImportBackup={d => { setStudents(d.students); setTeachers(d.teachers); setBatchColors(d.batchColors); performCloudPush(d.students, d.teachers, cases, d.batchColors); }} 
              onCloudPush={() => performCloudPush(students, teachers, cases, batchColors)}
              onCloudPull={handleCloudPull}
              lastSync={lastSync} isSyncing={isSyncing}
              t={t}
            />
          )}
          {activeView === 'cases' && <CaseManagement cases={cases} students={students} teacher={currentUser} onSelectStudent={id => { setSelectedStudentId(id); setActiveView('student-detail'); }} onAddCase={handleAddCase} onUpdateCase={handleUpdateCase} onRemoveCase={handleRemoveCase} onAllocatePoints={handleUpdateStudent} t={t} />}
          {activeView === 'account' && <AccountPage teacher={currentUser} theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} onUpdateProfile={handleUpdateTeacher} onLogout={() => { localStorage.removeItem('asis_remember_me'); setCurrentUser(null); }} t={t} />}
        </div>
      </main>
    </div>
  );
};

export default App;
