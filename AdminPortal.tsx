
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
  onImportBackup: (data: any) => void;
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
  
  const [verificationModal, setVerificationModal] = useState<{
    show: boolean; stage: 'confirm' | 'password'; action: () => void; title: string; message: string;
  }>({ show: false, stage: 'confirm', action: () => {}, title: '', message: '' });
  const [verificationPassword, setVerificationPassword] = useState('');

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({ firstName: '', separator: NAME_SEPARATORS[0].value, lastName: '', grade: 1, classGroup: `1 ${CLASS_NAMES[0]}`, house: HOUSES[0] });

  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [teacherForm, setTeacherForm] = useState({
    title: TEACHER_TITLES[0], firstName: '', separator: TEACHER_SEPARATORS[0], lastName: '',
    roles: [TEACHER_ROLES[TEACHER_ROLES.length - 1]], subjects: [] as string[],
    email: '', staffId: '', password: '', isAdmin: false
  });

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
    const sepStr = (newStudentForm.separator === '' || !newStudentForm.separator) ? ' ' : ` ${newStudentForm.separator} `;
    onAddStudent({
      firstName: newStudentForm.firstName,
      lastName: `${sepStr}${newStudentForm.lastName}`.trim(),
      grade: newStudentForm.grade,
      classGroup: newStudentForm.classGroup,
      house: newStudentForm.house,
    });
    setShowAddStudent(false);
  };

  const toggleTeacherFormItem = (type: 'roles' | 'subjects', item: string) => {
    setTeacherForm(prev => {
      const list = prev[type].includes(item) ? prev[type].filter(i => i !== item) : [...prev[type], item];
      return { ...prev, [type]: list };
    });
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sepStr = (teacherForm.separator === '(none)' || !teacherForm.separator) ? ' ' : ` ${teacherForm.separator} `;
    const fullName = `${teacherForm.title} ${teacherForm.firstName}${sepStr}${teacherForm.lastName}`.replace(/\s+/g, ' ').trim();

    if (editingTeacherId) {
      const existing = allTeachers.find(t => t.id === editingTeacherId);
      if (existing) {
        onUpdateTeacher({
          ...existing, name: fullName, roles: teacherForm.roles, subjects: teacherForm.subjects,
          email: teacherForm.email, staffId: teacherForm.staffId, isAdmin: teacherForm.isAdmin,
          password: teacherForm.password || existing.password
        });
      }
      setEditingTeacherId(null);
    } else {
      const id = teacherForm.staffId || `GURU-${Math.floor(1000 + Math.random() * 9000)}`;
      onAddTeacher({
        id, staffId: id, name: fullName, roles: teacherForm.roles, email: teacherForm.email,
        department: 'Pentadbiran', meritsGiven: 0, demeritsGiven: 0, avatar: '',
        subjects: teacherForm.subjects, isAdmin: teacherForm.isAdmin, 
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">E-mel</label>
            <input className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black" placeholder="guru@asis.edu.my" type="email" value={teacherForm.email} onChange={e => setTeacherForm({...teacherForm, email: e.target.value})} required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Username (ID Staf)</label>
            <input className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black" placeholder="GURU-9901" value={teacherForm.staffId} onChange={e => setTeacherForm({...teacherForm, staffId: e.target.value})} required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Kata Laluan</label>
            <input className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black" placeholder="••••••••" type="password" value={teacherForm.password} onChange={e => setTeacherForm({...teacherForm, password: e.target.value})} required={isNew} />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1 block">Jawatan Guru</label>
          <div className="flex flex-wrap gap-2">
            {TEACHER_ROLES.map(role => (
              <button key={role} type="button" onClick={() => toggleTeacherFormItem('roles', role)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${teacherForm.roles.includes(role) ? 'bg-asis-primary border-asis-primary' : 'bg-asis-bg/30 border-asis-border opacity-40 hover:opacity-100'}`}>{role}</button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="adminCheckbox" className="w-5 h-5 accent-asis-primary" checked={teacherForm.isAdmin} onChange={e => setTeacherForm(prev => ({ ...prev, isAdmin: e.target.checked }))} />
          <label htmlFor="adminCheckbox" className="text-xs font-black uppercase tracking-widest opacity-60 cursor-pointer">Beri Akses Admin</label>
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
              <input type="password" placeholder="Kata Laluan Sekolah" className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black mb-6 text-center" value={verificationPassword} onChange={e => setVerificationPassword(e.target.value)} autoFocus />
            )}
            <div className="flex flex-col gap-3">
              <button onClick={handleVerificationProceed} className="w-full py-5 bg-asis-primary !text-[#0000bf] font-black rounded-2xl uppercase tracking-widest text-xs">{verificationModal.stage === 'confirm' ? 'Sahkan' : 'Sahkan Akses'}</button>
              <button onClick={() => setVerificationModal(prev => ({ ...prev, show: false }))} className="w-full py-4 bg-asis-bg text-asis-text font-black rounded-2xl uppercase tracking-widest text-[10px]">Batal</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-asis-card p-8 rounded-[2.5rem] border border-asis-border shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 transition-colors">
        <div><h2 className="text-3xl font-black tracking-tight">{t('adm_title')}</h2><p className="opacity-60 mt-1 font-black italic uppercase text-[10px] tracking-widest">Sekolah Menengah Sains Alam Shah</p></div>
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
               <div><h3 className="text-2xl font-black">{t('adm_teacher_dir')}</h3><p className="text-xs opacity-40 font-black uppercase tracking-widest">Pengurusan Akses Staf</p></div>
               <button onClick={() => { setEditingTeacherId(null); setShowAddTeacher(true); }} className="px-6 py-3 bg-asis-primary !text-[#0000bf] font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg">Tambah Guru</button>
             </div>
             <div className="space-y-4">
               {filteredTeachers.map(tp => (
                 <div key={tp.id} className="p-6 border-2 border-asis-border rounded-[2rem] flex items-center justify-between hover:bg-asis-bg/10 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-asis-bg rounded-2xl flex items-center justify-center font-black text-asis-text/30 text-xl overflow-hidden">
                        {tp.avatar ? <img src={tp.avatar} className="w-full h-full object-cover" /> : tp.name[0]}
                      </div>
                      <div>
                        <p className="font-black text-lg">{tp.name}</p>
                        <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">@{tp.staffId} • {tp.roles[0]}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditTeacher(tp)} className="px-4 py-2 bg-asis-bg border border-asis-border font-black text-[10px] uppercase rounded-xl hover:bg-asis-primary transition-all">Edit</button>
                      {tp.id !== teacher.id && (
                        <button onClick={() => startVerification(() => onRemoveTeacher(tp.id), "Padam Guru", `Hapus rekod ${tp.name}?`)} className="p-2.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
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
                    <input className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black" placeholder={t('adm_f_name')} value={newStudentForm.firstName} onChange={e => setNewStudentForm({...newStudentForm, firstName: e.target.value})} required />
                    <select className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black" value={newStudentForm.separator} onChange={e => setNewStudentForm({...newStudentForm, separator: e.target.value})}>
                      {NAME_SEPARATORS.map(sep => <option key={sep.value} value={sep.value}>{sep.label}</option>)}
                    </select>
                    <input className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black" placeholder={t('adm_l_name')} value={newStudentForm.lastName} onChange={e => setNewStudentForm({...newStudentForm, lastName: e.target.value})} required />
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-asis-border">
                    <button type="button" onClick={() => setShowAddStudent(false)} className="px-8 py-4 font-black opacity-40 uppercase text-xs">Batal</button>
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
                         <img src={s.avatar} className="w-12 h-12 rounded-2xl object-cover" />
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
                      <button onClick={() => startVerification(() => { onBulkReassign(students.reduce((acc, s) => ({...acc, [s.id]: { grade: s.grade + 1, classGroup: `${s.grade+1} ${s.classGroup.split(' ')[1]}` }}), {})); alert('Kenaikan selesai!'); }, "Promosi Murid", "Naikkan semua murid ke tingkatan seterusnya?")} className="w-full p-6 bg-asis-bg/30 rounded-3xl border border-asis-border flex items-center justify-between hover:bg-asis-primary transition-all group">
                         <div className="text-left"><h4 className="font-black text-lg group-hover:text-[#0000bf]">{t('adm_promotion')}</h4><p className="text-[10px] opacity-40 uppercase font-black tracking-widest">{t('adm_promotion_desc')}</p></div>
                         <svg className="w-6 h-6 opacity-40 group-hover:text-[#0000bf]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                      </button>
                      <button onClick={() => startVerification(() => onAddBatch(100), "Tambah Murid", "Jana 100 murid baharu (Tingkatan 1)?")} className="w-full p-6 bg-asis-bg/30 rounded-3xl border border-asis-border flex items-center justify-between hover:bg-asis-primary transition-all group">
                         <div className="text-left"><h4 className="font-black text-lg group-hover:text-[#0000bf]">{t('adm_add_batch')}</h4><p className="text-[10px] opacity-40 uppercase font-black tracking-widest">{t('adm_add_batch_desc')}</p></div>
                         <svg className="w-6 h-6 opacity-40 group-hover:text-[#0000bf]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                      </button>
                   </div>
                </div>
             </div>
           </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
           <div className="bg-asis-card p-10 rounded-[3rem] border border-asis-border shadow-xl space-y-8">
              <h3 className="text-2xl font-black flex items-center gap-4"><div className="w-3 h-10 bg-emerald-500 rounded-full"></div>{t('sync_title')}</h3>
              <p className="opacity-60 text-sm font-medium italic">{t('sync_desc')}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={onCloudPush} disabled={isSyncing} className="p-8 bg-asis-text text-white rounded-3xl font-black shadow-xl uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                  <div className="flex flex-col items-center gap-4">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                    {t('sync_push')}
                  </div>
                </button>
                <button onClick={onCloudPull} disabled={isSyncing} className="p-8 bg-asis-primary !text-[#0000bf] rounded-3xl font-black shadow-xl uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                  <div className="flex flex-col items-center gap-4">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/></svg>
                    {t('sync_pull')}
                  </div>
                </button>
              </div>
              <div className="text-center pt-4"><p className="text-[10px] font-black uppercase opacity-30 tracking-widest">{t('sync_last')}: {lastSync ? new Date(lastSync).toLocaleString() : 'Pernah'}</p></div>
           </div>
           
           <div className="bg-asis-card p-10 rounded-[3rem] border border-asis-border shadow-xl space-y-8">
              <h3 className="text-2xl font-black flex items-center gap-3"><div className="w-2 h-8 bg-rose-500 rounded-full"></div>Padam Data</h3>
              <button onClick={() => startVerification(onClearAll, "Padam Semua", "Hapus SEMUA data dari peranti ini?")} className="w-full py-4 bg-rose-600 text-white font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest">Kosongkan Pangkalan Data</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
