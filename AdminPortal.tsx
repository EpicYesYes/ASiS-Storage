
import React, { useState, useMemo } from 'react';
import { HOUSES, GRADES, CLASS_NAMES, TEACHER_TITLES, TEACHER_SEPARATORS, NAME_SEPARATORS, TEACHER_ROLES, SUBJECT_CATEGORIES } from '../constants';
import { Student, TeacherProfile } from '../types';

interface AdminPortalProps {
  students: Student[];
  batchColors: Record<number, string>;
  teacher: TeacherProfile;
  allTeachers: TeacherProfile[];
  schoolPassword: string;
  onUpdateSchoolPassword: (pass: string) => void;
  onSelectStudent: (id: string) => void;
  onUpdateTeacher: (profile: TeacherProfile) => void;
  onAddTeacher: (newTeacher: TeacherProfile) => void;
  onRemoveTeacher: (id: string) => void;
  onUpdateColors: (colors: Record<number, string>) => void;
  onBulkReassign: (reassignments: Record<string, { grade: number; classGroup: string }>) => void;
  onAddBatch: (count: number) => void;
  onImportBackup: (data: { students: Student[], teachers: TeacherProfile[], batchColors: Record<number, string> }) => void;
  onClearAll: () => void;
  onAddStudent: (newStudent: Omit<Student, 'id' | 'records' | 'totalPoints' | 'avatar'>) => void;
  onRemoveStudent: (id: string) => void;
  onCloudPush: () => void;
  onCloudPull: () => void;
  lastSync: number;
  isSyncing: boolean;
  t: (key: any) => string;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ 
  students, batchColors, teacher, allTeachers, schoolPassword, onUpdateSchoolPassword,
  onSelectStudent, onUpdateTeacher, onAddTeacher, onRemoveTeacher, 
  onUpdateColors, onBulkReassign, onAddBatch, onImportBackup, onClearAll, onAddStudent, onRemoveStudent, 
  onCloudPush, onCloudPull, lastSync, isSyncing, t
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'system'>('students');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  
  // Verification States
  const [verificationModal, setVerificationModal] = useState<{
    show: boolean;
    stage: 'confirm' | 'password';
    action: () => void;
    title: string;
    message: string;
  }>({ show: false, stage: 'confirm', action: () => {}, title: '', message: '' });
  const [verificationPassword, setVerificationPassword] = useState('');

  // Forms
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({ 
    firstName: '', 
    separator: NAME_SEPARATORS[0].value, 
    lastName: '', 
    grade: 1, 
    classGroup: `1 ${CLASS_NAMES[0]}`, 
    house: HOUSES[0] 
  });

  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  
  const [teacherForm, setTeacherForm] = useState({
    title: TEACHER_TITLES[0],
    firstName: '', 
    separator: TEACHER_SEPARATORS[0], 
    lastName: '',
    roles: [TEACHER_ROLES[TEACHER_ROLES.length - 1]], 
    subjects: [] as string[],
    email: '', 
    staffId: '', 
    password: '',
    isAdmin: false
  });

