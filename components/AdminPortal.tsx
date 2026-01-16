
import React, { useState, useMemo } from 'react';
import { HOUSES, GRADES, CLASS_NAMES, TEACHER_TITLES, TEACHER_SEPARATORS } from '../constants';
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
  const [newStudentForm, setNewStudentForm] = useState({ firstName: '', lastName: '', grade: 1, classGroup: `1 ${CLASS_NAMES[0]}`, house: HOUSES[0] });

  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [newTeacherAccount, setNewTeacherAccount] = useState<{ id: string; pass: string } | null>(null);
  const [newTeacherForm, setNewTeacherForm] = useState({
    title: TEACHER_TITLES[0], firstName: '', separator: TEACHER_SEPARATORS[0], lastName: '',
    roles: ['Guru Biasa'], subjects: [] as string[], email: '', department: 'Akademik', isAdmin: false
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

  const handleAddTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `GURU-${Math.floor(1000 + Math.random() * 9000)}`;
    const pass = Math.random().toString(36).slice(-8);
    const sepStr = newTeacherForm.separator === '(none)' ? '' : ` ${newTeacherForm.separator} `;
    const fullName = `${newTeacherForm.title} ${newTeacherForm.firstName}${sepStr}${newTeacherForm.lastName}`.trim();
    
    onAddTeacher({
      id, staffId: id, name: fullName, roles: newTeacherForm.roles, email: newTeacherForm.email,
      department: newTeacherForm.department, meritsGiven: 0, demeritsGiven: 0, avatar: '',
      subjects: newTeacherForm.subjects, isAdmin: newTeacherForm.isAdmin, password: pass
    });
    setNewTeacherAccount({ id, pass });
    setNewTeacherForm({ title: TEACHER_TITLES[0], firstName: '', separator: TEACHER_SEPARATORS[0], lastName: '', roles: ['Guru Biasa'], subjects: [], email: '', department: 'Akademik', isAdmin: false });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 text-asis-text transition-colors duration-300">
      {/* Verification Modal */}
      {verificationModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-asis-card rounded-[3rem] shadow-2xl max-w-md w-full p-10 text-center border-t-8 border-rose-600 border border-asis-border">
            <h3 className="text-2xl font-black mb-3 text-rose-600">{verificationModal.title}</h3>
            <p className="opacity-60 font-medium leading-relaxed mb-8">{verificationModal.message}</p>
            {verificationModal.stage === 'password' && (
              <div className="mb-8 text-left">
                <label className="text-[10px] font-black opacity-40 uppercase tracking-widest block mb-2">School Admin Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black outline-none focus:border-rose-600 text-center tracking-widest" value={verificationPassword} onChange={e => setVerificationPassword(e.target.value)} autoFocus />
              </div>
            )}
            <div className="flex flex-col gap-3">
              <button onClick={handleVerificationProceed} className="w-full py-5 bg-asis-primary !text-[#0000bf] font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs">
                {verificationModal.stage === 'confirm' ? 'Confirm Action' : 'Authorize Action'}
              </button>
              <button onClick={() => setVerificationModal(prev => ({ ...prev, show: false }))} className="w-full py-4 bg-asis-bg text-asis-text font-black rounded-2xl hover:opacity-80 transition-all uppercase tracking-widest text-[10px]">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Header */}
      <div className="bg-asis-card p-8 rounded-[2.5rem] border border-asis-border shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 transition-colors">
        <div><h2 className="text-3xl font-black tracking-tight">{t('adm_title')}</h2><p className="opacity-60 mt-1 font-black italic uppercase text-[10px] tracking-widest">Administrator: {teacher.name}</p></div>
        <div className="flex bg-asis-bg/50 p-1.5 rounded-2xl border border-asis-border">
          {(['students', 'teachers', 'system'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-asis-primary shadow-sm' : 'opacity-40 hover:opacity-100'}`}>
              {tab === 'students' ? 'Pengurusan Murid' : tab === 'teachers' ? 'Pengurusan Guru' : 'Tetapan Sistem'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'system' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
           {/* Cloud Sync Center Info */}
           <div className="bg-asis-card p-10 rounded-[3rem] border border-asis-border shadow-xl space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black flex items-center gap-4">
                    <div className="w-3 h-10 bg-emerald-500 rounded-full"></div>
                    Auto-Sync Aktif
                  </h3>
                  <p className="opacity-60 text-sm font-medium italic">Sistem akan menolak (Push) data secara automatik setiap kali perubahan dibuat.</p>
                </div>
                {lastSync > 0 && (
                  <div className="text-right">
                    <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">Kemas kini Terakhir</p>
                    <p className="text-xs font-black">{new Date(lastSync).toLocaleString()}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={onCloudPush}
                  disabled={isSyncing}
                  className="group relative overflow-hidden p-8 bg-asis-primary rounded-[2rem] shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="w-14 h-14 bg-white/30 rounded-2xl flex items-center justify-center text-[#0000bf]">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-[#0000bf] uppercase tracking-widest">Paksa Tolak (Push)</p>
                      <p className="text-xs text-[#0000bf]/60 font-medium">Hantar manual data sekarang.</p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={onCloudPull}
                  disabled={isSyncing}
                  className="group relative overflow-hidden p-8 bg-asis-text rounded-[2rem] shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-white uppercase tracking-widest">Tarik Perubahan (Pull)</p>
                      <p className="text-xs text-white/40 font-medium">Kemas kini data dari guru lain.</p>
                    </div>
                  </div>
                </button>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="bg-asis-card p-10 rounded-[3rem] border border-asis-border shadow-xl space-y-8">
               <h3 className="text-2xl font-black flex items-center gap-3"><div className="w-2 h-8 bg-asis-primary rounded-full"></div>Warna Kategori (Form)</h3>
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
               <h3 className="text-2xl font-black flex items-center gap-3"><div className="w-2 h-8 bg-rose-500 rounded-full"></div>Bahaya & Pembersihan</h3>
               <button onClick={() => startVerification(onClearAll, "Padam Semua Murid", "Hapus SEMUA rekod murid dari pangkalan data?")} className="w-full py-4 bg-rose-600 !text-white font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest">Kosongkan Database</button>
             </div>
           </div>
        </div>
      )}

      {activeTab === 'teachers' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
           {showAddTeacher && (
             <div className="bg-asis-card p-10 rounded-[3rem] border border-asis-border shadow-xl space-y-8">
                <h3 className="text-2xl font-black">Daftar Guru Baharu</h3>
                <form onSubmit={handleAddTeacherSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <input className="bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black" placeholder="Nama Pertama" value={newTeacherForm.firstName} onChange={e => setNewTeacherForm({...newTeacherForm, firstName: e.target.value})} required />
                    <input className="bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black" placeholder="E-mel Rasmi" type="email" value={newTeacherForm.email} onChange={e => setNewTeacherForm({...newTeacherForm, email: e.target.value})} required />
                    <input className="bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black" placeholder="Jabatan" value={newTeacherForm.department} onChange={e => setNewTeacherForm({...newTeacherForm, department: e.target.value})} />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setShowAddTeacher(false)} className="px-8 py-4 font-black opacity-40">Batal</button>
                    <button type="submit" className="px-10 py-4 bg-asis-primary !text-[#0000bf] font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest">Simpan Guru</button>
                  </div>
                </form>
             </div>
           )}

           {newTeacherAccount && (
             <div className="bg-emerald-500 p-10 rounded-[3rem] text-white shadow-xl space-y-4 animate-in zoom-in-95">
               <h3 className="text-2xl font-black">Akaun Guru Berjaya Dicipta</h3>
               <p className="font-bold opacity-80">Sila salin maklumat log masuk ini untuk guru tersebut:</p>
               <div className="bg-black/20 p-6 rounded-2xl space-y-2 font-mono text-lg">
                 <p>ID Staf: <span className="font-black text-white">{newTeacherAccount.id}</span></p>
                 <p>K. Laluan: <span className="font-black text-white">{newTeacherAccount.pass}</span></p>
               </div>
               <button onClick={() => setNewTeacherAccount(null)} className="px-8 py-3 bg-white text-emerald-600 font-black rounded-xl uppercase text-xs">Tutup & Teruskan</button>
             </div>
           )}

           <div className="bg-asis-card p-10 rounded-[3rem] border border-asis-border shadow-xl">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
               <div><h3 className="text-2xl font-black">Direktori Guru</h3><p className="text-xs opacity-40 font-black uppercase tracking-widest">Urus akses guru ke dalam sistem</p></div>
               <div className="flex gap-3">
                 <input type="text" placeholder="Cari guru..." className="md:w-64 bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-3 font-black outline-none focus:border-asis-primary" value={teacherSearchQuery} onChange={e => setTeacherSearchQuery(e.target.value)} />
                 <button onClick={() => setShowAddTeacher(true)} className="px-6 py-3 bg-asis-primary !text-[#0000bf] font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg">Tambah Guru</button>
               </div>
             </div>
             <div className="space-y-4">
               {filteredTeachers.map(t => (
                 <div key={t.id} className="p-6 border-2 border-asis-border rounded-[2rem] flex items-center justify-between hover:bg-asis-bg/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-asis-bg rounded-xl flex items-center justify-center font-black text-asis-text/30">{t.name[0]}</div>
                      <div><p className="font-black text-lg">{t.name}</p><p className="text-[10px] opacity-40 uppercase font-black tracking-widest">{t.staffId} • {t.department}</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                      {t.id !== teacher.id && (
                        <button onClick={() => startVerification(() => onRemoveTeacher(t.id), "Padam Guru", `Hapus akses sistem untuk ${t.name}?`)} className="p-2.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
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
                <h3 className="text-2xl font-black">{t('adm_reg_new')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input className="bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black" placeholder={t('adm_f_name')} value={newStudentForm.firstName} onChange={e => setNewStudentForm({...newStudentForm, firstName: e.target.value})} />
                  <input className="bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black" placeholder={t('adm_l_name')} value={newStudentForm.lastName} onChange={e => setNewStudentForm({...newStudentForm, lastName: e.target.value})} />
                </div>
                <div className="flex justify-end gap-3"><button onClick={() => setShowAddStudent(false)} className="px-8 py-4 font-black opacity-40">Batal</button><button onClick={() => { onAddStudent(newStudentForm); setShowAddStudent(false); }} className="px-10 py-4 bg-asis-primary !text-[#0000bf] font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest">Daftar Murid</button></div>
             </div>
           )}

           <div className="bg-asis-card p-10 rounded-[3rem] border border-asis-border shadow-xl">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
               <div><h3 className="text-2xl font-black">Direktori & Pengurusan Murid</h3><p className="text-xs opacity-40 font-black uppercase tracking-widest">Kemas kini profil atau padam rekod</p></div>
               <div className="flex gap-3">
                 <input type="text" placeholder="Cari murid..." className="md:w-64 bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-3 font-black outline-none focus:border-asis-primary" value={studentSearchQuery} onChange={e => setStudentSearchQuery(e.target.value)} />
                 <button onClick={() => setShowAddStudent(true)} className="px-6 py-3 bg-asis-primary !text-[#0000bf] font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg">Tambah Baru</button>
               </div>
             </div>
             <div className="space-y-4">
               {filteredStudents.map(s => (
                 <div key={s.id} className="p-6 border-2 border-asis-border rounded-[2rem] flex items-center justify-between hover:bg-asis-bg/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <img src={s.avatar} className="w-14 h-14 rounded-2xl object-cover" alt="" />
                      <div><p className="font-black text-lg">{s.firstName} {s.lastName}</p><p className="text-[10px] opacity-40 uppercase font-black tracking-widest">F{s.grade} {s.classGroup.split(' ')[1]} • {s.house}</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => onSelectStudent(s.id)} className="px-5 py-2.5 bg-asis-primary !text-[#0000bf] text-[10px] font-black uppercase rounded-xl">Edit</button>
                      <button onClick={() => startVerification(() => onRemoveStudent(s.id), "Padam Murid", `Padam rekod ${s.firstName} secara kekal?`)} className="p-2.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                    </div>
                 </div>
               ))}
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
