
import React, { useState, useMemo } from 'react';
import { HOUSES, GRADES, CLASS_NAMES, TEACHER_ROLES, SUBJECT_CATEGORIES, NAME_SEPARATORS, formatShortName } from '../constants';
import { Student, TeacherProfile } from '../types';

interface AdminPortalProps {
  students: Student[];
  batchColors: Record<number, string>;
  teacher: TeacherProfile;
  allTeachers: TeacherProfile[];
  onSelectStudent: (id: string) => void;
  onUpdateTeacher: (profile: TeacherProfile) => void;
  onAddTeacher: (newTeacher: Omit<TeacherProfile, 'id' | 'meritsGiven' | 'demeritsGiven' | 'avatar'>) => void;
  onRemoveTeacher: (id: string) => void;
  onUpdateColors: (colors: Record<number, string>) => void;
  onBulkReassign: (reassignments: Record<string, { grade: number; classGroup: string }>) => void;
  onAddBatch: (count: number) => void;
  onImportStudents: (students: Student[]) => void;
  onClearAll: () => void;
  onAddStudent: (newStudent: Omit<Student, 'id' | 'records' | 'totalPoints' | 'avatar'>) => void;
  onRemoveStudent: (id: string) => void;
  t: (key: any) => string;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ 
  students, 
  batchColors, 
  teacher, 
  allTeachers,
  onSelectStudent,
  onUpdateTeacher, 
  onAddTeacher,
  onRemoveTeacher,
  onUpdateColors, 
  onBulkReassign, 
  onAddBatch, 
  onImportStudents,
  onClearAll,
  onAddStudent,
  onRemoveStudent,
  t
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'system'>('students');
  const [promotionMode, setPromotionMode] = useState(false);
  const [promotionData, setPromotionData] = useState<Record<string, { grade: number; classGroup: string }>>({});
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const [studentForm, setStudentForm] = useState({
    firstName: '',
    separator: 'bin',
    lastName: '',
    grade: 1,
    classGroup: CLASS_NAMES[0],
    house: HOUSES[0]
  });

  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery) return students.slice(0, 10);
    return students.filter(s => 
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentSearchQuery.toLowerCase())
    ).slice(0, 15);
  }, [students, studentSearchQuery]);

  const handleStartPromotion = () => {
    const initialData: Record<string, { grade: number; classGroup: string }> = {};
    students.forEach(s => {
      if (s.grade < 5) {
        initialData[s.id] = { 
          grade: s.grade + 1, 
          classGroup: `${s.grade + 1} ${s.classGroup.split(' ')[1] || CLASS_NAMES[0]}` 
        };
      }
    });
    setPromotionData(initialData);
    setPromotionMode(true);
  };

  const handleFinalizePromotion = () => {
    if (window.confirm('Confirm bulk promotion?')) {
      onBulkReassign(promotionData);
      setPromotionMode(false);
      alert('Promotion complete.');
    }
  };

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.firstName || !studentForm.lastName) {
      alert("Please complete student name.");
      return;
    }

    const constructedLastName = studentForm.separator 
      ? `${studentForm.separator} ${studentForm.lastName}` 
      : studentForm.lastName;

    onAddStudent({
      firstName: studentForm.firstName,
      lastName: constructedLastName,
      grade: studentForm.grade,
      classGroup: `${studentForm.grade} ${studentForm.classGroup}`,
      house: studentForm.house
    });

    setStudentForm({
      firstName: '',
      separator: 'bin',
      lastName: '',
      grade: 1,
      classGroup: CLASS_NAMES[0],
      house: HOUSES[0]
    });
    
    alert('Student registered successfully!');
  };

  const handleConfirmDelete = () => {
    if (studentToDelete) {
      onRemoveStudent(studentToDelete.id);
      setStudentToDelete(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 text-asis-text">
      {/* Custom Confirmation Modal for Student Deletion */}
      {studentToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-asis-card rounded-[3rem] shadow-2xl max-w-md w-full p-10 text-center border-t-8 border-rose-600 animate-in zoom-in-95 duration-300 border-x border-b border-asis-border">
            <div className="w-20 h-20 rounded-3xl mx-auto mb-8 flex items-center justify-center bg-rose-500/10 text-rose-500">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-2xl font-black mb-3">{t('confirm_delete_student')}</h3>
            <p className="opacity-60 font-medium leading-relaxed mb-10">
              Adakah anda pasti mahu memadam rekod untuk <span className="font-black opacity-100">{studentToDelete.firstName} {studentToDelete.lastName}</span> secara kekal?
            </p>
            <div className="flex flex-col gap-4">
              <button 
                onClick={handleConfirmDelete} 
                className="w-full py-5 rounded-2xl font-black text-[#0000bf] shadow-xl transform transition-transform active:scale-95 bg-rose-500 hover:bg-rose-600"
              >
                {t('yes_confirm')}
              </button>
              <button 
                onClick={() => setStudentToDelete(null)} 
                className="w-full py-4 font-black opacity-40 hover:opacity-60 transition-all uppercase tracking-widest text-[10px]"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-asis-card p-8 rounded-[2.5rem] border border-asis-border shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 transition-colors">
        <div>
          <h2 className="text-3xl font-black tracking-tight">{t('adm_title')}</h2>
          <p className="opacity-60 mt-1 font-black italic uppercase text-[10px] tracking-widest">ASiS Admin • {teacher.name}</p>
        </div>
        <div className="flex bg-asis-bg/50 p-1.5 rounded-2xl border border-asis-border shadow-inner">
          {(['students', 'teachers', 'system'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPromotionMode(false); }}
              className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-asis-primary shadow-md' : 'opacity-40 hover:opacity-100'
              }`}
            >
              {tab === 'students' ? t('adm_tab_students') : tab === 'teachers' ? t('adm_tab_teachers') : t('adm_tab_system')}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'students' && (
        <div className="space-y-10">
          {!promotionMode ? (
            <>
              <div className="bg-asis-card p-10 rounded-[3rem] border border-asis-border shadow-xl space-y-10 relative overflow-hidden transition-colors">
                <div className="absolute top-0 right-0 w-48 h-48 bg-asis-primary/5 rounded-bl-[8rem] -mr-12 -mt-12 opacity-40"></div>
                
                <div className="flex items-center gap-4">
                  <div className="w-4 h-12 bg-asis-primary rounded-full"></div>
                  <div>
                    <h3 className="text-2xl font-black">{t('adm_reg_new')}</h3>
                    <p className="text-xs font-black opacity-40 uppercase tracking-widest">{t('adm_reg_manual')}</p>
                  </div>
                </div>

                <form onSubmit={handleAddStudentSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <div className="xl:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">{t('adm_f_name')}</label>
                        <input required type="text" className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black outline-none focus:border-asis-primary transition-all text-asis-text" value={studentForm.firstName} onChange={e => setStudentForm({...studentForm, firstName: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">{t('adm_sep')}</label>
                        <select className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black outline-none focus:border-asis-primary text-asis-text" value={studentForm.separator} onChange={e => setStudentForm({...studentForm, separator: e.target.value})}>
                          {NAME_SEPARATORS.map(sep => <option key={sep.value} value={sep.value}>{sep.label}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">{t('adm_l_name')}</label>
                        <input required type="text" className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black outline-none focus:border-asis-primary transition-all text-asis-text" value={studentForm.lastName} onChange={e => setStudentForm({...studentForm, lastName: e.target.value})} />
                      </div>
                    </div>

                    <div className="xl:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-asis-border pt-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">{t('grade_prefix')}</label>
                        <select className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black text-asis-text" value={studentForm.grade} onChange={e => setStudentForm({...studentForm, grade: Number(e.target.value)})}>
                          {GRADES.map(g => <option key={g} value={g}>{t('grade_prefix')} {g}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">{t('dash_filter_class')}</label>
                        <select className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black text-asis-text" value={studentForm.classGroup} onChange={e => setStudentForm({...studentForm, classGroup: e.target.value})}>
                          {CLASS_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">{t('adm_house')}</label>
                        <select className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black text-asis-text" value={studentForm.house} onChange={e => setStudentForm({...studentForm, house: e.target.value})}>
                          {HOUSES.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button type="submit" className="px-12 py-5 bg-asis-primary text-[#0000bf] font-black rounded-3xl shadow-2xl hover:bg-asis-primaryHover transition-all active:scale-[0.98] flex items-center gap-3">
                      {t('confirm')}
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-asis-card p-10 rounded-[3rem] border border-asis-border shadow-xl space-y-8 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-12 bg-rose-500 rounded-full"></div>
                    <div>
                      <h3 className="text-2xl font-black">Direktori & Pengurusan Murid</h3>
                      <p className="text-xs font-black opacity-40 uppercase tracking-widest italic">Urus rekod murid dan hapus akaun yang tidak aktif</p>
                    </div>
                  </div>
                  <div className="relative flex-1 max-w-sm">
                    <input 
                      type="text" 
                      placeholder="Cari nama murid..." 
                      className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-3 font-black outline-none focus:border-asis-primary text-asis-text"
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map(s => (
                      <div key={s.id} className="p-6 border-2 border-asis-border rounded-[2rem] flex items-center justify-between hover:bg-asis-bg/50 transition-colors group">
                        <div className="flex items-center gap-5">
                          <img src={s.avatar} className="w-14 h-14 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform" alt="" />
                          <div>
                            <p className="font-black text-lg">{s.firstName} {s.lastName}</p>
                            <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">
                              {t('grade_prefix')} {s.grade} • {s.classGroup} • {s.house}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => onSelectStudent(s.id)} 
                            className="px-5 py-2.5 bg-asis-primary border border-asis-primaryHover text-[#0000bf] text-[10px] font-black uppercase rounded-xl hover:opacity-90 transition-all"
                          >
                            Profil
                          </button>
                          <button 
                            onClick={() => setStudentToDelete(s)} 
                            className="px-5 py-2.5 bg-rose-500 border border-rose-600 text-[#0000bf] text-[10px] font-black uppercase rounded-xl hover:opacity-90 transition-all"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center bg-asis-bg/30 rounded-[2rem]">
                      <p className="opacity-20 italic font-black">Tiada murid ditemui dalam direktori.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[#0000bf] text-white p-10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 group transition-colors">
                <div className="space-y-2">
                  <h3 className="text-3xl font-black tracking-tight">{t('adm_promotion')}</h3>
                  <p className="opacity-60 font-medium max-w-xl italic">{t('adm_promotion_desc')}</p>
                </div>
                <button 
                  onClick={handleStartPromotion} 
                  className="px-12 py-5 bg-asis-primary text-[#0000bf] font-black rounded-[2rem] shadow-2xl transition-all active:scale-95 flex items-center gap-3 whitespace-nowrap"
                >
                  {t('adm_promotion_start')}
                </button>
              </div>
            </>
          ) : (
             <div className="space-y-8 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between">
                <button onClick={() => setPromotionMode(false)} className="flex items-center gap-2 opacity-40 hover:opacity-100 font-black transition-colors uppercase text-[10px] tracking-widest">
                  {t('back')}
                </button>
                <button onClick={handleFinalizePromotion} className="px-10 py-4 bg-emerald-500 text-[#0000bf] font-black rounded-2xl shadow-xl active:scale-95 border-2 border-emerald-600">
                  {t('confirm')} ({Object.keys(promotionData).length})
                </button>
              </div>
              <div className="bg-asis-card p-10 rounded-[3rem] border border-asis-border shadow-xl">
                 <p className="text-center py-20 opacity-20 italic font-black">Antaramuka pemetaan kenaikan tingkatan sedia untuk dikonfigurasikan.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'teachers' && (
        <div className="space-y-10">
          <div className="bg-asis-card p-10 rounded-[3rem] border border-asis-border shadow-xl overflow-hidden transition-colors">
             <div className="p-8 border-b border-asis-border flex items-center justify-between bg-asis-bg/30">
                <h3 className="text-xl font-black">{t('adm_teacher_dir')}</h3>
                <span className="px-4 py-1.5 bg-asis-text/10 text-asis-text font-black text-[10px] uppercase tracking-widest rounded-full">{allTeachers.length} Aktif</span>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-asis-bg/20">
                      <th className="p-6 text-[10px] font-black opacity-30 uppercase tracking-widest">Profile</th>
                      <th className="p-6 text-[10px] font-black opacity-30 uppercase tracking-widest">Status</th>
                      <th className="p-6 text-[10px] font-black opacity-30 uppercase tracking-widest text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTeachers.map(tData => (
                      <tr key={tData.id} className="border-t border-asis-border hover:bg-asis-bg/20 transition-colors">
                        <td className="p-6 font-black">{tData.name}</td>
                        <td className="p-6 opacity-40 text-xs font-black uppercase italic">{tData.role}</td>
                        <td className="p-6 text-center">
                          <button onClick={() => onRemoveTeacher(tData.id)} className="text-[#0000bf] hover:text-rose-700 font-black text-xs uppercase tracking-widest transition-all bg-rose-500/20 px-4 py-2 rounded-xl">
                            {t('delete')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="space-y-10">
           <div className="bg-asis-card p-10 rounded-[3rem] border border-asis-border shadow-xl space-y-6 transition-colors duration-300">
               <h3 className="text-2xl font-black flex items-center gap-3">
                <span className="w-2 h-8 bg-rose-500 rounded-full"></span>
                {t('adm_sys_danger')}
              </h3>
              <div className="flex gap-4">
                 <button onClick={onClearAll} className="flex-1 py-5 bg-rose-500 text-[#0000bf] font-black rounded-2xl border-2 border-rose-600 hover:opacity-90 transition-all uppercase tracking-widest">
                   {t('adm_clear_all')}
                 </button>
              </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