  const [syncTokenInput, setSyncTokenInput] = useState('');

  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery) return students.slice(0, 10);
    return students.filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentSearchQuery.toLowerCase())).slice(0, 15);
  }, [students, studentSearchQuery]);

  const filteredTeachers = useMemo(() => {
    if (!teacherSearchQuery) return allTeachers;
    return allTeachers.filter(t => t.name.toLowerCase().includes(teacherSearchQuery.toLowerCase()));
  }, [allTeachers, teacherSearchQuery]);

  const startVerification = (action: () => void, title: string, message: string) => {
    setVerificationModal({ show: true, stage: 'confirm', action, title, message });
    setVerificationPassword('');
  };

  const handleVerificationProceed = () => {
    if (verificationModal.stage === 'confirm') {
      setVerificationModal(prev => ({ ...prev, stage: 'password' }));
    } else {
      if (verificationPassword === schoolPassword) {
        verificationModal.action();
        setVerificationModal(prev => ({ ...prev, show: false }));
      } else {
        alert("Kata laluan sekolah salah.");
      }
    }
  };

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // FIX: Ensure space if no separator is used
    const sepStr = (newStudentForm.separator === '' || !newStudentForm.separator) ? ' ' : ` ${newStudentForm.separator} `;
    onAddStudent({
      firstName: newStudentForm.firstName,
      lastName: `${sepStr}${newStudentForm.lastName}`.trim(),
      grade: newStudentForm.grade,
      classGroup: newStudentForm.classGroup,
      house: newStudentForm.house,
    });
    setShowAddStudent(false);
    setNewStudentForm({ firstName: '', separator: NAME_SEPARATORS[0].value, lastName: '', grade: 1, classGroup: `1 ${CLASS_NAMES[0]}`, house: HOUSES[0] });
  };

  const toggleTeacherFormItem = (type: 'roles' | 'subjects', item: string) => {
    setTeacherForm(prev => {
      const list = prev[type].includes(item)
        ? prev[type].filter(i => i !== item)
        : [...prev[type], item];
      return { ...prev, [type]: list };
    });
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // FIX: Ensure space if (none) is used
    const sepStr = (teacherForm.separator === '(none)' || !teacherForm.separator) ? ' ' : ` ${teacherForm.separator} `;
    const fullName = `${teacherForm.title} ${teacherForm.firstName}${sepStr}${teacherForm.lastName}`.replace(/\s+/g, ' ').trim();

    if (editingTeacherId) {
      const existing = allTeachers.find(t => t.id === editingTeacherId);
      if (existing) {
        onUpdateTeacher({
          ...existing,
          name: fullName,
          roles: teacherForm.roles,
          subjects: teacherForm.subjects,
          email: teacherForm.email,
          staffId: teacherForm.staffId,
          password: teacherForm.password || existing.password,
          isAdmin: teacherForm.isAdmin
        });
      }
      setEditingTeacherId(null);
    } else {
      const id = teacherForm.staffId || `GURU-${Math.floor(1000 + Math.random() * 9000)}`;
      onAddTeacher({
        id, 
        staffId: id, 
        name: fullName, 
        roles: teacherForm.roles, 
        email: teacherForm.email,
        department: 'Pentadbiran', 
        meritsGiven: 0, 
        demeritsGiven: 0, 
        avatar: '',
        subjects: teacherForm.subjects, 
        isAdmin: teacherForm.isAdmin, 
        password: teacherForm.password || 'password123'
      });
      setShowAddTeacher(false);
    }
    
    setTeacherForm({ title: TEACHER_TITLES[0], firstName: '', separator: TEACHER_SEPARATORS[0], lastName: '', roles: [TEACHER_ROLES[TEACHER_ROLES.length - 1]], subjects: [], email: '', staffId: '', password: '', isAdmin: false });
  };

  const handleEditTeacher = (tProfile: TeacherProfile) => {
    const parts = tProfile.name.split(' ');
    setTeacherForm({
      title: TEACHER_TITLES.includes(parts[0]) ? parts[0] : TEACHER_TITLES[0],
      firstName: parts[1] || '',
      separator: parts.find(p => TEACHER_SEPARATORS.includes(p)) || '(none)',
      lastName: parts.slice(2).join(' ') || '',
      roles: tProfile.roles,
      subjects: tProfile.subjects,
      email: tProfile.email,
      staffId: tProfile.staffId,
      password: tProfile.password || '',
      isAdmin: tProfile.isAdmin
    });
    setEditingTeacherId(tProfile.id);
  };

  const handleFormPromotion = () => {
    const reassignments: Record<string, { grade: number; classGroup: string }> = {};
    students.forEach(s => {
      const newGrade = s.grade + 1;
      const classPart = s.classGroup.split(' ')[1];
      reassignments[s.id] = { grade: newGrade, classGroup: `${newGrade} ${classPart}` };
    });
    onBulkReassign(reassignments);
    alert("Kenaikan tingkatan berjaya untuk semua murid.");
  };

  const exportSyncToken = () => {
    const data = { students, teachers: allTeachers, batchColors, timestamp: Date.now() };
    const token = btoa(JSON.stringify(data));
    setSyncTokenInput(token);
    navigator.clipboard.writeText(token);
    alert("Token disalin ke papan keratan!");
  };

  const importSyncToken = () => {
    try {
      const data = JSON.parse(atob(syncTokenInput));
      onImportBackup(data);
      alert("Sinkronisasi berjaya!");
      setSyncTokenInput('');
    } catch (e) {
      alert("Token tidak sah.");
    }
  };

  const renderTeacherForm = (isNew: boolean) => (
    <div className="bg-asis-card p-10 rounded-[3rem] border border-asis-border shadow-xl space-y-8 animate-in slide-in-from-top-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black">{isNew ? 'Daftar Guru Baharu' : `Kemas Kini Profil Guru`}</h3>
        <button onClick={() => { setShowAddTeacher(false); setEditingTeacherId(null); }} className="opacity-40 hover:opacity-100"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
      </div>
      <form onSubmit={handleTeacherSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Gelaran</label>
            <select className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black" value={teacherForm.title} onChange={e => setTeacherForm({...teacherForm, title: e.target.value})}>
              {TEACHER_TITLES.map(tit => <option key={tit} value={tit}>{tit}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Nama Pertama</label>
            <input className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black" placeholder="Nama Pertama" value={teacherForm.firstName} onChange={e => setTeacherForm({...teacherForm, firstName: e.target.value})} required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Pemisah</label>
            <select className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black" value={teacherForm.separator} onChange={e => setTeacherForm({...teacherForm, separator: e.target.value})}>
              {TEACHER_SEPARATORS.map(sep => <option key={sep} value={sep}>{sep}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Nama Akhir</label>
            <input className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black" placeholder="Nama Akhir" value={teacherForm.lastName} onChange={e => setTeacherForm({...teacherForm, lastName: e.target.value})} required />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1 block">Jawatan Guru (Pilih Banyak)</label>
          <div className="flex flex-wrap gap-2">
            {TEACHER_ROLES.map(role => (
              <button 
                key={role} 
                type="button"
                onClick={() => toggleTeacherFormItem('roles', role)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${teacherForm.roles.includes(role) ? 'bg-asis-primary border-asis-primary shadow-md' : 'bg-asis-bg/30 border-asis-border opacity-40 hover:opacity-100'}`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1 block">Subjek Mengajar (Pilih Banyak)</label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(SUBJECT_CATEGORIES).map(([cat, subs]) => (
              <div key={cat} className="space-y-2">
                <h4 className="text-[9px] font-black uppercase opacity-30 tracking-[0.2em]">{cat}</h4>
                <div className="flex flex-wrap gap-1.5">
                  {subs.map(s => (
                    <button 
                      key={s} 
                      type="button"
                      onClick={() => toggleTeacherFormItem('subjects', s)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all border ${teacherForm.subjects.includes(s) ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'bg-asis-bg/20 border-asis-border opacity-40 hover:opacity-100'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">E-mel</label>
            <input className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black" placeholder="guru@asis.edu.my" type="email" value={teacherForm.email} onChange={e => setTeacherForm({...teacherForm, email: e.target.value})} required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">ID Staf / Username</label>
            <input className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black" placeholder="cth: GURU-9901" value={teacherForm.staffId} onChange={e => setTeacherForm({...teacherForm, staffId: e.target.value})} required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Kata Laluan</label>
            <input className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black" placeholder="••••••••" type="password" value={teacherForm.password} onChange={e => setTeacherForm({...teacherForm, password: e.target.value})} required={isNew} />
          </div>
        </div>

        {/* Simplified Checkbox to prevent glitches */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 group">
            <input 
              type="checkbox" 
              id="adminCheckbox"
              className="w-6 h-6 border-2 border-asis-border rounded-lg accent-asis-primary cursor-pointer" 
              checked={teacherForm.isAdmin} 
              onChange={e => setTeacherForm(prev => ({ ...prev, isAdmin: e.target.checked }))} 
            />
            <label htmlFor="adminCheckbox" className="text-xs font-black uppercase tracking-widest opacity-60 cursor-pointer">Berikan Akses Admin</label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-asis-border">
          <button type="button" onClick={() => { setShowAddTeacher(false); setEditingTeacherId(null); }} className="px-8 py-4 font-black opacity-40">Batal</button>
          <button type="submit" className="px-10 py-4 bg-asis-primary !text-[#0000bf] font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest">
            {isNew ? 'Daftar Guru' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 text-asis-text transition-colors duration-300">
      {verificationModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-asis-card rounded-[3rem] shadow-2xl max-w-md w-full p-10 text-center border-t-8 border-rose-600 border border-asis-border">
            <h3 className="text-2xl font-black mb-3 text-rose-600">{verificationModal.title}</h3>
            <p className="opacity-60 font-medium leading-relaxed mb-8">{verificationModal.message}</p>
            {verificationModal.stage === 'password' && (
              <div className="mb-8 text-left">
                <label className="text-[10px] font-black opacity-40 uppercase tracking-widest block mb-2">Kata Laluan Pentadbir Sekolah</label>
                <input type="password" placeholder="••••••••" className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black outline-none focus:border-rose-600 text-center tracking-widest" value={verificationPassword} onChange={e => setVerificationPassword(e.target.value)} autoFocus />
              </div>
            )}
            <div className="flex flex-col gap-3">
              <button onClick={handleVerificationProceed} className="w-full py-5 bg-asis-primary !text-[#0000bf] font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs">
                {verificationModal.stage === 'confirm' ? 'Sahkan Tindakan' : 'Sahkan Akses'}
              </button>
              <button onClick={() => setVerificationModal(prev => ({ ...prev, show: false }))} className="w-full py-4 bg-asis-bg text-asis-text font-black rounded-2xl hover:opacity-80 transition-all uppercase tracking-widest text-[10px]">Batal</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-asis-card p-8 rounded-[2.5rem] border border-asis-border shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 transition-colors">
        <div><h2 className="text-3xl font-black tracking-tight">{t('adm_title')}</h2><p className="opacity-60 mt-1 font-black italic uppercase text-[10px] tracking-widest">Pusat Kawalan Pentadbir</p></div>
        <div className="flex bg-asis-bg/50 p-1.5 rounded-2xl border border-asis-border">
          {(['students', 'teachers', 'system'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-asis-primary shadow-sm' : 'opacity-40 hover:opacity-100'}`}>
              {tab === 'students' ? t('adm_tab_students') : tab === 'teachers' ? t('adm_tab_teachers') : t('adm_tab_system')}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'teachers' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
           {showAddTeacher && renderTeacherForm(true)}
           {editingTeacherId && renderTeacherForm(false)}
           <div className="bg-asis-card p-10 rounded-[3rem] border border-asis-border shadow-xl">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
               <div><h3 className="text-2xl font-black">{t('adm_teacher_dir')}</h3><p className="text-xs opacity-40 font-black uppercase tracking-widest">Urus akses guru ke dalam sistem</p></div>
               <div className="flex gap-3">
                 <input type="text" placeholder="Cari guru..." className="md:w-64 bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-3 font-black outline-none focus:border-asis-primary" value={teacherSearchQuery} onChange={e => setTeacherSearchQuery(e.target.value)} />
                 <button onClick={() => { setEditingTeacherId(null); setShowAddTeacher(true); }} className="px-6 py-3 bg-asis-primary !text-[#0000bf] font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg">Tambah Guru</button>
               </div>
             </div>
             <div className="space-y-4">
               {filteredTeachers.map(tProfile => (
                 <div key={tProfile.id} className="p-6 border-2 border-asis-border rounded-[2rem] flex items-center justify-between hover:bg-asis-bg/10 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-asis-bg rounded-2xl flex items-center justify-center font-black text-asis-text/30 text-xl overflow-hidden">
                        {tProfile.avatar ? <img src={tProfile.avatar} className="w-full h-full object-cover" alt="" /> : tProfile.name[0]}
                      </div>
                      <div>
                        <p className="font-black text-lg">{tProfile.name}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {tProfile.roles.map(r => <span key={r} className="text-[8px] font-black uppercase tracking-widest bg-asis-primary/20 px-2 py-0.5 rounded-md">{r}</span>)}
                          {tProfile.isAdmin && <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-600 px-2 py-0.5 rounded-md">Admin</span>}
                          <span className="text-[8px] font-black uppercase tracking-widest bg-asis-bg/50 px-2 py-0.5 rounded-md opacity-40">@{tProfile.staffId}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditTeacher(tProfile)} className="px-4 py-2 bg-asis-bg text-asis-text border border-asis-border font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-asis-primary transition-all">Edit</button>
                      {tProfile.id !== teacher.id && (
                        <button onClick={() => startVerification(() => onRemoveTeacher(tProfile.id), "Padam Guru", `Hapus akses sistem untuk ${tProfile.name}?`)} className="p-2.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                      )}
                    </div>
                 </div>
               ))}
             </div>
           </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
           {showAddStudent && (
             <div className="bg-asis-card p-10 rounded-[3rem] border border-asis-border shadow-xl space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black">{t('adm_reg_new')}</h3>
                  <button onClick={() => setShowAddStudent(false)} className="opacity-40 hover:opacity-100"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
                <form onSubmit={handleAddStudentSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">{t('adm_f_name')}</label>
                      <input className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black" placeholder={t('adm_f_name')} value={newStudentForm.firstName} onChange={e => setNewStudentForm({...newStudentForm, firstName: e.target.value})} required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">{t('adm_sep')}</label>
                      <select className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black" value={newStudentForm.separator} onChange={e => setNewStudentForm({...newStudentForm, separator: e.target.value})}>
                        {NAME_SEPARATORS.map(sep => <option key={sep.value} value={sep.value}>{sep.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">{t('adm_l_name')}</label>
                      <input className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black" placeholder={t('adm_l_name')} value={newStudentForm.lastName} onChange={e => setNewStudentForm({...newStudentForm, lastName: e.target.value})} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">{t('adm_house')}</label>
                      <select className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black" value={newStudentForm.house} onChange={e => setNewStudentForm({...newStudentForm, house: e.target.value})}>
                        {HOUSES.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">{t('grade_prefix')}</label>
                      <select className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black" value={newStudentForm.grade} onChange={e => {
                        const grade = Number(e.target.value);
                        setNewStudentForm({...newStudentForm, grade, classGroup: `${grade} ${newStudentForm.classGroup.split(' ')[1]}`});
                      }}>
                        {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">{t('dash_filter_class')}</label>
                      <select className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black" value={newStudentForm.classGroup.split(' ')[1]} onChange={e => setNewStudentForm({...newStudentForm, classGroup: `${newStudentForm.grade} ${e.target.value}`})}>
                        {CLASS_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-asis-border">
                    <button type="button" onClick={() => setShowAddStudent(false)} className="px-8 py-4 font-black opacity-40">Batal</button>
                    <button type="submit" className="px-10 py-4 bg-asis-primary !text-[#0000bf] font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest">Daftar Murid</button>
                  </div>
                </form>
             </div>
           )}

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-asis-card p-10 rounded-[3rem] border border-asis-border shadow-xl">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                   <div><h3 className="text-2xl font-black">{t('adm_tab_students')}</h3><p className="text-xs opacity-40 font-black uppercase tracking-widest">Pangkalan Data Murid</p></div>
                   <button onClick={() => setShowAddStudent(true)} className="px-6 py-3 bg-asis-primary !text-[#0000bf] font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg">Tambah Baru</button>
                 </div>
                 <div className="space-y-4">
                   <input type="text" placeholder="Cari murid..." className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-3 font-black outline-none focus:border-asis-primary mb-4" value={studentSearchQuery} onChange={e => setStudentSearchQuery(e.target.value)} />
                   {filteredStudents.map(s => (
                     <div key={s.id} className="p-4 border-2 border-asis-border rounded-[2rem] flex items-center justify-between hover:bg-asis-bg/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <img src={s.avatar} className="w-12 h-12 rounded-2xl object-cover" alt="" />
                          <div><p className="font-black text-sm">{s.firstName} {s.lastName}</p><p className="text-[9px] opacity-40 uppercase font-black tracking-widest">F{s.grade} • {s.classGroup}</p></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => onSelectStudent(s.id)} className="px-4 py-2 bg-asis-primary !text-[#0000bf] text-[9px] font-black uppercase rounded-xl">Profil</button>
                          <button onClick={() => startVerification(() => onRemoveStudent(s.id), "Padam Murid", `Padam rekod ${s.firstName}?`)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                        </div>
                     </div>
                   ))}
                 </div>
              </div>

              <div className="space-y-8">
                 <div className="bg-asis-card p-10 rounded-[3rem] border border-asis-border shadow-xl">
                    <h3 className="text-2xl font-black mb-6 flex items-center gap-4"><div className="w-2 h-8 bg-emerald-500 rounded-full"></div>{t('adm_bulk_tools')}</h3>
                    <div className="space-y-4">
                       <div className="p-6 bg-asis-bg/30 rounded-3xl border border-asis-border flex items-center justify-between gap-4">
                          <div><h4 className="font-black text-lg">{t('adm_promotion')}</h4><p className="text-[10px] opacity-40 uppercase font-black tracking-widest">{t('adm_promotion_desc')}</p></div>
                          <button onClick={() => startVerification(handleFormPromotion, "Promosi Murid", "Adakah anda pasti mahu menaikkan semua murid ke tingkatan seterusnya?")} className="px-6 py-3 bg-asis-text text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all">Laksanakan</button>
                       </div>
                       <div className="p-6 bg-asis-bg/30 rounded-3xl border border-asis-border flex items-center justify-between gap-4">
                          <div><h4 className="font-black text-lg">{t('adm_add_batch')}</h4><p className="text-[10px] opacity-40 uppercase font-black tracking-widest">{t('adm_add_batch_desc')}</p></div>
                          <button onClick={() => startVerification(() => onAddBatch(100), "Tambah Murid", "Jana 100 murid baharu (Tingkatan 1)?")} className="px-6 py-3 bg-asis-primary !text-[#0000bf] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">Jana Batch</button>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
           <div className="bg-asis-card p-10 rounded-[3rem] border border-asis-border shadow-xl space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black flex items-center gap-4">
                    <div className="w-3 h-10 bg-emerald-500 rounded-full"></div>
                    {t('sync_title')}
                  </h3>
                  <p className="opacity-60 text-sm font-medium italic">{t('sync_desc')}</p>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black opacity-40 uppercase tracking-widest block ml-1">{t('sync_token_label')}</label>
                <textarea 
                  className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-mono text-xs outline-none focus:border-asis-primary h-32"
                  placeholder={t('sync_token_placeholder')}
                  value={syncTokenInput}
                  onChange={(e) => setSyncTokenInput(e.target.value)}
                ></textarea>
                <div className="flex gap-4">
                  <button onClick={exportSyncToken} className="flex-1 py-4 bg-asis-text text-white font-black rounded-2xl shadow-xl uppercase text-[10px] tracking-widest">Salin Token (Export)</button>
                  <button onClick={importSyncToken} className="flex-1 py-4 bg-asis-primary !text-[#0000bf] font-black rounded-2xl shadow-xl uppercase text-[10px] tracking-widest">Muat Token (Import)</button>
                </div>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="bg-asis-card p-10 rounded-[3rem] border border-asis-border shadow-xl space-y-8">
               <h3 className="text-2xl font-black flex items-center gap-3"><div className="w-2 h-8 bg-asis-primary rounded-full"></div>Warna Tingkatan</h3>
               <div className="grid grid-cols-2 gap-4">
                 {GRADES.map(g => (
                   <div key={g} className="flex items-center justify-between p-4 bg-asis-bg/20 rounded-2xl border border-asis-border">
                     <span className="font-black text-xs uppercase tracking-widest">Form {g}</span>
                     <input type="color" className="w-10 h-10 border-none bg-transparent cursor-pointer" value={batchColors[g]} onChange={e => onUpdateColors({...batchColors, [g]: e.target.value})} />
                   </div>
                 ))}
               </div>
             </div>
             <div className="bg-asis-card p-10 rounded-[3rem] border border-asis-border shadow-xl space-y-8">
               <h3 className="text-2xl font-black flex items-center gap-3"><div className="w-2 h-8 bg-rose-500 rounded-full"></div>Zon Bahaya</h3>
               <button onClick={() => startVerification(onClearAll, "Padam Semua Murid", "Hapus SEMUA rekod murid dari pangkalan data peranti ini?")} className="w-full py-4 bg-rose-600 !text-white font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest">Kosongkan Pangkalan Data</button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
