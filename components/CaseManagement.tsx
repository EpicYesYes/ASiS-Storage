
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

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 text-asis-text">
      <div className="bg-asis-card p-6 sm:p-8 rounded-[2.5rem] border border-asis-border shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl font-black">{t('case_room')}</h2>
          <p className="opacity-60 mt-1 font-medium italic text-sm">{t('case_desc')}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder={t('sl_search_placeholder')} 
              className="w-full pl-10 pr-4 py-3 bg-asis-bg/30 border-2 border-asis-border rounded-xl font-black focus:border-asis-primary outline-none transition-all text-asis-text text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)} 
            className="px-6 py-3 bg-asis-primary !text-[#0000bf] font-black rounded-2xl shadow-xl hover:bg-asis-primaryHover transition-all active:scale-95 text-sm uppercase tracking-widest"
          >
            {t('case_reg')}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {(['ALL', CaseStatus.PENDING, CaseStatus.INVESTIGATING, CaseStatus.RESOLVED] as const).map(status => (
            <button 
              key={status} 
              onClick={() => setStatusFilter(status)} 
              className={`px-4 sm:px-5 py-2 rounded-xl text-[10px] sm:text-xs font-black border-2 transition-all duration-200 ${
                statusFilter === status 
                  ? 'bg-asis-primary !text-[#0000bf] border-asis-primary shadow-lg scale-105' 
                  : 'bg-asis-card opacity-50 hover:opacity-100 border-asis-border'
              }`}
            >
              {getStatusLabel(status)}
            </button>
          ))}
        </div>
        
        <div className="flex bg-asis-card p-1 rounded-xl border border-asis-border">
           <button 
             onClick={() => setSortMethod('DATE')}
             className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
               sortMethod === 'DATE' ? 'bg-asis-primary !text-[#0000bf] shadow-sm' : 'opacity-40 hover:opacity-100'
             }`}
           >
             Tarikh
           </button>
           <button 
             onClick={() => setSortMethod('SEVERITY')}
             className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
               sortMethod === 'SEVERITY' ? 'bg-asis-primary !text-[#0000bf] shadow-sm' : 'opacity-40 hover:opacity-100'
             }`}
           >
             Keparahan
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
        {filteredCases.map(c => (
          <div 
            key={c.id} 
            onClick={() => { setSelectedCase(c); setFinalDecision(c.decision); }} 
            className="bg-asis-card p-6 sm:p-8 rounded-[2.5rem] border border-asis-border shadow-lg hover:shadow-2xl transition-all cursor-pointer group flex flex-col h-full active:scale-[0.99]"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 bg-asis-bg text-asis-text opacity-60 text-[10px] font-black uppercase tracking-widest rounded-lg">
                {getTranslatedCategory(c.category)}
              </span>
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${c.severity === CaseSeverity.SEVERE ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : c.severity === CaseSeverity.MAJOR ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                {getSeverityLabel(c.severity)}
              </span>
            </div>
            
            <div className="space-y-4 flex-1">
              <h3 className="text-lg sm:text-xl font-black group-hover:text-asis-primary transition-colors leading-tight">{c.title}</h3>
              <p className="opacity-40 text-sm line-clamp-2 italic">"{c.description}"</p>
            </div>

            <div className="flex items-center justify-between border-t border-asis-border pt-6 mt-6">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                c.status === CaseStatus.RESOLVED ? 'bg-emerald-500/10 text-emerald-500' : 'bg-asis-bg opacity-40'
              }`}>
                {getStatusLabel(c.status)}
              </span>
              <p className="text-[10px] font-black opacity-20">{new Date(c.date).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CaseManagement;
