
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { generateMockData } from './mockData';
import { Student, View, StudentRecord, TeacherProfile, DisciplinaryCase } from './types';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import StudentDetail from './components/StudentDetail';
import Sidebar from './components/Sidebar';
import AdminPortal from './components/AdminPortal';
import AccountPage from './components/AccountPage';
import CaseManagement from './components/CaseManagement';
import Login from './components/Login';
import { INITIAL_BATCH_COLORS } from './constants';
import { translations, Language } from './translations';

const INITIAL_TEACHERS: TeacherProfile[] = [
  {
    id: 'admin-1',
    name: 'Admin Sekolah',
    roles: ['Pentadbir Sistem'],
    email: 'admin@asis.edu.my',
    staffId: 'ADMIN-2025',
    avatar: '',
    subjects: ['Teknologi Maklumat'],
    isAdmin: true,
    password: 'password123'
  }
];

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [cases, setCases] = useState<DisciplinaryCase[]>([]);
  const [batchColors, setBatchColors] = useState<Record<number, string>>(INITIAL_BATCH_COLORS);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<TeacherProfile | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<number>(0);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => (localStorage.getItem('asis_theme') as any) || 'system');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('asis_lang') as Language) || 'ms');

  const t = (key: keyof typeof translations['ms']) => (translations[language] as any)[key] || (translations['ms'] as any)[key] || key;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleNav = (v: View) => {
    setActiveView(v);
    setIsSidebarOpen(false);
  };

  const performCloudPush = useCallback(async (s: Student[], t: TeacherProfile[], r: StudentRecord[], c: DisciplinaryCase[]) => {
    setIsSyncing(true);
    setSyncStatusMsg("Tolak...");
    const data = { students: s, teachers: t, records: r, cases: c, batchColors, timestamp: Date.now() };
    localStorage.setItem('ASIS_GLOBAL_SYNC_DB', JSON.stringify(data));
    setLastSync(Date.now());
    setSyncStatusMsg("Berjaya");
    setIsSyncing(false);
    setTimeout(() => setSyncStatusMsg(null), 2000);
    showToast("Data Berjaya Disimpan ke Awan");
  }, [batchColors]);

  const handleCloudPull = async () => {
    setIsSyncing(true);
    setSyncStatusMsg("Tarik...");
    await new Promise(res => setTimeout(res, 500));
    const raw = localStorage.getItem('ASIS_GLOBAL_SYNC_DB');
    if (raw) {
      const data = JSON.parse(raw);
      if (data.students) {
        setStudents(data.students);
        setTeachers(data.teachers || INITIAL_TEACHERS);
        setRecords(data.records || []);
        setCases(data.cases || []);
        setLastSync(data.timestamp);
        showToast("Sinkronisasi Selesai");
      }
    } else {
      showToast("Tiada data di awan.");
    }
    setIsSyncing(false);
    setTimeout(() => setSyncStatusMsg(null), 2000);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'system') root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
    else root.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const savedS = localStorage.getItem('asis_students');
    const savedT = localStorage.getItem('asis_teachers');
    const savedR = localStorage.getItem('asis_records');
    const savedC = localStorage.getItem('asis_cases');
    const rem = localStorage.getItem('asis_remember_me') === 'true';
    const cu = localStorage.getItem('asis_current_user');

    if (savedS) setStudents(JSON.parse(savedS));
    else {
      const mock = generateMockData(550);
      setStudents(mock.students);
      setRecords(mock.records);
    }

    if (savedT) setTeachers(JSON.parse(savedT)); else setTeachers(INITIAL_TEACHERS);
    if (savedR) setRecords(JSON.parse(savedR));
    if (savedC) setCases(JSON.parse(savedC));
    if (rem && cu) setCurrentUser(JSON.parse(cu));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('asis_students', JSON.stringify(students));
      localStorage.setItem('asis_teachers', JSON.stringify(teachers));
      localStorage.setItem('asis_records', JSON.stringify(records));
      localStorage.setItem('asis_cases', JSON.stringify(cases));
      if (currentUser) localStorage.setItem('asis_current_user', JSON.stringify(currentUser));
      localStorage.setItem('asis_theme', theme);
      localStorage.setItem('asis_lang', language);
    }
  }, [students, teachers, records, cases, currentUser, isLoaded, theme, language]);

  const addRecord = (studentId: string, payload: Omit<StudentRecord, 'id' | 'studentId' | 'teacherId' | 'teacherName' | 'timestamp'>) => {
    if (!currentUser) return;
    const newRecord: StudentRecord = {
      ...payload,
      id: `rec-${Date.now()}-${Math.random()}`,
      studentId,
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      timestamp: Date.now()
    };
    setRecords(prev => [newRecord, ...prev]);
    showToast("Rekod Ditambah");
  };

  // YEARLY TOOLS HANDLERS
  const handleProcessYearEnd = () => {
    setStudents(prev => {
      // 1. Remove F5 (Graduates)
      const nonGraduated = prev.filter(s => s.grade < 5);
      
      // 2. Promote F1-F4 to F2-F5
      const promoted = nonGraduated.map(s => {
          const nextGrade = s.grade + 1;
          const classParts = s.classGroup.split(' ');
          const classSuffix = classParts.slice(1).join(' ').trim();
          
          let newClassSuffix = classSuffix;
          const shouldShuffle = Math.random() > 0.5;

          // Shuffle logic for pairing classes
          if (shouldShuffle) {
            if (classSuffix === 'Amanah') newClassSuffix = 'Bestari';
            else if (classSuffix === 'Bestari') newClassSuffix = 'Amanah';
            else if (classSuffix === 'Cita') newClassSuffix = 'Dinamik';
            else if (classSuffix === 'Dinamik') newClassSuffix = 'Cita';
          }

          return {
            ...s,
            grade: nextGrade,
            classGroup: `${nextGrade} ${newClassSuffix}`
          };
        });
      return promoted;
    });
    // 3. Optional: Clear records for the new year
    setRecords([]);
    showToast("Kenaikan Tingkatan Berjaya & Rekod Dikosongkan");
  };

  const handleAddBatch = (count: number) => {
    const mock = generateMockData(count);
    const f1Batch = mock.students.map(s => ({
      ...s,
      grade: 1,
      classGroup: `1 ${s.classGroup.split(' ').slice(1).join(' ').trim()}`
    }));
    setStudents(prev => [...f1Batch, ...prev]);
    showToast(`Berjaya Menambah ${count} Murid F1 Baharu`);
  };

  const studentWithPoints = useMemo(() => {
    return students.map(s => {
      const sRecords = records.filter(r => r.studentId === s.id);
      const totalPoints = sRecords.reduce((acc, curr) => acc + curr.points, 100);
      return { ...s, totalPoints, records: sRecords };
    });
  }, [students, records]);

  if (!isLoaded) return null;
  if (!currentUser) return <Login teachers={teachers} onLogin={(u, r) => setCurrentUser(u)} t={t} onPull={handleCloudPull} />;

  return (
    <div className="flex min-h-screen bg-asis-bg text-asis-text relative overflow-hidden">
      {isSidebarOpen && <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
      
      <Sidebar activeView={activeView} setView={handleNav} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} t={t} />
      
      <main className="flex-1 h-screen overflow-y-auto scrolling-touch relative z-10 bg-asis-bg">
        <header className="sticky top-0 z-30 bg-asis-bg/80 backdrop-blur-md border-b border-asis-border px-4 sm:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2.5 rounded-xl bg-asis-primary text-[#0000bf] shadow-lg active:scale-90 transition-all">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 6h16M4 12h16m-7 6h7"/></svg>
            </button>
            <h1 className="text-lg sm:text-2xl font-black capitalize tracking-tight leading-none">{t(activeView === 'student-detail' ? 'sd_title' : `nav_${activeView}` as any)}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {syncStatusMsg && <div className="text-[9px] font-black uppercase bg-asis-primary text-[#0000bf] px-3 py-1.5 rounded-lg border border-asis-border shadow-sm">{syncStatusMsg}</div>}
            <button onClick={handleCloudPull} className="p-2.5 rounded-xl border border-asis-border bg-asis-card hover:bg-asis-primary transition-all shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </button>
            <button onClick={() => handleNav('account')} className="w-10 h-10 rounded-xl bg-asis-primary flex items-center justify-center font-black shadow-md !text-[#0000bf] text-lg">{currentUser.name[0]}</button>
          </div>
        </header>

        <div className="p-4 sm:p-8 max-w-7xl mx-auto pb-32">
          {activeView === 'dashboard' && <Dashboard students={studentWithPoints} onSelectStudent={id => { setSelectedStudentId(id); handleNav('student-detail'); }} batchColors={batchColors} t={t} />}
          {activeView === 'students' && <StudentList students={studentWithPoints} onSelectStudent={id => { setSelectedStudentId(id); handleNav('student-detail'); }} onQuickAction={addRecord} onBatchAction={(ids, rec) => ids.forEach(id => addRecord(id, rec))} batchColors={batchColors} t={t} />}
          {activeView === 'student-detail' && <StudentDetail student={studentWithPoints.find(s => s.id === selectedStudentId)!} teacher={currentUser} onBack={() => handleNav('students')} onUpdate={addRecord} onUpdateAvatar={(id, av) => setStudents(prev => prev.map(s => s.id === id ? {...s, avatar: av} : s))} onRemove={() => {}} t={t} />}
          {activeView === 'admin' && (
            <AdminPortal 
              students={students} batchColors={batchColors} teacher={currentUser} allTeachers={teachers} schoolPassword={'password123'} onUpdateSchoolPassword={() => {}}
              onSelectStudent={id => { setSelectedStudentId(id); handleNav('student-detail'); }}
              onUpdateTeacher={ut => setTeachers(prev => prev.map(t => t.id === ut.id ? ut : t))} 
              onAddTeacher={nt => setTeachers(prev => [nt, ...prev])} 
              onRemoveTeacher={id => setTeachers(prev => prev.filter(t => t.id !== id))}
              onAddStudent={ns => setStudents(prev => [{ ...ns, id: `std-${Date.now()}-${Math.random()}`, avatar: `https://picsum.photos/seed/${Date.now()}/200/200` }, ...prev])} 
              onUpdateStudent={us => setStudents(prev => prev.map(s => s.id === us.id ? { ...s, ...us } : s))}
              onRemoveStudent={id => setStudents(prev => prev.filter(s => s.id !== id))}
              onProcessYearEnd={handleProcessYearEnd}
              onAddBatch={handleAddBatch}
              onUpdateColors={setBatchColors} 
              onClearAll={() => { setStudents([]); setRecords([]); }}
              onImportBackup={() => {}} onCloudPush={() => performCloudPush(students, teachers, records, cases)} onCloudPull={handleCloudPull} lastSync={lastSync} isSyncing={isSyncing} t={t}
            />
          )}
          {activeView === 'cases' && <CaseManagement cases={cases} students={studentWithPoints} teacher={currentUser} onSelectStudent={id => { setSelectedStudentId(id); handleNav('student-detail'); }} onAddCase={nc => setCases(prev => [nc, ...prev])} onUpdateCase={uc => setCases(prev => prev.map(c => c.id === uc.id ? uc : c))} onRemoveCase={id => setCases(prev => prev.filter(c => c.id !== id))} onAllocatePoints={addRecord} t={t} />}
          {activeView === 'account' && <AccountPage teacher={currentUser} theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} onUpdateProfile={ut => { setTeachers(prev => prev.map(t => t.id === ut.id ? ut : t)); setCurrentUser(ut); }} onLogout={() => setCurrentUser(null)} t={t} />}
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-asis-text text-asis-bg px-8 py-3 rounded-2xl shadow-2xl font-black text-xs uppercase tracking-widest animate-in slide-in-from-bottom-4">
          {toast}
        </div>
      )}
    </div>
  );
};

export default App;
