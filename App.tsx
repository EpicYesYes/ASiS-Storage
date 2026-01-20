
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
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => (localStorage.getItem('asis_theme') as any) || 'system');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('asis_lang') as Language) || 'ms');

  const t = (key: keyof typeof translations['ms']) => (translations[language] as any)[key] || (translations['ms'] as any)[key] || key;

  const performCloudPush = useCallback(async (s: Student[], t: TeacherProfile[], r: StudentRecord[], c: DisciplinaryCase[]) => {
    setIsSyncing(true);
    setSyncStatusMsg("Tolak...");
    await new Promise(res => setTimeout(res, 600));
    const data = { students: s, teachers: t, records: r, cases: c, batchColors, timestamp: Date.now() };
    localStorage.setItem('ASIS_GLOBAL_SYNC_DB', JSON.stringify(data));
    setLastSync(Date.now());
    setSyncStatusMsg("Berjaya");
    setIsSyncing(false);
    setTimeout(() => setSyncStatusMsg(null), 2000);
  }, [batchColors]);

  const handleCloudPull = async () => {
    setIsSyncing(true);
    setSyncStatusMsg("Tarik...");
    await new Promise(res => setTimeout(res, 800));
    const raw = localStorage.getItem('ASIS_GLOBAL_SYNC_DB');
    if (raw) {
      const data = JSON.parse(raw);
      setStudents(data.students || []);
      setTeachers(data.teachers || INITIAL_TEACHERS);
      setRecords(data.records || []);
      setCases(data.cases || []);
      setLastSync(data.timestamp);
      setSyncStatusMsg("Selesai");
    } else {
      setSyncStatusMsg("Tiada Data");
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

    if (savedS) setStudents(JSON.parse(savedS)); else {
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
    const updated = [newRecord, ...records];
    setRecords(updated);
    performCloudPush(students, teachers, updated, cases);
  };

  const studentWithPoints = useMemo(() => {
    return students.map(s => {
      const sRecords = records.filter(r => r.studentId === s.id);
      const totalPoints = sRecords.reduce((acc, curr) => acc + curr.points, 100);
      return { ...s, totalPoints, records: sRecords };
    });
  }, [students, records]);

  if (!isLoaded) return null;
  if (!currentUser) return <Login teachers={teachers} onLogin={(u, r) => { localStorage.setItem('asis_remember_me', r ? 'true' : 'false'); setCurrentUser(u); }} t={t} onPull={handleCloudPull} />;

  return (
    <div className="flex min-h-screen bg-asis-bg text-asis-text relative">
      <Sidebar activeView={activeView} setView={setActiveView} isOpen={false} onClose={() => {}} t={t} />
      <main className="flex-1 overflow-y-auto max-h-screen">
        <header className="sticky top-0 z-30 bg-asis-bg/80 backdrop-blur-md border-b border-asis-border px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-black capitalize">{t(activeView === 'student-detail' ? 'sd_title' : `nav_${activeView}` as any)}</h1>
          <div className="flex items-center gap-4">
            {syncStatusMsg && <div className="text-[10px] font-black uppercase bg-asis-card px-4 py-2 rounded-xl border border-asis-border shadow-sm">{syncStatusMsg}</div>}
            <button onClick={handleCloudPull} className="p-2.5 rounded-xl border border-asis-border bg-asis-card hover:bg-asis-primary transition-all shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </button>
            <button onClick={() => setActiveView('account')} className="w-10 h-10 rounded-xl bg-asis-primary flex items-center justify-center font-black shadow-md">{currentUser.name[0]}</button>
          </div>
        </header>
        <div className="p-8">
          {activeView === 'dashboard' && <Dashboard students={studentWithPoints} onSelectStudent={id => { setSelectedStudentId(id); setActiveView('student-detail'); }} batchColors={batchColors} t={t} />}
          {activeView === 'students' && <StudentList students={studentWithPoints} onSelectStudent={id => { setSelectedStudentId(id); setActiveView('student-detail'); }} onQuickAction={addRecord} onBatchAction={(ids, rec) => ids.forEach(id => addRecord(id, rec))} batchColors={batchColors} t={t} />}
          {activeView === 'student-detail' && <StudentDetail student={studentWithPoints.find(s => s.id === selectedStudentId)!} teacher={currentUser} onBack={() => setActiveView('students')} onUpdate={addRecord} onUpdateAvatar={(id, av) => { setStudents(prev => prev.map(s => s.id === id ? {...s, avatar: av} : s)); }} onRemove={() => {}} t={t} />}
          {activeView === 'admin' && (
            <AdminPortal 
              students={students} batchColors={batchColors} teacher={currentUser} allTeachers={teachers} schoolPassword={'ASIS2025'} onUpdateSchoolPassword={() => {}}
              onSelectStudent={setSelectedStudentId}
              onUpdateTeacher={ut => { const updated = teachers.map(t => t.id === ut.id ? ut : t); setTeachers(updated); performCloudPush(students, updated, records, cases); }} 
              onAddTeacher={nt => { const updated = [nt, ...teachers]; setTeachers(updated); performCloudPush(students, updated, records, cases); }} 
              onRemoveTeacher={id => { const updated = teachers.filter(t => t.id !== id); setTeachers(updated); performCloudPush(students, updated, records, cases); }}
              onAddStudent={ns => { const s: Student = { ...ns, id: `std-${Date.now()}`, avatar: `https://picsum.photos/seed/${Date.now()}/200/200` }; const updated = [s, ...students]; setStudents(updated); performCloudPush(updated, teachers, records, cases); }} 
              onRemoveStudent={id => { const updated = students.filter(s => s.id !== id); setStudents(updated); performCloudPush(updated, teachers, records, cases); }}
              onBulkReassign={r => { const updated = students.map(s => r[s.id] ? { ...s, ...r[s.id] } : s); setStudents(updated); performCloudPush(updated, teachers, records, cases); }}
              onUpdateColors={setBatchColors} onClearAll={() => { setStudents([]); setRecords([]); setTeachers(INITIAL_TEACHERS); performCloudPush([], INITIAL_TEACHERS, [], []); }}
              onAddBatch={c => { const mock = generateMockData(c); setStudents(prev => [...mock.students, ...prev]); setRecords(prev => [...mock.records, ...prev]); }} 
              onImportBackup={() => {}} onCloudPush={() => performCloudPush(students, teachers, records, cases)} onCloudPull={handleCloudPull} lastSync={lastSync} isSyncing={isSyncing} t={t}
            />
          )}
          {activeView === 'cases' && <CaseManagement cases={cases} students={studentWithPoints} teacher={currentUser} onSelectStudent={setSelectedStudentId} onAddCase={nc => { const updated = [nc, ...cases]; setCases(updated); performCloudPush(students, teachers, records, updated); }} onUpdateCase={uc => { const updated = cases.map(c => c.id === uc.id ? uc : c); setCases(updated); performCloudPush(students, teachers, records, updated); }} onRemoveCase={id => { const updated = cases.filter(c => c.id !== id); setCases(updated); performCloudPush(students, teachers, records, updated); }} onAllocatePoints={addRecord} t={t} />}
          {activeView === 'account' && <AccountPage teacher={currentUser} theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} onUpdateProfile={ut => { const updated = teachers.map(t => t.id === ut.id ? ut : t); setTeachers(updated); setCurrentUser(ut); performCloudPush(students, updated, records, cases); }} onLogout={() => setCurrentUser(null)} t={t} />}
        </div>
      </main>
    </div>
  );
};

export default App;
