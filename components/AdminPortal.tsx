
import React, { useState, useMemo, useEffect } from 'react';
import { HOUSES, GRADES, CLASS_NAMES, TEACHER_TITLES, NAME_SEPARATORS, TEACHER_ROLES } from '../constants';
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
  onProcessYearEnd: () => void;
  onAddBatch: (count: number) => void;
  onClearAll: () => void;
  onAddStudent: (newStudent: Omit<Student, 'id' | 'records' | 'totalPoints' | 'avatar'>) => void;
  onUpdateStudent: (updatedStudent: Student) => void;
  onRemoveStudent: (id: string) => void;
  onCloudPush: () => void;
  onCloudPull: () => void;
  lastSync: number;
  isSyncing: boolean;
  t: (key: any) => string;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ 
  students, batchColors, teacher, allTeachers, onSelectStudent, onUpdateTeacher, onAddTeacher, onRemoveTeacher, 
  onUpdateColors, onProcessYearEnd, onAddBatch, onClearAll, onAddStudent, onUpdateStudent, onRemoveStudent, 
  onCloudPush, onCloudPull, lastSync, isSyncing, t 
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'system'>('students');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentGradeFilter, setStudentGradeFilter] = useState<number | 'all'>('all');
  
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherProfile | null>(null);
  const [teacherForm, setTeacherForm] = useState({ title: 'Encik', firstName: '', separator: 'bin', lastName: '', staffId: '', password: 'password123', role: 'Guru Biasa', isAdmin: false });

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState({ firstName: '', separator: 'bin', lastName: '', grade: 1, classSuffix: 'Amanah', house: 'Temenggong' });

  // Sync forms
  useEffect(() => {
    if (editingTeacher) {
      const parts = editingTeacher.name.split(' ');
      setTeacherForm({
        title: parts[0] || 'Encik', firstName: parts[1] || '', separator: parts[2] || 'bin', lastName: parts.slice(3).join(' ') || '',
        staffId: editingTeacher.staffId, password: editingTeacher.password || 'password123', role: editingTeacher.roles[0] || 'Guru Biasa', isAdmin: editingTeacher.isAdmin
      });
    } else {
      setTeacherForm({ title: 'Encik', firstName: '', separator: 'bin', lastName: '', staffId: '', password: 'password123', role: 'Guru Biasa', isAdmin: false });
    }
  }, [editingTeacher, showTeacherModal]);

  useEffect(() => {
    if (editingStudent) {
      const lastNameClean = editingStudent.lastName.replace(/^(bin|binti|a\/l|a\/p|anak)\s+/, '').trim();
      const separatorFound = editingStudent.lastName.match(/^(bin|binti|a\/l|a\/p|anak)/)?.[0] || 'bin';
      setStudentForm({
        firstName: editingStudent.firstName, separator: separatorFound, lastName: lastNameClean,
        grade: editingStudent.grade, classSuffix: editingStudent.classGroup.split(' ').slice(1).join(' ') || 'Amanah', house: editingStudent.house
      });
    } else {
      setStudentForm({ firstName: '', separator: 'bin', lastName: '', grade: 1, classSuffix: 'Amanah', house: 'Temenggong' });
    }
  }, [editingStudent, showStudentModal]);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.toLowerCase().trim();
    return students.filter(s => {
      const name = `${s.firstName} ${s.lastName}`.toLowerCase();
      return name.includes(q) && (studentGradeFilter === 'all' || s.grade === studentGradeFilter);
    }); // Limit removed to show all as requested
  }, [students, studentSearch, studentGradeFilter]);

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${teacherForm.title} ${teacherForm.firstName} ${teacherForm.separator} ${teacherForm.lastName}`.replace(/\s+/g, ' ').trim();
    const payload: TeacherProfile = {
      id: editingTeacher?.id || `T-${Date.now()}-${Math.random()}`,
      staffId: teacherForm.staffId, name: fullName, email: `${teacherForm.staffId.toLowerCase()}@asis.edu.my`,
      password: teacherForm.password, roles: [teacherForm.role], isAdmin: teacherForm.isAdmin, subjects: editingTeacher?.subjects || [], avatar: editingTeacher?.avatar || ''
    };
    if (editingTeacher) onUpdateTeacher(payload); else onAddTeacher(payload);
    setShowTeacherModal(false);
    setEditingTeacher(null);
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      firstName: studentForm.firstName, lastName: `${studentForm.separator} ${studentForm.lastName}`.trim(),
      grade: studentForm.grade, classGroup: `${studentForm.grade} ${studentForm.classSuffix}`, house: studentForm.house
    };
    if (editingStudent) onUpdateStudent({ ...editingStudent, ...payload });
    else onAddStudent(payload);
    setShowStudentModal(false);
    setEditingStudent(null);
  };

  return (
    <div className="space-y-6 sm:space-y-8 text-asis-text pb-24 relative pointer-events-auto">
      {/* Tab Selector */}
      <div className="bg-asis-card p-2 sm:p-4 rounded-[1.5rem] sm:rounded-[2rem] border border-asis-border flex flex-wrap gap-1 sm:gap-2 shadow-xl z-20 relative">
        <button type="button" onClick={() => setActiveTab('students')} className={`flex-1 min-w-[80px] px-2 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase text-[9px] sm:text-[10px] tracking-widest transition-all ${activeTab === 'students' ? 'bg-asis-primary shadow-lg' : 'opacity-40 hover:opacity-100'}`}>Murid</button>
        <button type="button" onClick={() => setActiveTab('teachers')} className={`flex-1 min-w-[80px] px-2 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase text-[9px] sm:text-[10px] tracking-widest transition-all ${activeTab === 'teachers' ? 'bg-asis-primary shadow-lg' : 'opacity-40 hover:opacity-100'}`}>Guru</button>
        <button type="button" onClick={() => setActiveTab('system')} className={`flex-1 min-w-[80px] px-2 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase text-[9px] sm:text-[10px] tracking-widest transition-all ${activeTab === 'system' ? 'bg-asis-primary shadow-lg' : 'opacity-40 hover:opacity-100'}`}>Sistem</button>
      </div>

      {activeTab === 'students' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-xl sm:text-2xl font-black">Pengurusan Murid ({students.length})</h3>
            <button type="button" onClick={() => { setEditingStudent(null); setShowStudentModal(true); }} className="w-full sm:w-auto px-8 py-4 bg-asis-primary !text-[#0000bf] font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl">Daftar Murid Baharu</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Cari murid..." className="w-full px-6 py-4 bg-asis-card border-2 border-asis-border rounded-2xl font-black outline-none focus:border-asis-primary" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
            <select className="w-full px-6 py-4 bg-asis-card border-2 border-asis-border rounded-2xl font-black outline-none focus:border-asis-primary" value={studentGradeFilter} onChange={e => setStudentGradeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
              <option value="all">Semua Tingkatan</option>
              {GRADES.map(g => <option key={g} value={g}>Tingkatan {g}</option>)}
            </select>
          </div>
          <div className="space-y-3">
            {filteredStudents.map(s => (
              <div key={s.id} className="bg-asis-card p-4 sm:p-6 rounded-3xl border border-asis-border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:border-asis-primary transition-colors">
                <div className="flex items-center gap-4">
                  <img src={s.avatar} className="w-12 h-12 rounded-xl object-cover border-2 border-asis-bg shadow-sm" alt="" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black text-sm truncate">{s.firstName} {s.lastName}</h4>
                    <p className="text-[10px] font-bold opacity-40 uppercase tracking-tighter">{s.classGroup} • {s.house}</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={() => onSelectStudent(s.id)} className="flex-1 sm:flex-none px-4 py-2 bg-asis-primary !text-[#0000bf] text-[10px] font-black rounded-xl">PROFIL</button>
                  <button onClick={() => { setEditingStudent(s); setShowStudentModal(true); }} className="flex-1 sm:flex-none px-4 py-2 bg-asis-text text-white text-[10px] font-black rounded-xl">EDIT</button>
                  <button onClick={(e) => { e.stopPropagation(); if(window.confirm(`Hapus murid ${s.firstName}?`)) onRemoveStudent(s.id); }} className="px-3 py-2 text-rose-500 bg-rose-500/10 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'teachers' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-xl sm:text-2xl font-black">Direktori Guru</h3>
            <button type="button" onClick={() => { setEditingTeacher(null); setShowTeacherModal(true); }} className="w-full sm:w-auto px-8 py-4 bg-asis-primary !text-[#0000bf] font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl">Daftar Guru Baharu</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allTeachers.map(tp => (
              <div key={tp.id} className="p-6 bg-asis-card border border-asis-border rounded-[2rem] flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-asis-bg flex items-center justify-center font-black text-asis-text/30 overflow-hidden">
                    {tp.avatar ? <img src={tp.avatar} className="w-full h-full object-cover" /> : tp.name[0]}
                  </div>
                  <div>
                    <p className="font-black text-sm leading-tight">{tp.name}</p>
                    <p className="text-[10px] opacity-40 font-black uppercase tracking-widest">@{tp.staffId} • {tp.roles[0]}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingTeacher(tp); setShowTeacherModal(true); }} className="p-2.5 text-asis-text bg-asis-bg/50 rounded-xl hover:bg-asis-primary transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  </button>
                  {!tp.isAdmin && (
                    <button onClick={() => { if(window.confirm(`Hapus guru ${tp.name}?`)) onRemoveTeacher(tp.id); }} className="p-2.5 text-rose-500 bg-rose-500/10 rounded-xl transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 relative z-10">
          <div className="bg-asis-card p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-asis-border shadow-xl space-y-8">
            <h3 className="text-xl sm:text-2xl font-black flex items-center gap-4"><div className="w-3 h-10 bg-asis-primary rounded-full"></div>Alatan Pukal (Yearly Tools)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-asis-bg/20 border-2 border-asis-border rounded-[2.5rem] flex flex-col items-center text-center space-y-4">
                <h4 className="font-black text-lg">Proses Akhir Tahun</h4>
                <p className="text-[10px] opacity-50 font-bold uppercase tracking-widest">Kenaikan Kelas & Graduasi</p>
                <button type="button" onClick={() => { if(window.confirm("Naikkan semua murid? Murid F5 akan graduasi.")) onProcessYearEnd(); }} className="w-full py-4 bg-asis-text text-white rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 active:bg-asis-primary transition-all">NAIK TINGKATAN</button>
              </div>
              <div className="p-6 bg-asis-bg/20 border-2 border-asis-border rounded-[2.5rem] flex flex-col items-center text-center space-y-4">
                <h4 className="font-black text-lg">Batch Baharu F1</h4>
                <p className="text-[10px] opacity-50 font-bold uppercase tracking-widest">Tambah 110 Murid Baharu</p>
                <button type="button" onClick={() => { if(window.confirm("Tambah 110 murid F1 baharu?")) onAddBatch(110); }} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">TAMBAH 110 MURID</button>
              </div>
            </div>
          </div>

          <div className="bg-asis-card p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-asis-border shadow-xl space-y-8">
            <h3 className="text-xl sm:text-2xl font-black flex items-center gap-4"><div className="w-3 h-10 bg-emerald-500 rounded-full"></div>Awan Sekolah (Global Sync)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button type="button" onClick={onCloudPush} disabled={isSyncing} className="p-6 sm:p-8 bg-asis-text text-white rounded-[2rem] font-black shadow-xl uppercase tracking-widest flex flex-col items-center gap-3 active:scale-95 transition-all">Tolak Data</button>
              <button type="button" onClick={onCloudPull} disabled={isSyncing} className="p-6 sm:p-8 bg-asis-primary !text-[#0000bf] rounded-[2rem] font-black shadow-xl uppercase tracking-widest flex flex-col items-center gap-3 active:scale-95 transition-all">Tarik Data</button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showStudentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto scrolling-touch animate-in fade-in">
          <div className="bg-asis-card rounded-[2.5rem] shadow-2xl w-full max-w-xl p-5 sm:p-8 my-auto border border-asis-border animate-in zoom-in-95 pointer-events-auto">
            <h3 className="text-2xl font-black mb-6">{editingStudent ? 'Kemas Kini' : 'Daftar'} Murid</h3>
            <form onSubmit={handleStudentSubmit} className="space-y-5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Nama Pertama</label>
                <input required className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-5 py-4 font-black outline-none focus:border-asis-primary transition-all" value={studentForm.firstName} onChange={e => setStudentForm({...studentForm, firstName: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Pemisah & Nama Akhir</label>
                <div className="flex gap-2 w-full">
                  <select className="bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-2 font-black outline-none w-24 shrink-0" value={studentForm.separator} onChange={e => setStudentForm({...studentForm, separator: e.target.value})}>
                    {NAME_SEPARATORS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <input required className="flex-1 min-w-0 bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-5 py-4 font-black outline-none focus:border-asis-primary transition-all" value={studentForm.lastName} onChange={e => setStudentForm({...studentForm, lastName: e.target.value})} />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Tingkatan</label>
                  <select className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-5 py-4 font-black outline-none" value={studentForm.grade} onChange={e => setStudentForm({...studentForm, grade: Number(e.target.value)})}>
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Kelas</label>
                  <select className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-5 py-4 font-black outline-none" value={studentForm.classSuffix} onChange={e => setStudentForm({...studentForm, classSuffix: e.target.value})}>
                    {CLASS_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Rumah</label>
                <select className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-5 py-4 font-black outline-none" value={studentForm.house} onChange={e => setStudentForm({...studentForm, house: e.target.value})}>
                  {HOUSES.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-asis-border">
                <button type="button" onClick={() => { setShowStudentModal(false); setEditingStudent(null); }} className="px-8 py-4 font-black opacity-40 uppercase text-[10px] tracking-widest order-2 sm:order-1">Batal</button>
                <button type="submit" className="px-10 py-4 bg-asis-primary !text-[#0000bf] font-black rounded-2xl shadow-xl uppercase text-[10px] tracking-widest order-1 sm:order-2 active:scale-95 transition-all">
                  {editingStudent ? 'KEMAS KINI' : 'DAFTAR MURID'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTeacherModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto scrolling-touch animate-in fade-in">
          <div className="bg-asis-card rounded-[2.5rem] shadow-2xl w-full max-w-xl p-5 sm:p-10 my-auto border border-asis-border animate-in zoom-in-95 pointer-events-auto">
            <h3 className="text-2xl font-black mb-6">{editingTeacher ? 'Kemas Kini' : 'Daftar'} Guru</h3>
            <form onSubmit={handleTeacherSubmit} className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Gelaran</label>
                  <select className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-5 py-4 font-black outline-none" value={teacherForm.title} onChange={e => setTeacherForm({...teacherForm, title: e.target.value})}>
                    {TEACHER_TITLES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Username (ID Staf)</label>
                  <input required className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-5 py-4 font-black outline-none focus:border-asis-primary" value={teacherForm.staffId} onChange={e => setTeacherForm({...teacherForm, staffId: e.target.value})} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Nama Pertama</label>
                <input required className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-5 py-4 font-black outline-none focus:border-asis-primary" value={teacherForm.firstName} onChange={e => setTeacherForm({...teacherForm, firstName: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Pemisah & Nama Akhir</label>
                <div className="flex gap-2 w-full">
                  <select className="bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-2 font-black outline-none w-24 shrink-0" value={teacherForm.separator} onChange={e => setTeacherForm({...teacherForm, separator: e.target.value})}>
                    {NAME_SEPARATORS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <input required className="flex-1 min-w-0 bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-5 py-4 font-black outline-none focus:border-asis-primary transition-all" value={teacherForm.lastName} onChange={e => setTeacherForm({...teacherForm, lastName: e.target.value})} />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Jawatan / Role</label>
                  <select className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-5 py-4 font-black outline-none" value={teacherForm.role} onChange={e => setTeacherForm({...teacherForm, role: e.target.value})}>
                    {TEACHER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Kata Laluan</label>
                  <input required className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-5 py-4 font-black outline-none focus:border-asis-primary" value={teacherForm.password} onChange={e => setTeacherForm({...teacherForm, password: e.target.value})} />
                </div>
              </div>
              <div className="flex items-center gap-4 p-5 bg-asis-bg/20 rounded-2xl border border-asis-border">
                <input type="checkbox" id="admChk" className="w-6 h-6 accent-asis-primary" checked={teacherForm.isAdmin} onChange={e => setTeacherForm({...teacherForm, isAdmin: e.target.checked})} />
                <label htmlFor="admChk" className="text-[10px] font-black uppercase tracking-widest cursor-pointer select-none">Akses Admin</label>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-asis-border">
                <button type="button" onClick={() => { setShowTeacherModal(false); setEditingTeacher(null); }} className="px-8 py-4 font-black opacity-40 uppercase text-[10px] tracking-widest order-2 sm:order-1">Batal</button>
                <button type="submit" className="px-10 py-4 bg-asis-primary !text-[#0000bf] font-black rounded-2xl shadow-xl uppercase text-[10px] tracking-widest order-1 sm:order-2 active:scale-95 transition-all">
                  {editingTeacher ? 'KEMAS KINI' : 'DAFTAR GURU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
