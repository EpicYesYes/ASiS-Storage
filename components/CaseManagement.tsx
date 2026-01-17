
import React, { useState, useMemo } from 'react';
import { DisciplinaryCase, Student, TeacherProfile, CaseSeverity, CaseStatus, BehaviorType, StudentRecord } from '../types';
import { formatShortName } from '../constants';

interface CaseManagementProps {
  cases: DisciplinaryCase[];
  students: Student[];
  teacher: TeacherProfile;
  onSelectStudent: (id: string) => void;
  onAddCase: (newCase: DisciplinaryCase) => void;
  onUpdateCase: (updatedCase: DisciplinaryCase) => void;
  onRemoveCase: (id: string) => void;
  onAllocatePoints: (studentId: string, record: Omit<StudentRecord, 'id' | 'timestamp' | 'teacherName'>) => void;
  t: (key: any) => string;
}

const SEVERITY_PRIORITY: Record<CaseSeverity, number> = {
  [CaseSeverity.SEVERE]: 2,
  [CaseSeverity.MAJOR]: 1,
  [CaseSeverity.MINOR]: 0
};

const CATEGORIES = [
  { key: 'case_cat_vandalism', value: 'Vandalisme' },
  { key: 'case_cat_bullying', value: 'Buli' },
  { key: 'case_cat_cyber', value: 'Siber' },
  { key: 'case_cat_truancy', value: 'Ponteng' },
  { key: 'case_cat_fighting', value: 'Pergaduhan' },
  { key: 'case_cat_drugs', value: 'Vape/Rokok/Dadah' },
  { key: 'case_cat_sexual', value: 'Salah Laku Seksual' },
  { key: 'case_cat_others', value: 'Lain-lain' }
];

