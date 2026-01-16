
import React, { useState, useMemo } from 'react';
import { Student, BehaviorType, StudentRecord, MeritCategory } from '../types';
import { GRADES, HOUSES, COMMON_REASONS, HOUSE_COLORS, formatShortName, MERIT_CATEGORY_COLORS, CLASS_NAMES } from '../constants';

interface StudentListProps {
  students: Student[];
  onSelectStudent: (id: string) => void;
  onQuickAction: (id: string, record: Omit<StudentRecord, 'id' | 'timestamp' | 'teacherName'>) => void;
  onBatchAction: (ids: string[], record: Omit<StudentRecord, 'id' | 'timestamp' | 'teacherName'>) => void;
  batchColors: Record<number, string>;
  t: (key: any) => string;
}

type SortField = 'name' | 'form' | 'house' | 'class' | 'points';
type SortOrder = 'asc' | 'desc';

const StudentList: React.FC<StudentListProps> = ({ students, onSelectStudent, onQuickAction, onBatchAction, batchColors, t }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<number | 'all'>('all');
  const [houseFilter, setHouseFilter] = useState<string | 'all'>('all');
  const [classFilter, setClassFilter] = useState<string | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchTab, setBatchTab] = useState<MeritCategory | 'DEMERIT'>(MeritCategory.SAHSIAH);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const processedStudents = useMemo(() => {
    const filtered = students.filter(s => {
      const matchesSearch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade = gradeFilter === 'all' || s.grade === gradeFilter;
      const matchesHouse = houseFilter === 'all' || s.house === houseFilter;
      const matchesClass = classFilter === 'all' || s.classGroup.includes(classFilter);
      return matchesSearch && matchesGrade && matchesHouse && matchesClass;
    });

    return [...filtered].sort((a, b) => {
      let comp = 0;
      if (sortField === 'name') comp = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      else if (sortField === 'form') comp = a.grade - b.grade;
      else if (sortField === 'house') comp = a.house.localeCompare(b.house);
      else if (sortField === 'class') comp = a.classGroup.localeCompare(b.classGroup);
      else if (sortField === 'points') comp = a.totalPoints - b.totalPoints;
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [students, searchTerm, gradeFilter, houseFilter, classFilter, sortField, sortOrder]);

  const handleApplyBatch = (reasonKey: string, points: number, type: BehaviorType, category?: MeritCategory) => {
    onBatchAction(selectedIds, { reason: t(reasonKey as any), points, type, category });
    setSelectedIds([]);
    setShowBatchModal(false);
  };

  const toggleSelectAllFiltered = () => {
    if (selectedIds.length === processedStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(processedStudents.map(s => s.id));
    }
  };

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6 pb-24 text-asis-text">
      {/* Search and Filters */}
      <div className="flex flex-col gap-6 bg-asis-card p-6 rounded-3xl border border-asis-border shadow-sm sticky top-20 z-20 transition-colors duration-300">
        <div className="flex flex-col xl:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder={t('sl_search_placeholder')} className="w-full pl-12 pr-4 py-3 bg-asis-bg/20 border-2 border-asis-border rounded-2xl focus:border-asis-primary outline-none transition-all font-black" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select className="px-4 py-3 bg-asis-bg/20 border-2 border-asis-border rounded-2xl font-black outline-none focus:border-asis-primary transition-all" value={gradeFilter} onChange={e => setGradeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
              <option value="all">Semua Form</option>
              {GRADES.map(g => <option key={g} value={g}>{t('grade_prefix')} {g}</option>)}
            </select>
            <select className="px-4 py-3 bg-asis-bg/20 border-2 border-asis-border rounded-2xl font-black outline-none focus:border-asis-primary transition-all" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
              <option value="all">Semua Kelas</option>
              {CLASS_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="px-4 py-3 bg-asis-bg/20 border-2 border-asis-border rounded-2xl font-black outline-none focus:border-asis-primary transition-all" value={houseFilter} onChange={e => setHouseFilter(e.target.value)}>
              <option value="all">{t('sl_all_houses')}</option>
              {HOUSES.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <button 
              onClick={toggleSelectAllFiltered} 
              className={`px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${selectedIds.length > 0 ? 'bg-asis-primary shadow-lg' : 'bg-asis-bg/40 opacity-60'}`}
            >
              {selectedIds.length === processedStudents.length ? t('sl_deselect_all') : t('sl_select_all')}
            </button>
          </div>
        </div>
      </div>

      {/* Batch Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 bg-asis-text text-asis-bg px-10 py-5 rounded-full shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom-10">
          <span className="font-black text-xs uppercase tracking-widest">{selectedIds.length} {t('nav_students')} terpilih</span>
          <button onClick={() => setShowBatchModal(true)} className="px-8 py-2 bg-asis-primary !text-[#0000bf] font-black rounded-xl uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all">
            {t('sl_give_points')}
          </button>
          <button onClick={() => setSelectedIds([])} className="opacity-40 hover:opacity-100 text-[10px] font-black uppercase tracking-widest">Batal</button>
        </div>
      )}

      {/* Student Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {processedStudents.map(student => (
          <div 
            key={student.id} 
            onClick={() => onSelectStudent(student.id)}
            className={`bg-asis-card rounded-[2rem] border-2 overflow-hidden group shadow-sm p-8 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 relative ${selectedIds.includes(student.id) ? 'border-asis-primary bg-asis-primary/5' : 'border-transparent'}`}
          >
            <div className="absolute top-4 right-4 z-10">
              <button 
                onClick={(e) => toggleSelection(student.id, e)}
                className={`w-8 h-8 rounded-xl border-2 transition-all flex items-center justify-center ${selectedIds.includes(student.id) ? 'bg-asis-primary border-asis-primary shadow-lg' : 'bg-white/50 border-asis-border'}`}
              >
                {selectedIds.includes(student.id) && <svg className="w-5 h-5 text-[#0000bf]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>}
              </button>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative">
                <img src={student.avatar} className="w-24 h-24 rounded-[2rem] object-cover border-4 border-asis-card shadow-md" alt="" />
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl border-2 border-asis-card shadow-sm flex items-center justify-center text-[10px] text-white font-black" style={{ backgroundColor: HOUSE_COLORS[student.house] }}>{student.house[0]}</div>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-black leading-tight">{formatShortName(student.firstName, student.lastName)}</h4>
                <p className="text-[10px] font-black uppercase opacity-40 tracking-[0.2em] mt-1">{student.classGroup}</p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="px-3 py-1 rounded-lg text-[10px] font-black uppercase text-white shadow-sm" style={{ backgroundColor: batchColors[student.grade] || '#6366f1' }}>{t('grade_prefix')} {student.grade}</div>
                  <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${student.totalPoints >= 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{student.totalPoints} PTS</div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {processedStudents.length === 0 && <div className="col-span-full py-20 text-center opacity-30 italic font-black">{t('sl_no_students')}</div>}
      </div>

      {/* Batch Action Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-asis-card rounded-[3rem] shadow-2xl max-w-2xl w-full p-10 border-t-8 border-asis-primary border-asis-border border transition-colors duration-300">
            <h3 className="text-2xl font-black mb-8">{t('sl_give_points')} ({selectedIds.length} {t('nav_students')})</h3>
            <div className="flex bg-asis-bg/50 p-1 rounded-2xl mb-8 border border-asis-border">
              {Object.values(MeritCategory).map(cat => (
                <button key={cat} onClick={() => setBatchTab(cat)} className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${batchTab === cat ? 'bg-asis-primary shadow-md' : 'opacity-40'}`}>
                   {cat === MeritCategory.AKADEMIK ? t('cat_akademik') : 
                    cat === MeritCategory.KOKURIKULUM ? t('cat_koko') : 
                    cat === MeritCategory.SAHSIAH ? t('cat_sahsiah') : t('cat_3k')}
                </button>
              ))}
              <button onClick={() => setBatchTab('DEMERIT')} className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${batchTab === 'DEMERIT' ? 'bg-rose-600 text-white shadow-md' : 'text-rose-500 opacity-60'}`}>Demerit</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-2">
              {COMMON_REASONS.filter(r => batchTab === 'DEMERIT' ? r.type === BehaviorType.DEMERIT : r.category === batchTab).map(reason => (
                <button key={reason.id} onClick={() => handleApplyBatch(reason.labelKey, reason.points, reason.type, reason.category)} className="p-5 border-2 border-asis-border rounded-2xl hover:bg-asis-bg/30 text-left flex justify-between items-center group">
                  <span className="text-xs font-black">{t(reason.labelKey as any)}</span>
                  <span className={`font-black ${reason.points > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{reason.points > 0 ? `+${reason.points}` : reason.points}</span>
                </button>
              ))}
            </div>
            <div className="mt-10 flex justify-end gap-3">
              <button onClick={() => setShowBatchModal(false)} className="px-8 py-3 font-black opacity-40 hover:opacity-100 uppercase text-xs">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
