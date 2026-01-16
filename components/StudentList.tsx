
import React, { useState, useMemo } from 'react';
import { Student, BehaviorType, StudentRecord, MeritCategory } from '../types';
import { GRADES, HOUSES, COMMON_REASONS, HOUSE_COLORS, formatShortName, MERIT_CATEGORY_COLORS } from '../constants';

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
      return matchesSearch && matchesGrade && matchesHouse;
    });

    return [...filtered].sort((a, b) => {
      let comp = 0;
      if (sortField === 'name') {
        comp = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      } else if (sortField === 'form') {
        comp = a.grade - b.grade;
      } else if (sortField === 'house') {
        comp = a.house.localeCompare(b.house);
      } else if (sortField === 'class') {
        comp = a.classGroup.localeCompare(b.classGroup);
      } else if (sortField === 'points') {
        comp = a.totalPoints - b.totalPoints;
      }
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [students, searchTerm, gradeFilter, houseFilter, sortField, sortOrder]);

  const handleApplyBatch = (reasonKey: string, points: number, type: BehaviorType, category?: MeritCategory) => {
    onBatchAction(selectedIds, { reason: t(reasonKey as any), points, type, category });
    setSelectedIds([]);
    setShowBatchModal(false);
  };

  const getCategoryLabel = (cat: string) => {
    if (cat === MeritCategory.AKADEMIK) return t('cat_akademik');
    if (cat === MeritCategory.KOKURIKULUM) return t('cat_koko');
    if (cat === MeritCategory.SAHSIAH) return t('cat_sahsiah');
    if (cat === MeritCategory.TIGAK) return t('cat_3k');
    return cat;
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-6 pb-24 text-asis-text">
      <div className="flex flex-col gap-6 bg-asis-card p-6 rounded-3xl border border-asis-border shadow-sm sticky top-20 z-20 transition-colors duration-300">
        <div className="flex flex-col xl:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder={t('sl_search_placeholder')} 
              className="w-full pl-12 pr-4 py-3 bg-asis-bg/20 border-2 border-asis-border rounded-2xl focus:border-asis-primary outline-none transition-all font-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select 
              className="px-4 py-3 bg-asis-bg/20 border-2 border-asis-border rounded-2xl font-black outline-none focus:border-asis-primary transition-all"
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            >
              <option value="all">{t('sl_all_grades')}</option>
              {GRADES.map(g => <option key={g} value={g}>{t('grade_prefix')} {g}</option>)}
            </select>
            <select 
              className="px-4 py-3 bg-asis-bg/20 border-2 border-asis-border rounded-2xl font-black outline-none focus:border-asis-primary transition-all"
              value={houseFilter}
              onChange={(e) => setHouseFilter(e.target.value)}
            >
              <option value="all">{t('sl_all_houses')}</option>
              {HOUSES.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-asis-border pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">{t('sl_sort_by')}</span>
              <select 
                className="bg-asis-bg/20 border-2 border-asis-border rounded-xl px-3 py-1.5 text-xs font-black outline-none"
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
              >
                <option value="name">{t('sl_sort_name')}</option>
                <option value="form">{t('sl_sort_form')}</option>
                <option value="class">{t('sl_sort_class')}</option>
                <option value="house">{t('sl_sort_house')}</option>
                <option value="points">{t('sl_sort_points')}</option>
              </select>
            </div>
            <button 
              onClick={toggleSortOrder}
              className="flex items-center gap-2 px-3 py-1.5 bg-asis-primary rounded-xl border border-asis-primaryHover shadow-sm"
            >
              <span className="text-[10px] font-black uppercase tracking-widest">
                {sortOrder === 'asc' ? t('sl_order_asc') : t('sl_order_desc')}
              </span>
              <svg className={`w-3 h-3 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>

          <button onClick={() => setSelectedIds(selectedIds.length === processedStudents.length ? [] : processedStudents.map(s => s.id))} className="px-5 py-2 rounded-xl border-2 border-asis-border font-black text-[10px] uppercase tracking-widest hover:bg-asis-primary transition-all">
            {selectedIds.length > 0 ? t('sl_deselect_all') : t('sl_select_all')} ({processedStudents.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {processedStudents.map(student => {
          const bColor = batchColors[student.grade] || '#cbd5e1';
          const isSelected = selectedIds.includes(student.id);
          return (
            <div 
              key={student.id} 
              className={`bg-asis-card rounded-[2rem] border-2 overflow-hidden group shadow-sm p-8 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 relative ${isSelected ? 'border-asis-primary bg-asis-primary/5' : 'border-transparent'}`}
              onClick={() => isSelected ? setSelectedIds(prev => prev.filter(i => i !== student.id)) : onSelectStudent(student.id)}
            >
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-asis-primary rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-4 h-4 text-[#0000bf]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                </div>
              )}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <img src={student.avatar} className="w-24 h-24 rounded-[2rem] object-cover border-4 border-asis-card shadow-md" alt="" />
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl border-2 border-asis-card shadow-sm flex items-center justify-center text-[10px] text-white font-black" style={{ backgroundColor: HOUSE_COLORS[student.house] }}>
                    {student.house[0]}
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-black leading-tight">{formatShortName(student.firstName, student.lastName)}</h4>
                  <p className="text-[10px] font-black uppercase opacity-40 tracking-[0.2em] mt-1">{student.classGroup}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="px-3 py-1 rounded-lg text-[10px] font-black uppercase text-white shadow-sm" style={{ backgroundColor: bColor }}>{t('grade_prefix')} {student.grade}</div>
                    <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${student.totalPoints >= 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {student.totalPoints} PTS
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {processedStudents.length === 0 && (
        <div className="py-32 text-center">
          <div className="w-20 h-20 bg-asis-text/5 rounded-full flex items-center justify-center mx-auto mb-6 opacity-30">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h3 className="text-xl font-black opacity-100">{t('sl_no_students')}</h3>
          <p className="opacity-40">{t('dash_no_data')}</p>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-[#0000bf] text-white px-10 py-6 rounded-[2.5rem] flex items-center gap-10 shadow-2xl border border-white/10 backdrop-blur-md animate-in slide-in-from-bottom-8 duration-300">
          <div className="flex flex-col">
            <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">{selectedIds.length} {t('nav_students')}</span>
            <span className="text-lg font-black">{t('sl_batch_mode')}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedIds([])} className="px-6 py-3 font-black text-white/60 hover:text-white transition-colors">
              {t('cancel')}
            </button>
            <button onClick={() => setShowBatchModal(true)} className="bg-asis-primary px-8 py-3 rounded-2xl font-black shadow-xl transition-all active:scale-95 !text-[#0000bf]">
              {t('sl_give_points')}
            </button>
          </div>
        </div>
      )}

      {showBatchModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-asis-card rounded-[3rem] max-w-2xl w-full p-10 shadow-2xl animate-in zoom-in-95 duration-300 border-t-8 border-asis-primary border-x border-b border-asis-border">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-black">{t('sl_give_points')}</h3>
              <span className="px-4 py-1 bg-asis-primary/10 text-[#0000bf] rounded-full font-black text-xs">{selectedIds.length} {t('nav_students')}</span>
            </div>
            
            <div className="flex flex-wrap gap-2 p-2 bg-asis-bg/50 rounded-[2rem] mb-8">
              {Object.values(MeritCategory).map(cat => (
                <button key={cat} onClick={() => setBatchTab(cat)} className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${batchTab === cat ? 'bg-asis-primary shadow-md' : 'opacity-40 hover:opacity-100'}`}>
                  {getCategoryLabel(cat)}
                </button>
              ))}
              <button onClick={() => setBatchTab('DEMERIT')} className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${batchTab === 'DEMERIT' ? 'bg-rose-600 !text-white shadow-md' : 'text-rose-500 opacity-60 hover:opacity-100'}`}>
                {t('cat_demerit')}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {COMMON_REASONS.filter(r => batchTab === 'DEMERIT' ? r.type === BehaviorType.DEMERIT : r.category === batchTab).map(reason => (
                <button 
                  key={reason.id} 
                  onClick={() => handleApplyBatch(reason.labelKey, reason.points, reason.type, reason.category)} 
                  className="w-full text-left p-5 rounded-2xl border-2 border-asis-bg hover:border-asis-primary hover:bg-asis-bg flex justify-between items-center group transition-all"
                >
                  <span className="text-xs font-black leading-tight flex-1 pr-4">{t(reason.labelKey as any)}</span>
                  <span className="font-black text-lg" style={{ color: reason.points > 0 ? '#10b981' : '#ef4444' }}>
                    {reason.points > 0 ? `+${reason.points}` : reason.points}
                  </span>
                </button>
              ))}
            </div>

            <button onClick={() => setShowBatchModal(false)} className="w-full py-5 rounded-2xl bg-asis-bg font-black uppercase tracking-widest hover:opacity-80 transition-colors">
              {t('close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