const CaseManagement: React.FC<CaseManagementProps> = ({ 
  cases, students, teacher, onSelectStudent, onAddCase, onUpdateCase, onRemoveCase, onAllocatePoints, t
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<DisciplinaryCase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'ALL'>('ALL');
  const [sortMethod, setSortMethod] = useState<'DATE' | 'SEVERITY'>('DATE');
  const [finalDecision, setFinalDecision] = useState('');
  
  const [formData, setFormData] = useState({
    title: '', category: CATEGORIES[0].value, description: '', location: '', severity: CaseSeverity.MINOR,
    perpQuery: '', victimQuery: '', selectedPerps: [] as string[], selectedVictims: [] as string[]
  });

  const getStatusLabel = (status: CaseStatus | 'ALL') => {
    if (status === 'ALL') return 'Semua Status';
    switch (status) {
      case CaseStatus.PENDING: return t('status_pending');
      case CaseStatus.INVESTIGATING: return t('status_investigating');
      case CaseStatus.RESOLVED: return t('status_resolved');
      default: return status;
    }
  };

  const getTranslatedCategory = (val: string) => {
    const found = CATEGORIES.find(c => c.value === val);
    return found ? t(found.key as any) : val;
  };

  const getSeverityLabel = (sev: CaseSeverity) => {
    switch (sev) {
      case CaseSeverity.MINOR: return t('sev_minor');
      case CaseSeverity.MAJOR: return t('sev_major');
      case CaseSeverity.SEVERE: return t('sev_severe');
      default: return sev;
    }
  };

  const filteredCases = useMemo(() => {
    let result = cases.filter(c => {
      const catLabel = getTranslatedCategory(c.category);
      const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           catLabel.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return result.sort((a, b) => {
      if (sortMethod === 'SEVERITY') {
        const diff = SEVERITY_PRIORITY[b.severity] - SEVERITY_PRIORITY[a.severity];
        return diff !== 0 ? diff : b.date - a.date;
      }
      return b.date - a.date;
    });
  }, [cases, searchTerm, statusFilter, sortMethod]);

  const perpSearchResults = useMemo(() => {
    if (!formData.perpQuery) return [];
    return students.filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(formData.perpQuery.toLowerCase())).slice(0, 5);
  }, [students, formData.perpQuery]);

  const victimSearchResults = useMemo(() => {
    if (!formData.victimQuery) return [];
    return students.filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(formData.victimQuery.toLowerCase())).slice(0, 5);
  }, [students, formData.victimQuery]);

  const handleAddCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.selectedPerps.length === 0) { alert("Sila pilih sekurang-kurangnya satu pelaku."); return; }
    onAddCase({
      id: `case-${Date.now()}`,
      title: formData.title,
      category: formData.category,
      description: formData.description,
      location: formData.location,
      severity: formData.severity,
      perpetratorIds: formData.selectedPerps,
      victimIds: formData.selectedVictims,
      decision: '',
      date: Date.now(),
      status: CaseStatus.PENDING,
      loggedBy: teacher.name
    });
    setShowAddModal(false);
    setFormData({ title: '', category: CATEGORIES[0].value, description: '', location: '', severity: CaseSeverity.MINOR, perpQuery: '', victimQuery: '', selectedPerps: [], selectedVictims: [] });
  };

  const handleUpdateStatus = (newStatus: CaseStatus) => {
    if (!selectedCase) return;
    const updated = { ...selectedCase, status: newStatus, decision: finalDecision };
    onUpdateCase(updated);
    setSelectedCase(updated);
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 text-asis-text">
      <div className="bg-asis-card p-8 rounded-[2.5rem] border border-asis-border shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1">
          <h2 className="text-3xl font-black">{t('case_room')}</h2>
          <p className="opacity-60 mt-1 font-medium italic text-sm">{t('case_desc')}</p>
        </div>
        <div className="flex items-center gap-4">
          <input type="text" placeholder="Cari kes..." className="bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-3 font-black outline-none focus:border-asis-primary" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <button onClick={() => setShowAddModal(true)} className="px-8 py-3 bg-asis-primary !text-[#0000bf] font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest">{t('case_reg')}</button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {(['ALL', CaseStatus.PENDING, CaseStatus.INVESTIGATING, CaseStatus.RESOLVED] as const).map(status => (
            <button key={status} onClick={() => setStatusFilter(status)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${statusFilter === status ? 'bg-asis-primary border-asis-primary' : 'bg-asis-card opacity-50 border-asis-border'}`}>{getStatusLabel(status)}</button>
          ))}
        </div>
        <div className="flex bg-asis-card p-1 rounded-xl border border-asis-border">
          <button onClick={() => setSortMethod('DATE')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${sortMethod === 'DATE' ? 'bg-asis-primary shadow-sm' : 'opacity-40 hover:opacity-100'}`}>Tarikh</button>
          <button onClick={() => setSortMethod('SEVERITY')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${sortMethod === 'SEVERITY' ? 'bg-asis-primary shadow-sm' : 'opacity-40 hover:opacity-100'}`}>Keparahan</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCases.map(c => (
          <div key={c.id} onClick={() => { setSelectedCase(c); setFinalDecision(c.decision); }} className="bg-asis-card p-8 rounded-[2.5rem] border border-asis-border shadow-lg cursor-pointer hover:shadow-2xl transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 bg-asis-bg text-asis-text opacity-60 text-[10px] font-black uppercase tracking-widest rounded-lg">{getTranslatedCategory(c.category)}</span>
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${c.severity === CaseSeverity.SEVERE ? 'bg-rose-500/10 text-rose-500 border-rose-500' : c.severity === CaseSeverity.MAJOR ? 'bg-amber-500/10 text-amber-500 border-amber-500' : 'bg-asis-bg border-asis-border'}`}>
                {getSeverityLabel(c.severity)}
              </span>
            </div>
            <h3 className="text-xl font-black group-hover:text-asis-primary transition-colors">{c.title}</h3>
            <p className="opacity-40 text-sm mt-2 line-clamp-2">"{c.description}"</p>
            <div className="mt-6 pt-6 border-t border-asis-border flex justify-between items-center">
              <span className="text-[10px] font-black uppercase opacity-40">{new Date(c.date).toLocaleDateString()}</span>
              <span className={`text-[10px] font-black uppercase ${c.status === CaseStatus.RESOLVED ? 'text-emerald-500' : 'opacity-40'}`}>{getStatusLabel(c.status)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Details Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-asis-card rounded-[3rem] shadow-2xl max-w-4xl w-full p-12 my-auto border border-asis-border relative animate-in zoom-in-95">
            <button onClick={() => setSelectedCase(null)} className="absolute top-8 right-8 p-3 hover:bg-asis-bg rounded-2xl transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
            
            <div className="flex items-center gap-4 mb-8">
               <span className="px-5 py-2 bg-asis-primary !text-[#0000bf] text-xs font-black uppercase tracking-widest rounded-xl">{getTranslatedCategory(selectedCase.category)}</span>
               <span className={`px-5 py-2 text-xs font-black uppercase tracking-widest rounded-xl border ${selectedCase.severity === CaseSeverity.SEVERE ? 'bg-rose-500/10 text-rose-500 border-rose-500' : 'bg-asis-bg border-asis-border'}`}>
                {getSeverityLabel(selectedCase.severity)}
               </span>
               <span className={`px-5 py-2 text-xs font-black uppercase tracking-widest rounded-xl border ${selectedCase.status === CaseStatus.RESOLVED ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500' : 'bg-asis-bg border-asis-border'}`}>
                {getStatusLabel(selectedCase.status)}
               </span>
            </div>

            <h2 className="text-4xl font-black mb-4">{selectedCase.title}</h2>
            <p className="text-xl opacity-60 italic leading-relaxed mb-8">"{selectedCase.description}"</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-asis-border">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">{t('case_perps')}</label>
                  <div className="mt-2 space-y-2">
                    {selectedCase.perpetratorIds.map(id => {
                      const s = students.find(x => x.id === id);
                      return s && <div key={id} onClick={() => { onSelectStudent(id); setSelectedCase(null); }} className="p-4 bg-asis-bg/30 border border-asis-border rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-asis-primary transition-all group"><img src={s.avatar} className="w-10 h-10 rounded-xl object-cover" alt="" /><p className="font-black group-hover:text-[#0000bf]">{s.firstName} {s.lastName}</p></div>;
                    })}
                  </div>
                </div>
                {selectedCase.victimIds.length > 0 && (
                  <div>
                    <label className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">{t('case_victims')}</label>
                    <div className="mt-2 space-y-2">
                      {selectedCase.victimIds.map(id => {
                        const s = students.find(x => x.id === id);
                        return s && <div key={id} onClick={() => { onSelectStudent(id); setSelectedCase(null); }} className="p-4 bg-asis-bg/30 border border-asis-border rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-asis-primary transition-all group"><img src={s.avatar} className="w-10 h-10 rounded-xl object-cover" alt="" /><p className="font-black group-hover:text-[#0000bf]">{s.firstName} {s.lastName}</p></div>;
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-6">
                <div><label className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">{t('case_location')}</label>
                  <p className="text-lg font-black mt-1">{selectedCase.location}</p>
                </div>
                <div><label className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Didaftarkan Oleh</label>
                  <p className="text-lg font-black mt-1">{selectedCase.loggedBy}</p>
                </div>
                <div className="pt-6 border-t border-asis-border">
                  <label className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">{t('case_decision_sec')}</label>
                  <textarea 
                    className="w-full mt-2 bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-4 py-3 font-black text-sm outline-none focus:border-asis-primary"
                    placeholder="Masukkan keputusan atau tindakan..."
                    value={finalDecision}
                    onChange={(e) => setFinalDecision(e.target.value)}
                  ></textarea>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => handleUpdateStatus(CaseStatus.INVESTIGATING)} className="flex-1 py-3 bg-asis-bg border border-asis-border rounded-xl text-[10px] font-black uppercase tracking-widest">{t('status_investigating')}</button>
                    <button onClick={() => handleUpdateStatus(CaseStatus.RESOLVED)} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">{t('status_resolved')}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-asis-card rounded-[3rem] shadow-2xl max-w-2xl w-full p-12 my-auto border border-asis-border animate-in zoom-in-95">
            <h3 className="text-3xl font-black mb-8">{t('case_reg')}</h3>
            <form onSubmit={handleAddCaseSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">Tajuk Kes</label>
                <input required className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black outline-none focus:border-asis-primary" placeholder="cth: Pergaduhan di dewan" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">Kategori</label>
                  <select className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black cursor-pointer" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c.key} value={c.value}>{t(c.key as any)}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">Keparahan</label>
                  <select className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black cursor-pointer" value={formData.severity} onChange={e => setFormData({...formData, severity: e.target.value as CaseSeverity})}>
                    <option value={CaseSeverity.MINOR}>{t('sev_minor')}</option>
                    <option value={CaseSeverity.MAJOR}>{t('sev_major')}</option>
                    <option value={CaseSeverity.SEVERE}>{t('sev_severe')}</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">{t('case_perps')}</label>
                <input className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black mb-2 outline-none focus:border-asis-primary" placeholder="Cari pelaku..." value={formData.perpQuery} onChange={e => setFormData({...formData, perpQuery: e.target.value})} />
                {perpSearchResults.length > 0 && (
                  <div className="bg-asis-bg rounded-2xl p-2 border border-asis-border space-y-1 max-h-40 overflow-y-auto">
                    {perpSearchResults.map(s => (
                      <button key={s.id} type="button" onClick={() => setFormData({...formData, selectedPerps: [...new Set([...formData.selectedPerps, s.id])], perpQuery: ''})} className="w-full p-3 hover:bg-asis-primary rounded-xl flex items-center gap-3 font-black text-xs text-left group">
                        <img src={s.avatar} className="w-6 h-6 rounded-md object-cover" alt="" />
                        <span className="group-hover:text-[#0000bf]">{s.firstName} {s.lastName}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.selectedPerps.map(id => {
                    const s = students.find(x => x.id === id);
                    return s && <span key={id} className="px-3 py-1.5 bg-asis-primary rounded-lg text-[10px] font-black uppercase flex items-center gap-2 text-[#0000bf]">{s.firstName} <button type="button" onClick={() => setFormData({...formData, selectedPerps: formData.selectedPerps.filter(x => x !== id)})}>×</button></span>;
                  })}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">Huraian Kes</label>
                <textarea required className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black h-32 outline-none focus:border-asis-primary" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-8 py-4 font-black opacity-40 uppercase text-xs tracking-widest hover:opacity-100">Batal</button>
                <button type="submit" className="px-10 py-4 bg-asis-primary !text-[#0000bf] font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest active:scale-95 transition-all">Daftar Kes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseManagement;
