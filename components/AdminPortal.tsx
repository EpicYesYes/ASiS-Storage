
import React, { useState, useMemo } from 'react';
import { HOUSES, GRADES, CLASS_NAMES, TEACHER_TITLES, TEACHER_SEPARATORS, NAME_SEPARATORS, TEACHER_ROLES } from '../constants';
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
  onAddStudent: (newStudent: Omit<Student, 'id' | 'avatar'>) => void;
  onRemoveStudent: (id: string) => void;
  onCloudPush: () => void;
  onCloudPull: () => void;
  lastSync: number;
  isSyncing: boolean;
  t: (key: any) => string;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ 
  students, allTeachers, onAddTeacher, onUpdateTeacher, onRemoveTeacher, onAddStudent, onRemoveStudent, onCloudPush, onCloudPull, isSyncing, t 
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'system'>('students');
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [teacherForm, setTeacherForm] = useState({ title: 'Encik', firstName: '', separator: '(none)', lastName: '', staffId: '', password: '', roles: ['Guru Biasa'], isAdmin: false });

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

  return (
    <div className="space-y-8 text-asis-text">
      <div className="bg-asis-card p-6 rounded-3xl border border-asis-border flex gap-4">
        <button onClick={() => setActiveTab('students')} className={`px-6 py-2 rounded-xl font-black ${activeTab === 'students' ? 'bg-asis-primary' : 'opacity-40'}`}>Murid</button>
        <button onClick={() => setActiveTab('teachers')} className={`px-6 py-2 rounded-xl font-black ${activeTab === 'teachers' ? 'bg-asis-primary' : 'opacity-40'}`}>Guru</button>
        <button onClick={() => setActiveTab('system')} className={`px-6 py-2 rounded-xl font-black ${activeTab === 'system' ? 'bg-asis-primary' : 'opacity-40'}`}>Sistem</button>
      </div>

      {activeTab === 'teachers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black">Direktori Guru</h3>
            <button onClick={() => setShowAddTeacher(true)} className="px-6 py-2 bg-asis-primary font-black rounded-xl uppercase text-xs">Tambah Guru</button>
          </div>

          {showAddTeacher && (
            <form onSubmit={handleTeacherSubmit} className="bg-asis-card p-8 rounded-3xl border-2 border-asis-primary space-y-6 animate-in slide-in-from-top-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <input placeholder="Nama Pertama" className="px-4 py-3 bg-asis-bg/30 border border-asis-border rounded-xl font-black" value={teacherForm.firstName} onChange={e => setTeacherForm({...teacherForm, firstName: e.target.value})} required />
                <select className="px-4 py-3 bg-asis-bg/30 border border-asis-border rounded-xl font-black" value={teacherForm.separator} onChange={e => setTeacherForm({...teacherForm, separator: e.target.value})}>
                  {TEACHER_SEPARATORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input placeholder="Nama Akhir" className="px-4 py-3 bg-asis-bg/30 border border-asis-border rounded-xl font-black" value={teacherForm.lastName} onChange={e => setTeacherForm({...teacherForm, lastName: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Staff ID (Username)" className="px-4 py-3 bg-asis-bg/30 border border-asis-border rounded-xl font-black" value={teacherForm.staffId} onChange={e => setTeacherForm({...teacherForm, staffId: e.target.value})} required />
                <input placeholder="Kata Laluan" type="password" className="px-4 py-3 bg-asis-bg/30 border border-asis-border rounded-xl font-black" value={teacherForm.password} onChange={e => setTeacherForm({...teacherForm, password: e.target.value})} required />
              </div>
              <div className="flex gap-4">
                <button type="submit" className="px-8 py-3 bg-asis-primary font-black rounded-xl uppercase text-xs">Simpan Guru</button>
                <button type="button" onClick={() => setShowAddTeacher(false)} className="px-8 py-3 opacity-40 font-black">Batal</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allTeachers.map(tp => (
              <div key={tp.id} className="p-6 bg-asis-card border border-asis-border rounded-2xl flex justify-between items-center">
                <div>
                  <p className="font-black text-lg">{tp.name}</p>
                  <p className="text-xs opacity-40 font-black uppercase">@{tp.staffId}</p>
                </div>
                <button onClick={() => onRemoveTeacher(tp.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl">Padam</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="bg-asis-card p-10 rounded-[3rem] border border-asis-border shadow-xl space-y-8">
          <h3 className="text-2xl font-black flex items-center gap-4"><div className="w-3 h-10 bg-emerald-500 rounded-full"></div>Awan Sekolah (Global)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={onCloudPush} disabled={isSyncing} className="p-8 bg-asis-text text-white rounded-3xl font-black shadow-xl uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">Tolak Data (Simpan)</button>
            <button onClick={onCloudPull} disabled={isSyncing} className="p-8 bg-asis-primary rounded-3xl font-black shadow-xl uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">Tarik Data (Ambil)</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
