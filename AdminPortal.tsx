
import React, { useState, useMemo } from 'react';
import { HOUSES, GRADES, CLASS_NAMES, TEACHER_TITLES, TEACHER_SEPARATORS, NAME_SEPARATORS, TEACHER_ROLES } from './constants';
import { Student, TeacherProfile } from './types';

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
  students, batchColors, teacher, allTeachers, onSelectStudent, onUpdateTeacher, onAddTeacher, onRemoveTeacher, 
  onUpdateColors, onBulkReassign, onAddBatch, onClearAll, onAddStudent, onRemoveStudent, 
  onCloudPush, onCloudPull, lastSync, isSyncing, t 
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'system'>('students');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentGradeFilter, setStudentGradeFilter] = useState<number | 'all'>('all');
  
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [teacherForm, setTeacherForm] = useState({ title: 'Encik', firstName: '', separator: '(none)', lastName: '', staffId: '', password: '', roles: ['Guru Biasa'], isAdmin: false });

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [studentForm, setStudentForm] = useState({ firstName: '', separator: 'bin', lastName: '', grade: 1, classGroup: '1 Amanah', house: 'Temenggong' });

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentSearch.toLowerCase());
      const matchesGrade = studentGradeFilter === 'all' || s.grade === studentGradeFilter;
      return matchesSearch && matchesGrade;
    }).slice(0, 100);
  }, [students, studentSearch, studentGradeFilter]);

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sepStr = teacherForm.separator === '(none)' ? ' ' : ` ${teacherForm.separator} `;
    const fullName = `${teacherForm.title} ${teacherForm.firstName}${sepStr}${teacherForm.lastName}`.replace(/\s+/g, ' ').trim();
    
    onAddTeacher({
      id: teacherForm.staffId || `T-${Date.now()}`,
      staffId: teacherForm.staffId,
      name: fullName,
      email: `${teacherForm.staffId.toLowerCase()}@asis.edu.my`,
      password: teacherForm.password || 'password123',
      roles: teacherForm.roles,
      isAdmin: teacherForm.isAdmin,
      subjects: [],
      avatar: ''
    });
    setShowAddTeacher(false);
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddStudent({
      firstName: studentForm.firstName,
      lastName: `${studentForm.separator} ${studentForm.lastName}`,
      grade: studentForm.grade,
      classGroup: studentForm.classGroup,
      house: studentForm.house
    });
    setShowAddStudent(false);
  };

  return (
    <div className="space-y-8 text-asis-text pb-20">
      <div className="bg-asis-card p-4 sm:p-6 rounded-[2rem] border border-asis-border flex flex-wrap gap-2 shadow-md">
        <button onClick={() => setActiveTab('students')} className={`flex-1 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'students' ? 'bg-asis-primary shadow-lg' : 'opacity-40 hover:opacity-100'}`}>Murid</button>
        <button onClick={() => setActiveTab('teachers')} className={`flex-1 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'teachers' ? 'bg-asis-primary shadow-lg' : 'opacity-40 hover:opacity-100'}`}>Guru</button>
        <button onClick={() => setActiveTab('system')} className={`flex-1 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'system' ? 'bg-asis-primary shadow-lg' : 'opacity-40 hover:opacity-100'}`}>Sistem</button>
      </div>

      {activeTab === 'students' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-2xl font-black">Pengurusan Murid ({students.length})</h3>
            <button onClick={() => setShowAddStudent(true)} className="px-6 py-3 bg-asis-primary !text-[#0000bf] font-black rounded-xl uppercase text-[10px] tracking-widest shadow-lg">Daftar Murid Baharu</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="Cari murid..." 
              className="w-full px-6 py-4 bg-asis-card border-2 border-asis-border rounded-2xl font-black outline-none focus:border-asis-primary"
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
            />
            <select 
              className="w-full px-6 py-4 bg-asis-card border-2 border-asis-border rounded-2xl font-black outline-none focus:border-asis-primary"
              value={studentGradeFilter}
              onChange={e => setStudentGradeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            >
              <option value="all">Semua Tingkatan</option>
              {GRADES.map(g => <option key={g} value={g}>Tingkatan {g}</option>)}
            </select>
          </div>

          <div className="bg-asis-card rounded-[2.5rem] border border-asis-border shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-asis-bg/50 border-b border-asis-border">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase opacity-40">Nama</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase opacity-40">Tingkatan</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase opacity-40">Rumah</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase opacity-40 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-asis-border">
                  {filteredStudents.map(s => (
                    <tr key={s.id} className="hover:bg-asis-bg/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={s.avatar} className="w-8 h-8 rounded-lg object-cover" alt="" />
                          <span className="font-black text-sm">{s.firstName} {s.lastName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-xs opacity-60">{s.classGroup}</td>
                      <td className="px-6 py-4 font-black text-xs opacity-60">{s.house}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => onSelectStudent(s.id)} className="px-3 py-1 bg-asis-primary text-[10px] font-black rounded-lg">PROFIL</button>
                          <button onClick={() => onRemoveStudent(s.id)} className="px-3 py-1 bg-rose-500/10 text-rose-600 text-[10px] font-black rounded-lg">PADAM</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredStudents.length === 0 && <div className="p-20 text-center opacity-30 italic font-black">Tiada murid ditemui.</div>}
            <div className="p-4 bg-asis-bg/30 text-center">
              <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">Menunjukkan 100 murid teratas</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'teachers' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black">Direktori Guru</h3>
            <button onClick={() => setShowAddTeacher(true)} className="px-6 py-3 bg-asis-primary !text-[#0000bf] font-black rounded-xl uppercase text-[10px] tracking-widest shadow-lg">Tambah Guru</button>
          </div>

          {showAddTeacher && (
            <form onSubmit={handleTeacherSubmit} className="bg-asis-card p-8 rounded-[2rem] border-2 border-asis-primary space-y-6 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input placeholder="Nama Pertama" className="px-4 py-3 bg-asis-bg/30 border border-asis-border rounded-xl font-black" value={teacherForm.firstName} onChange={e => setTeacherForm({...teacherForm, firstName: e.target.value})} required />
                <select className="px-4 py-3 bg-asis-bg/30 border border-asis-border rounded-xl font-black" value={teacherForm.separator} onChange={e => setTeacherForm({...teacherForm, separator: e.target.value})}>
                  {TEACHER_SEPARATORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input placeholder="Nama Akhir" className="px-4 py-3 bg-asis-bg/30 border border-asis-border rounded-xl font-black" value={teacherForm.lastName} onChange={e => setTeacherForm({...teacherForm, lastName: e.target.value})} required />
                <select className="px-4 py-3 bg-asis-bg/30 border border-asis-border rounded-xl font-black" value={teacherForm.title} onChange={e => setTeacherForm({...teacherForm, title: e.target.value})}>
                  {TEACHER_TITLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input placeholder="Staff ID (Username)" className="px-4 py-3 bg-asis-bg/30 border border-asis-border rounded-xl font-black" value={teacherForm.staffId} onChange={e => setTeacherForm({...teacherForm, staffId: e.target.value})} required />
                <input placeholder="Kata Laluan" type="password" className="px-4 py-3 bg-asis-bg/30 border border-asis-border rounded-xl font-black" value={teacherForm.password} onChange={e => setTeacherForm({...teacherForm, password: e.target.value})} required />
              </div>
              <div className="flex gap-4">
                <button type="submit" className="px-8 py-3 bg-asis-primary !text-[#0000bf] font-black rounded-xl uppercase text-[10px] tracking-widest shadow-lg">Daftar Guru</button>
                <button type="button" onClick={() => setShowAddTeacher(false)} className="px-8 py-3 opacity-40 font-black text-xs">Batal</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allTeachers.map(tp => (
              <div key={tp.id} className="p-6 bg-asis-card border border-asis-border rounded-[2rem] flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-asis-bg flex items-center justify-center font-black text-asis-text/30">{tp.name[0]}</div>
                  <div>
                    <p className="font-black text-lg leading-tight">{tp.name}</p>
                    <p className="text-[10px] opacity-40 font-black uppercase tracking-widest">@{tp.staffId} • {tp.roles[0]}</p>
                  </div>
                </div>
                <button onClick={() => onRemoveTeacher(tp.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-asis-card p-10 rounded-[3rem] border border-asis-border shadow-xl space-y-8">
            <h3 className="text-2xl font-black flex items-center gap-4"><div className="w-3 h-10 bg-emerald-500 rounded-full"></div>Awan Sekolah (Global Sync)</h3>
            <p className="opacity-60 font-medium italic">Simpan atau ambil data sekolah anda ke pangkalan data global.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={onCloudPush} disabled={isSyncing} className="p-8 bg-asis-text text-white rounded-3xl font-black shadow-xl uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex flex-col items-center gap-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                Tolak Data (Hantar)
              </button>
              <button onClick={onCloudPull} disabled={isSyncing} className="p-8 bg-asis-primary !text-[#0000bf] rounded-3xl font-black shadow-xl uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex flex-col items-center gap-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/></svg>
                Tarik Data (Ambil)
              </button>
            </div>
            <div className="text-center pt-4 opacity-40 font-black text-[10px] uppercase tracking-widest">Sinkronisasi Terakhir: {lastSync ? new Date(lastSync).toLocaleString() : 'Belum Pernah'}</div>
          </div>

          <div className="bg-asis-card p-10 rounded-[3rem] border border-asis-border shadow-xl space-y-8">
            <h3 className="text-2xl font-black flex items-center gap-4"><div className="w-3 h-10 bg-rose-500 rounded-full"></div>Zon Bahaya / Pemulihan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                <h4 className="font-black text-rose-600 mb-2">Kosongkan Semua Data</h4>
                <p className="text-xs opacity-60 mb-6 font-medium">Padam semua rekod murid dan demerit dari peranti ini.</p>
                <button onClick={() => { if(confirm("Tindakan ini akan memadam SEMUA data. Teruskan?")) onClearAll(); }} className="w-full py-4 bg-rose-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg">PADAM PANGKALAN DATA</button>
              </div>
              <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                <h4 className="font-black text-emerald-600 mb-2">Panggil Semula 550 Murid</h4>
                <p className="text-xs opacity-60 mb-6 font-medium">Gunakan ini jika Murid anda hilang atau tab kosong.</p>
                <button onClick={() => onAddBatch(550)} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg">JANA SEMULA DATA</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
