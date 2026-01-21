
import React, { useMemo, useState, useEffect } from 'react';
import { Student, BehaviorType, MeritCategory } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, PieChart, Pie } from 'recharts';
import { HOUSE_COLORS, HOUSES, GRADES, formatShortName, MERIT_CATEGORY_COLORS, HOUSE_INITIAL_POINTS } from '../constants';

interface DashboardProps {
  students: Student[];
  onSelectStudent: (id: string) => void;
  batchColors: Record<number, string>;
  t: (key: any) => string;
  onSeed?: () => void;
}

type RankFilterType = 'all' | 'grade' | 'house' | 'class';

const darkenColor = (hex: string, percent: number) => {
  const num = parseInt(hex.replace("#", ""), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) - amt,
    G = (num >> 8 & 0x00FF) - amt,
    B = (num & 0x0000FF) - amt;
  const clamp = (val: number) => Math.max(0, Math.min(255, val));
  return "#" + (0x1000000 + clamp(R) * 0x10000 + clamp(G) * 0x100 + clamp(B)).toString(16).slice(1);
};

const Dashboard: React.FC<DashboardProps> = ({ students, onSelectStudent, batchColors, t, onSeed }) => {
  const [filterType, setFilterType] = useState<RankFilterType>('all');
  const [filterValue, setFilterValue] = useState<string | number>('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const allClassGroups = useMemo(() => {
    const groups = new Set<string>();
    students.forEach(s => groups.add(s.classGroup));
    return Array.from(groups).sort();
  }, [students]);

  const stats = useMemo(() => {
    let totalMerits = 0;
    let totalDemerits = 0;
    const housePointsMap = HOUSES.reduce((acc, house) => {
      const initial = HOUSE_INITIAL_POINTS[house] || { merits: 0, demerits: 0 };
      acc[house] = { ...initial };
      totalMerits += initial.merits;
      totalDemerits += initial.demerits;
      return acc;
    }, {} as Record<string, { merits: number; demerits: number }>);

    const batchPointsMap = GRADES.reduce((acc, grade) => {
      acc[grade] = { merits: 0, demerits: 0 };
      return acc;
    }, {} as Record<number, { merits: number; demerits: number }>);

    const categoryPointsMap = {
      [MeritCategory.AKADEMIK]: 0,
      [MeritCategory.KOKURIKULUM]: 0,
      [MeritCategory.SAHSIAH]: 0,
      [MeritCategory.TIGAK]: 0,
    };

    students.forEach(s => {
      (s.records || []).forEach(r => {
        const points = Math.abs(r.points);
        if (r.type === BehaviorType.MERIT) {
          totalMerits++;
          if (housePointsMap[s.house]) housePointsMap[s.house].merits += points;
          if (batchPointsMap[s.grade]) batchPointsMap[s.grade].merits += points;
          if (r.category && categoryPointsMap[r.category as MeritCategory] !== undefined) {
            categoryPointsMap[r.category as MeritCategory] += points;
          } else {
            categoryPointsMap[MeritCategory.SAHSIAH] += points;
          }
        } else {
          totalDemerits++;
          if (housePointsMap[s.house]) housePointsMap[s.house].demerits += points;
          if (batchPointsMap[s.grade]) batchPointsMap[s.grade].demerits += points;
        }
      });
    });
    return { totalMerits, totalDemerits, housePointsMap, batchPointsMap, categoryPointsMap };
  }, [students]);

  const rankings = useMemo(() => {
    let list = [...students];
    if (filterType === 'grade' && filterValue) {
      list = list.filter(s => s.grade === Number(filterValue));
    } else if (filterType === 'house' && filterValue) {
      list = list.filter(s => s.house === String(filterValue));
    } else if (filterType === 'class' && filterValue) {
      list = list.filter(s => s.classGroup === String(filterValue));
    }
    const top = [...list].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0)).slice(0, 5);
    const bottom = [...list].sort((a, b) => (a.totalPoints || 0) - (b.totalPoints || 0)).slice(0, 5);
    return { top, bottom };
  }, [students, filterType, filterValue]);

  const houseData = HOUSES.map(house => ({
    name: house,
    fullName: house,
    display: house[0],
    Merit: stats.housePointsMap[house]?.merits || 0,
    Demerit: stats.housePointsMap[house]?.demerits || 0
  }));

  const batchData = GRADES.map(grade => ({
    name: `Grade ${grade}`,
    fullName: `${t('grade_prefix')} ${grade}`,
    display: `${t('grade_prefix')[0]}${grade}`,
    grade: grade,
    Merit: stats.batchPointsMap[grade]?.merits || 0,
    Demerit: stats.batchPointsMap[grade]?.demerits || 0
  }));

  const categoryPieData = [
    { name: t('cat_akademik'), value: stats.categoryPointsMap[MeritCategory.AKADEMIK], color: MERIT_CATEGORY_COLORS[MeritCategory.AKADEMIK] },
    { name: t('cat_koko'), value: stats.categoryPointsMap[MeritCategory.KOKURIKULUM], color: MERIT_CATEGORY_COLORS[MeritCategory.KOKURIKULUM] },
    { name: t('cat_sahsiah'), value: stats.categoryPointsMap[MeritCategory.SAHSIAH], color: MERIT_CATEGORY_COLORS[MeritCategory.SAHSIAH] },
    { name: t('cat_3k'), value: stats.categoryPointsMap[MeritCategory.TIGAK], color: MERIT_CATEGORY_COLORS[MeritCategory.TIGAK] },
  ].filter(d => d.value > 0);

  const handleFilterTypeChange = (type: RankFilterType) => {
    setFilterType(type);
    if (type === 'all') setFilterValue('');
    else if (type === 'grade') setFilterValue(GRADES[0]);
    else if (type === 'house') setFilterValue(HOUSES[0]);
    else if (type === 'class') setFilterValue(allClassGroups[0] || '');
  };

  const renderStudentCard = (student: Student, isTop: boolean, index: number) => (
    <div 
      key={student.id} 
      className="flex flex-col items-center p-4 rounded-3xl hover:bg-asis-primary transition-all cursor-pointer text-center group border border-transparent hover:border-asis-border relative"
      onClick={() => onSelectStudent(student.id)}
    >
      <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-asis-card text-asis-text text-[10px] font-black flex items-center justify-center shadow-md">
        #{index + 1}
      </div>
      <div className="relative mb-3">
        <img 
          src={student.avatar} 
          alt={`Foto ${student.firstName}`} 
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-4 border-asis-card shadow-md group-hover:scale-110 transition-transform ${isTop ? 'ring-2 ring-emerald-500/20' : 'ring-2 ring-rose-500/20'}`} 
        />
        <div 
          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg border-2 border-asis-card shadow-sm flex items-center justify-center text-[10px] text-white font-black" 
          style={{ backgroundColor: HOUSE_COLORS[student.house] }}
        >
          {student.house[0]}
        </div>
      </div>
      <h4 className="font-black truncate w-full text-xs leading-tight transition-colors">
        {formatShortName(student.firstName, student.lastName)}
      </h4>
      <p className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-40 group-hover:opacity-70">{student.classGroup}</p>
      <div className={`mt-2 text-sm sm:text-base font-black ${isTop ? 'text-emerald-500' : 'text-rose-500'}`}>
        {student.totalPoints} <span className="text-[8px] uppercase font-black opacity-70">pts</span>
      </div>
    </div>
  );

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 bg-asis-card rounded-[3rem] border-4 border-dashed border-asis-border animate-in fade-in zoom-in text-center p-8">
        <div className="w-24 h-24 bg-asis-primary/20 rounded-full flex items-center justify-center text-asis-primary mb-6">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <h2 className="text-3xl font-black mb-4">Pangkalan Data Kosong</h2>
        <p className="opacity-60 max-w-md font-medium leading-relaxed mb-8">Sistem mengesan tiada rekod murid dalam pangkalan data peranti anda. Sila mulakan sistem semula.</p>
        <button 
          onClick={onSeed} 
          className="px-12 py-5 bg-asis-primary !text-[#0000bf] font-black rounded-3xl shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-sm"
        >
          Jana Semula 550 Murid
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 text-asis-text">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-asis-card p-6 rounded-3xl border border-asis-border shadow-sm flex items-center gap-4 transition-colors duration-300">
          <div className="w-12 h-12 bg-asis-primary/20 rounded-2xl flex items-center justify-center text-asis-primary">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          </div>
          <div>
            <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">{t('dash_enrolment')}</p>
            <h3 className="text-2xl font-black">{students.length}</h3>
          </div>
        </div>
        <div className="bg-asis-card p-6 rounded-3xl border border-asis-border shadow-sm border-l-4 border-l-emerald-500 flex items-center gap-4 transition-colors duration-300">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
          </div>
          <div>
            <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">{t('dash_merit_total')}</p>
            <h3 className="text-2xl font-black text-emerald-500">{stats.totalMerits}</h3>
          </div>
        </div>
        <div className="bg-asis-card p-6 rounded-3xl border border-asis-border shadow-sm border-l-4 border-l-rose-500 flex items-center gap-4 transition-colors duration-300">
          <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"/></svg>
          </div>
          <div>
            <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">{t('dash_demerit_total')}</p>
            <h3 className="text-2xl font-black text-rose-500">{stats.totalDemerits}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {[
          { title: t('dash_house_dist'), data: houseData, icon: 'bg-asis-text' },
          { title: t('dash_batch_dist'), data: batchData, icon: 'bg-asis-primary' },
          { title: t('dash_merit_cat'), data: categoryPieData, icon: 'bg-emerald-500' }
        ].map((card, idx) => (
          <div key={idx} className="bg-asis-card p-8 rounded-[2.5rem] border border-asis-border shadow-sm min-w-0 transition-colors duration-300">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
              <div className={`w-2 h-6 ${card.icon} rounded-full`}></div>
              {card.title}
            </h3>
            <div className="w-full" style={{ minHeight: '300px' }}>
              {isMounted && (
                idx < 2 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={card.data as any} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--asis-border)" />
                      <XAxis dataKey="display" axisLine={false} tickLine={false} tick={{fill: 'var(--asis-text)', fontSize: 11, fontWeight: 'bold'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--asis-text)', fontSize: 10}} />
                      <Tooltip 
                        cursor={{fill: 'rgba(255, 191, 0, 0.1)'}} 
                        labelFormatter={(_, items) => items[0]?.payload?.fullName || ''}
                        contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#ffbf00', color: '#0000bf', fontWeight: '900' }} 
                        itemStyle={{ color: '#0000bf', fontWeight: 'bold' }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', color: 'var(--asis-text)' }} />
                      <Bar name="Merit" dataKey="Merit" radius={[4, 4, 0, 0]} barSize={12}>
                        {(card.data as any[]).map((entry, i) => (
                          <Cell key={i} fill={idx === 0 ? HOUSE_COLORS[entry.name] : batchColors[entry.grade]} />
                        ))}
                      </Bar>
                      <Bar name="Demerit" dataKey="Demerit" radius={[4, 4, 0, 0]} barSize={12}>
                        {(card.data as any[]).map((entry, i) => (
                          <Cell key={i} fill={darkenColor(idx === 0 ? HOUSE_COLORS[entry.name] : (batchColors[entry.grade] || '#cbd5e1'), 40)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  categoryPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {categoryPieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#ffbf00', color: '#0000bf', fontWeight: '900' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', color: 'var(--asis-text)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-full opacity-40 italic text-sm text-center">{t('dash_no_data')}</div>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-asis-card/40 p-4 sm:p-10 rounded-[3rem] border border-asis-border space-y-10 transition-colors duration-300">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black">{t('dash_analysis')}</h3>
            <p className="opacity-60 text-sm font-medium italic">{t('sd_ai_desc')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-asis-card p-1 rounded-2xl shadow-sm border border-asis-border overflow-x-auto">
              {(['all', 'grade', 'house', 'class'] as RankFilterType[]).map((type) => (
                <button 
                  key={type} 
                  onClick={() => handleFilterTypeChange(type)} 
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterType === type ? 'bg-asis-primary' : 'bg-transparent'}`}
                >
                  {type === 'all' ? t('dash_filter_school') : type === 'grade' ? t('dash_filter_batch') : type === 'house' ? t('dash_filter_house') : t('dash_filter_class')}
                </button>
              ))}
            </div>

            {filterType !== 'all' && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                <select 
                  value={filterValue} 
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="bg-asis-card border-2 border-asis-border rounded-xl px-4 py-2 text-xs font-black outline-none focus:border-asis-primary text-asis-text cursor-pointer appearance-none pr-8"
                  style={{ backgroundImage: 'none' }}
                >
                  {filterType === 'grade' && GRADES.map(g => (
                    <option key={g} value={g}>{t('grade_prefix')} {g}</option>
                  ))}
                  {filterType === 'house' && HOUSES.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                  {filterType === 'class' && allClassGroups.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
          {[
            { title: t('dash_stars'), data: rankings.top, isTop: true, color: 'emerald' },
            { title: t('dash_attention'), data: rankings.bottom, isTop: false, color: 'rose' }
          ].map((sec, i) => (
            <div key={i} className={`bg-asis-card/40 p-6 sm:p-8 rounded-[2.5rem] border border-asis-border space-y-6 relative overflow-hidden group`}>
              <div className="flex items-center justify-between border-b border-asis-border pb-4">
                 <h4 className={`text-xs font-black text-${sec.color}-500 uppercase tracking-[0.2em]`}>{sec.title}</h4>
                 {filterType !== 'all' && <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">{filterValue}</span>}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
                {sec.data.length > 0 ? sec.data.map((s, idx) => renderStudentCard(s, sec.isTop, idx)) : <div className="col-span-full py-10 text-center opacity-40 italic font-black">{t('dash_no_data')}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
