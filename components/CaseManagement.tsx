
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
  { key: 'case_cat_truancy', value: 'Ponteng Sekolah / Kelas' },
  { key: 'case_cat_fighting', value: 'Pergaduhan Fizikal' },
  { key: 'case_cat_drugs', value: 'Rokok / Vape / Dadah' },
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
  
  const [penaltyTarget, setPenaltyTarget] = useState<{ studentId: string; caseId: string } | null>(null);
  const [penaltyPoints, setPenaltyPoints] = useState(10);
  const [penaltyReason, setPenaltyReason] = useState('');

  const [formData, setFormData] = useState({
    title: '', category: CATEGORIES[0].value, description: '', location: '', severity: CaseSeverity.MINOR,
    perpetratorQuery: '', victimQuery: '', selectedPerpetrators: [] as string[], selectedVictims: [] as string[]
  });

  const statusLabels = {
    'ALL': t('sl_all_grades'),
    [CaseStatus.PENDING]: 'Pending',
    [CaseStatus.INVESTIGATING]: 'Investigating',
    [CaseStatus.RESOLVED]: 'Resolved'
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

  const handleResolveCase = () => {
    if (!selectedCase) return;
    const updated: DisciplinaryCase = {
      ...selectedCase,
      status: CaseStatus.RESOLVED,
      decision: finalDecision
    };
    onUpdateCase(updated);
    setSelectedCase(updated);
  };

  const handleApplyPenalty = () => {
    if (!penaltyTarget) return;
    onAllocatePoints(penaltyTarget.studentId, {
      type: BehaviorType.DEMERIT,
      reason: penaltyReason || `${t('case_penalty')}: ${selectedCase?.title}`,
      points: -Math.abs(penaltyPoints)
    });
    setPenaltyTarget(null);
    setPenaltyPoints(10);
    setPenaltyReason('');
  };

  const filteredCases = useMemo(() => {
    let result = cases.filter(c => {
      const translatedCat = getTranslatedCategory(c.category);
      const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           translatedCat.toLowerCase().includes(searchTerm.toLowerCase());
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

  const handleAddCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.selectedPerpetrators.length === 0) return;
    onAddCase({
      id: `case-${Date.now()}`, ...formData, perpetratorIds: formData.selectedPerpetrators,
      victimIds: formData.selectedVictims, decision: '', date: Date.now(), status: CaseStatus.PENDING, loggedBy: teacher.name
    });
    setShowAddModal(false);
  };

  const perpetratorResults = useMemo(() => {
    if (!formData.perpetratorQuery) return [];
    return students.filter(s => 
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(formData.perpetratorQuery.toLowerCase())
    ).slice(0, 5);
  }, [students, formData.perpetratorQuery]);

  const victimResults = useMemo(() => {
    if (!formData.victimQuery) return [];
    return students.filter(s => 
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(formData.victimQuery.toLowerCase())
    ).slice(0, 5);
  }, [students, formData.victimQuery]);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 text-asis-text">
      <div className="bg-asis-card p-8 rounded-[2.5rem] border border-asis-border shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black">{t('case_room')}</h2>
          <p className="opacity-60 mt-1 font-medium italic">{t('case_desc')}</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <input 
            type="text" 
            placeholder={t('sl_search_placeholder')} 
            className="flex-1 px-4 py-3 bg-asis-bg/30 border-2 border-asis-border rounded-xl font-black focus:border-asis-primary outline-none transition-all text-asis-text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-asis-primary text-asis-text font-black rounded-2xl shadow-xl whitespace-nowrap hover:bg-asis-primaryHover">
            {t('case_reg')}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">{t('case_filter')}</span>
          {(['ALL', CaseStatus.PENDING, CaseStatus.INVESTIGATING, CaseStatus.RESOLVED] as const).map(status => (
            <button key={status} onClick={() => setStatusFilter(status)} className={`px-5 py-2 rounded-xl text-xs font-black border-2 transition-all ${statusFilter === status ? 'bg-asis-text text-asis-bg border-asis-text shadow-md' : 'bg-asis-card opacity-40 hover:opacity-100 border-asis-border'}`}>
              {statusLabels[status]}
            </button>
          ))}
        </div>
        
        <div className="flex bg-asis-card p-1 rounded-xl border border-asis-border">
           <button 
             onClick={() => setSortMethod('DATE')}
             className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${sortMethod === 'DATE' ? 'bg-asis-primary text-asis-text shadow-sm' : 'opacity-40'}`}
           >
             {t('case_sort_date')}
           </button>
           <button 
             onClick={() => setSortMethod('SEVERITY')}
             className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${sortMethod === 'SEVERITY' ? 'bg-asis-primary text-asis-text shadow-sm' : 'opacity-40'}`}
           >
             {t('case_sort_severity')}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredCases.map(c => (
          <div key={c.id} onClick={() => { setSelectedCase(c); setFinalDecision(c.decision); }} className="bg-asis-card p-8 rounded-[2.5rem] border border-asis-border shadow-lg hover:shadow-2xl transition-all cursor-pointer group flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 bg-asis-bg text-asis-text opacity-60 text-[10px] font-black uppercase tracking-widest rounded-lg">
                {getTranslatedCategory(c.category)}
              </span>
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${c.severity === CaseSeverity.SEVERE ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : c.severity === CaseSeverity.MAJOR ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                {getSeverityLabel(c.severity)}
              </span>
            </div>
            
            <div className="space-y-4 flex-1">
              <h3 className="text-xl font-black group-hover:text-asis-primary transition-colors leading-tight">{c.title}</h3>
              <p className="opacity-40 text-sm line-clamp-2 italic">"{c.description}"</p>
              
              <div className="flex -space-x-3 overflow-hidden pt-2">
                {c.perpetratorIds.slice(0, 5).map(pid => (
                  <img key={pid} className="inline-block h-8 w-8 rounded-full ring-2 ring-asis-card object-cover" src={students.find(s => s.id === pid)?.avatar} alt="" />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-asis-border pt-6 mt-6">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${c.status === CaseStatus.RESOLVED ? 'bg-emerald-500/10 text-emerald-500' : 'bg-asis-bg opacity-40'}`}>
                {statusLabels[c.status]}
              </span>
              <p className="text-xs font-black opacity-20">{new Date(c.date).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>

      {selectedCase && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-asis-card rounded-[3rem] shadow-2xl max-w-4xl w-full p-12 overflow-y-auto max-h-[90vh] relative animate-in zoom-in-95 duration-200 border border-asis-border">
            <button onClick={() => setSelectedCase(null)} className="absolute top-8 right-8 opacity-20 hover:opacity-100 transition-all">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            <div className="space-y-10">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-asis-bg text-asis-text opacity-40 text-[10px] font-black uppercase rounded-lg">
                    {getTranslatedCategory(selectedCase.category)}
                  </span>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${selectedCase.severity === CaseSeverity.SEVERE ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-asis-bg opacity-40'}`}>
                    {getSeverityLabel(selectedCase.severity)} Severity
                  </span>
                </div>
                <h2 className="text-4xl font-black">{selectedCase.title}</h2>
                <p className="text-xs opacity-20 mt-2 font-black uppercase tracking-widest">By: {selectedCase.loggedBy} • {new Date(selectedCase.date).toLocaleString()}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div>
                    <h4 className="text-xs font-black opacity-40 uppercase tracking-widest mb-4">{t('case_detail_desc')}</h4>
                    <p className="bg-asis-bg/30 p-6 rounded-[2rem] italic leading-relaxed opacity-80">"{selectedCase.description}"</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-black opacity-40 uppercase tracking-widest mb-4">{t('case_location')}</h4>
                    <div className="px-6 py-4 bg-asis-bg/10 border border-asis-border rounded-2xl font-black">{selectedCase.location}</div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <h4 className="text-xs font-black opacity-40 uppercase tracking-widest mb-4">{t('case_perps')}</h4>
                    <div className="space-y-3">
                      {selectedCase.perpetratorIds.map(pid => {
                        const s = students.find(st => st.id === pid);
                        return s ? (
                          <div key={pid} className="flex items-center justify-between bg-asis-bg/20 px-4 py-3 rounded-2xl border border-asis-border">
                            <div className="flex items-center gap-3">
                              <img src={s.avatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
                              <span className="text-sm font-black">{formatShortName(s.firstName, s.lastName)}</span>
                            </div>
                            <button onClick={() => setPenaltyTarget({ studentId: pid, caseId: selectedCase.id })} className="px-3 py-1.5 bg-rose-600 text-white text-[9px] font-black uppercase rounded-lg hover:bg-rose-700">{t('case_penalty')}</button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {selectedCase.status === CaseStatus.RESOLVED ? (
                <div className="p-10 bg-emerald-600 text-white rounded-[2.5rem] shadow-xl">
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{t('case_decision_sec')}</h4>
                  <p className="text-2xl font-black leading-tight">{selectedCase.decision}</p>
                </div>
              ) : (
                <div className="p-10 bg-asis-text rounded-[2.5rem] space-y-6">
                  <h4 className="text-[10px] font-black text-asis-bg opacity-40 uppercase tracking-widest">{t('case_decision_sec')}</h4>
                  <textarea 
                    rows={3}
                    className="w-full bg-asis-bg/10 border border-asis-bg/20 rounded-2xl px-6 py-4 text-asis-bg outline-none focus:border-asis-primary placeholder:text-asis-bg/30 font-bold"
                    placeholder={t('case_decision_placeholder')}
                    value={finalDecision}
                    onChange={(e) => setFinalDecision(e.target.value)}
                  />
                  <button onClick={() => handleResolveCase()} className="w-full py-4 bg-asis-primary text-asis-text font-black rounded-2xl shadow-xl hover:bg-asis-primaryHover">RESOLVE CASE</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Case Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-asis-card rounded-[3rem] shadow-2xl max-w-3xl w-full p-12 overflow-y-auto max-h-[90vh] border-t-8 border-asis-primary border-x border-b border-asis-border">
            <h2 className="text-3xl font-black mb-8">{t('case_reg')}</h2>
            <form onSubmit={handleAddCaseSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black opacity-40 uppercase ml-1">Title</label>
                  <input required className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black outline-none focus:border-asis-primary text-asis-text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black opacity-40 uppercase ml-1">Category</label>
                  <select className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black outline-none focus:border-asis-primary text-asis-text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c.key} value={c.value}>{t(c.key as any)}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black opacity-40 uppercase ml-1">Involved Students (Search)</label>
                <input className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black outline-none focus:border-asis-primary text-asis-text" placeholder="Search name..." value={formData.perpetratorQuery} onChange={e => setFormData({...formData, perpetratorQuery: e.target.value})} />
                <div className="flex flex-wrap gap-2 mt-2">
                  {perpetratorResults.map(s => (
                    <button key={s.id} type="button" onClick={() => setFormData({...formData, selectedPerpetrators: [...formData.selectedPerpetrators, s.id], perpetratorQuery: ''})} className="px-3 py-1 bg-asis-primary/10 text-asis-text text-[10px] font-black uppercase rounded-lg border border-asis-primary/20">+ {s.firstName}</button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.selectedPerpetrators.map(pid => (
                    <div key={pid} className="px-3 py-1 bg-asis-text text-asis-bg text-[10px] font-black uppercase rounded-lg flex items-center gap-2">
                      {students.find(s => s.id === pid)?.firstName}
                      <button type="button" onClick={() => setFormData({...formData, selectedPerpetrators: formData.selectedPerpetrators.filter(i => i !== pid)})}>×</button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-1 py-4 bg-asis-primary text-asis-text font-black rounded-2xl shadow-xl hover:bg-asis-primaryHover transition-all">{t('confirm')}</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-8 py-4 bg-asis-bg text-asis-text opacity-40 font-black rounded-2xl hover:opacity-100 transition-all">{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Penalty Modal */}
      {penaltyTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-asis-card rounded-[3rem] shadow-2xl max-w-md w-full p-10 text-center border-t-8 border-rose-600 animate-in zoom-in-95 duration-200 border-x border-b border-asis-border">
            <h3 className="text-2xl font-black mb-2">{t('case_penalty')}</h3>
            <p className="opacity-40 text-sm mb-8 font-medium italic">{t('case_penalty_quick')} for {formatShortName(students.find(s => s.id === penaltyTarget.studentId)?.firstName || '', students.find(s => s.id === penaltyTarget.studentId)?.lastName || '')}</p>
            
            <div className="space-y-6 mb-8 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Points (Demerit)</label>
                <input type="number" className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black text-rose-500 outline-none focus:border-rose-500" value={penaltyPoints} onChange={e => setPenaltyPoints(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Penalty Reason</label>
                <input type="text" className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black outline-none focus:border-asis-primary text-asis-text" value={penaltyReason} onChange={e => setPenaltyReason(e.target.value)} placeholder={`${t('case_penalty')}: ${selectedCase?.title}`} />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={handleApplyPenalty} className="w-full py-4 bg-rose-600 text-white font-black rounded-2xl shadow-xl hover:bg-rose-700 transition-all active:scale-95 uppercase tracking-widest">{t('confirm')}</button>
              <button onClick={() => setPenaltyTarget(null)} className="w-full py-3 font-black opacity-40 hover:opacity-60 transition-all uppercase tracking-widest">{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseManagement;
