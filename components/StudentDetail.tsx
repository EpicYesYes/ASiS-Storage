
import React, { useState, useRef } from 'react';
import { Student, StudentRecord, BehaviorType, TeacherProfile, MeritCategory } from '../types';
import { COMMON_REASONS, HOUSE_COLORS, MERIT_CATEGORY_COLORS } from '../constants';
import { getBehaviorInsight } from '../services/geminiService';
import { GoogleGenAI } from "@google/genai";

interface StudentDetailProps {
  student: Student;
  teacher: TeacherProfile;
  onBack: () => void;
  onUpdate: (id: string, record: Omit<StudentRecord, 'id' | 'timestamp' | 'teacherName'>) => void;
  onUpdateAvatar: (id: string, newAvatar: string) => void;
  onRemove: (id: string) => void;
  t: (key: any) => string;
}

interface PendingUpdate {
  type: BehaviorType;
  category?: MeritCategory | string;
  reason: string;
  points: number;
}

const StudentDetail: React.FC<StudentDetailProps> = ({ student, teacher, onBack, onUpdate, onUpdateAvatar, onRemove, t }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [activeMeritTab, setActiveMeritTab] = useState<MeritCategory>(MeritCategory.AKADEMIK);
  const [pendingUpdate, setPendingUpdate] = useState<PendingUpdate | null>(null);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const houseColor = HOUSE_COLORS[student.house] || '#6366f1';

  const handleGenerateInsight = async () => {
    setIsLoadingInsight(true);
    const result = await getBehaviorInsight(student);
    setInsight(result);
    setIsLoadingInsight(false);
  };

  const confirmUpdate = () => {
    if (pendingUpdate) {
      onUpdate(student.id, pendingUpdate);
      setPendingUpdate(null);
    }
  };

  const handleGenerateAvatar = async () => {
    setIsGeneratingAvatar(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `A professional school profile headshot of a student named ${student.firstName}. Diverse, friendly face.` }],
        },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData && typeof part.inlineData.data === 'string') {
            onUpdateAvatar(student.id, `data:image/png;base64,${part.inlineData.data}`);
            break;
          }
        }
      }
    } catch (error) {
      console.error(error);
      alert("Gagal menjana avatar.");
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case MeritCategory.AKADEMIK: return t('cat_akademik');
      case MeritCategory.KOKURIKULUM: return t('cat_koko');
      case MeritCategory.SAHSIAH: return t('cat_sahsiah');
      case MeritCategory.TIGAK: return t('cat_3k');
      case 'DEMERIT': return t('cat_demerit');
      default: return cat;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-asis-text">
      {pendingUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-asis-card rounded-3xl shadow-2xl max-w-md w-full p-8 text-center border-t-8" style={{ borderColor: pendingUpdate.points > 0 ? '#10b981' : '#ef4444' }}>
            <h3 className="text-xl font-black mb-2">{t('sd_confirm_title')}</h3>
            <p className="opacity-60 mb-8 leading-relaxed">
              {pendingUpdate.points > 0 ? `+${pendingUpdate.points}` : pendingUpdate.points} points: <span className="italic">"{pendingUpdate.reason}"</span>?
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmUpdate} className="w-full py-4 rounded-xl font-black text-asis-text shadow-lg bg-asis-primary hover:bg-asis-primaryHover">{t('confirm')}</button>
              <button onClick={() => setPendingUpdate(null)} className="w-full py-3 font-black opacity-40 hover:opacity-60">{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <button onClick={onBack} className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-all font-black text-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          {t('sd_back_dir')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-asis-card p-10 rounded-[2.5rem] border border-asis-border shadow-xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-40 opacity-10" style={{ backgroundColor: houseColor }}></div>
            <div className="relative z-10">
              <div className="relative group mx-auto w-64 h-64 mb-8">
                <img src={student.avatar} alt={student.firstName} className="w-full h-full rounded-[2rem] object-cover shadow-2xl border-8 border-asis-card cursor-pointer" onClick={() => fileInputRef.current?.click()} />
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) { const reader = new FileReader(); reader.onloadend = () => onUpdateAvatar(student.id, reader.result as string); reader.readAsDataURL(file); }
                }} />
              </div>
              <div className="flex flex-col gap-2 mb-6">
                <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-asis-bg text-asis-text font-black rounded-xl border border-asis-border text-xs hover:bg-asis-primary">Tukar Foto</button>
                <button onClick={handleGenerateAvatar} disabled={isGeneratingAvatar} className="px-6 py-2 bg-asis-text text-asis-bg font-black rounded-xl border border-asis-text text-xs hover:bg-asis-primary hover:text-asis-text disabled:opacity-50">{isGeneratingAvatar ? 'Menjana...' : 'Jana Avatar AI'}</button>
              </div>
              <h2 className="text-3xl font-black leading-tight">{student.firstName} {student.lastName}</h2>
              <p className="font-black text-lg tracking-wide uppercase mt-3" style={{ color: houseColor }}>{student.house} • {student.grade} {student.classGroup.split(' ')[1]}</p>
              <div className="bg-asis-bg/30 p-8 rounded-3xl mt-10">
                <p className="text-xs opacity-40 font-black uppercase tracking-[0.2em] mb-2">{t('sd_total_merit')}</p>
                <p className={`text-6xl font-black ${student.totalPoints >= 100 ? 'text-emerald-500' : 'text-rose-500'}`}>{student.totalPoints}</p>
              </div>
            </div>
          </div>
          <div className="bg-asis-text text-asis-bg p-8 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-xl font-black mb-4">{t('sd_ai_analysis')}</h3>
            <p className="opacity-60 text-sm mb-6 leading-relaxed">{insight || t('sd_ai_desc')}</p>
            <button onClick={handleGenerateInsight} disabled={isLoadingInsight} className="w-full text-asis-text font-black py-4 rounded-2xl bg-asis-primary shadow-lg">
              {isLoadingInsight ? t('sd_ai_generating') : t('sd_ai_generate')}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-10">
          <div className="bg-asis-card p-10 rounded-[2.5rem] border border-asis-border shadow-xl">
            <h3 className="text-2xl font-black mb-8">{t('sd_record_entry')}</h3>
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2 p-1.5 bg-asis-bg/50 rounded-2xl">
                {Object.values(MeritCategory).map(cat => (
                  <button key={cat} onClick={() => setActiveMeritTab(cat)} className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeMeritTab === cat ? 'bg-asis-primary text-asis-text shadow-md' : 'text-asis-text opacity-40'}`}>
                    {getCategoryLabel(cat)}
                  </button>
                ))}
                <button onClick={() => setActiveMeritTab('DEMERIT' as any)} className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${(activeMeritTab as any) === 'DEMERIT' ? 'bg-rose-600 text-white shadow-md' : 'text-rose-500 opacity-60'}`}>
                  {t('cat_demerit')}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[300px]">
                {COMMON_REASONS.filter(r => (activeMeritTab as any) === 'DEMERIT' ? r.type === BehaviorType.DEMERIT : r.category === activeMeritTab).map(reason => (
                  <button key={reason.id} onClick={() => setPendingUpdate({ type: reason.type, reason: t(reason.labelKey as any), points: reason.points, category: reason.category })} className="w-full text-left p-6 rounded-3xl border-2 border-asis-border hover:bg-asis-bg/30 flex justify-between items-center transition-all">
                    <span className="font-black text-asis-text">{t(reason.labelKey as any)}</span>
                    <span className="font-black text-xl" style={{ color: reason.points > 0 ? '#10b981' : '#ef4444' }}>{reason.points > 0 ? `+${reason.points}` : reason.points}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-asis-card p-10 rounded-[2.5rem] border border-asis-border shadow-xl">
            <h3 className="text-2xl font-black mb-8">{t('sd_timeline')}</h3>
            <div className="space-y-4">
              {student.records.length > 0 ? student.records.map(record => (
                <div key={record.id} className="flex items-center gap-6 p-6 rounded-3xl bg-asis-bg/30">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-black text-xl" style={{ color: record.points > 0 ? '#10b981' : '#ef4444' }}>{record.points > 0 ? '+' : '-'}</div>
                  <div className="flex-1">
                    <h4 className="text-lg font-black">{record.reason}</h4>
                    <p className="text-[10px] font-black opacity-30 uppercase">{new Date(record.timestamp).toLocaleString()} • {record.teacherName}</p>
                  </div>
                  <div className="text-2xl font-black" style={{ color: record.points > 0 ? '#10b981' : '#ef4444' }}>{record.points > 0 ? `+${record.points}` : record.points}</div>
                </div>
              )) : <div className="text-center py-20 font-black opacity-20">{t('sd_no_records')}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;
