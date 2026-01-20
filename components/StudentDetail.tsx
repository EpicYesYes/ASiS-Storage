
import React, { useState, useRef } from 'react';
import { Student, StudentRecord, BehaviorType, TeacherProfile, MeritCategory } from '../types';
import { COMMON_REASONS, HOUSE_COLORS } from '../constants';
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

const compressAvatar = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 90; // High efficiency size
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(img, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.5)); // Efficient JPEG compression
      } else resolve(base64Str);
    };
  });
};

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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `Headshot of a professional school student named ${student.firstName}. Consistent lighting, portrait.` }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData) {
            const compressed = await compressAvatar(`data:image/png;base64,${part.inlineData.data}`);
            onUpdateAvatar(student.id, compressed);
            break;
          }
        }
      }
    } catch (error) {
      alert("AI Gagal.");
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressAvatar(reader.result as string);
        onUpdateAvatar(student.id, compressed);
      };
      reader.readAsDataURL(file);
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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 text-asis-text">
      {pendingUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-asis-card rounded-3xl shadow-2xl max-w-md w-full p-8 text-center border-t-8" style={{ borderColor: pendingUpdate.points > 0 ? '#10b981' : '#ef4444' }}>
            <h3 className="text-xl font-black mb-2">{t('sd_confirm_title')}</h3>
            <p className="opacity-60 mb-8 leading-relaxed">
              {pendingUpdate.points > 0 ? `+${pendingUpdate.points}` : pendingUpdate.points} mata: <span className="italic">"{pendingUpdate.reason}"</span>?
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmUpdate} className="w-full py-4 rounded-xl font-black text-white shadow-lg bg-asis-primary">Sahkan</button>
              <button onClick={() => setPendingUpdate(null)} className="w-full py-3 font-black opacity-40">Batal</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-all font-black">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          {t('sd_back_dir')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-asis-card p-10 rounded-[2.5rem] border border-asis-border shadow-xl flex flex-col items-center justify-center relative overflow-hidden text-center min-h-[500px]">
            <div className="absolute top-0 left-0 w-full h-40 opacity-10" style={{ backgroundColor: houseColor }}></div>
            <div className="relative z-10 w-full flex flex-col items-center justify-center">
              <div className="relative w-64 h-64 mb-8 bg-asis-bg/20 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-asis-card">
                <img src={student.avatar} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col gap-2 mb-6 w-full max-w-[200px]">
                <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-asis-bg text-asis-text font-black rounded-xl border border-asis-border text-xs">Tukar Foto</button>
                <button onClick={handleGenerateAvatar} disabled={isGeneratingAvatar} className="px-6 py-2 bg-asis-text text-white font-black rounded-xl border border-asis-text text-xs">{isGeneratingAvatar ? 'Menjana...' : 'AI Avatar'}</button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              </div>
              <h2 className="text-3xl font-black leading-tight">{student.firstName} {student.lastName}</h2>
              <p className="font-black text-lg tracking-wide uppercase mt-3" style={{ color: houseColor }}>{student.house} • {student.classGroup}</p>
              <div className="bg-asis-bg/30 p-8 rounded-3xl mt-10 w-full">
                <p className="text-[10px] opacity-40 font-black uppercase tracking-[0.2em] mb-2">{t('sd_total_merit')}</p>
                <p className={`text-6xl font-black ${student.totalPoints >= 100 ? 'text-emerald-500' : 'text-rose-500'}`}>{student.totalPoints}</p>
              </div>
            </div>
          </div>
          <div className="bg-asis-text text-white p-8 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-xl font-black mb-4">{t('sd_ai_analysis')}</h3>
            <p className="opacity-60 text-sm mb-6 leading-relaxed">{insight || t('sd_ai_desc')}</p>
            <button onClick={handleGenerateInsight} disabled={isLoadingInsight} className="w-full text-[#0000bf] font-black py-4 rounded-2xl bg-asis-primary shadow-lg">
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
                  <button key={cat} onClick={() => setActiveMeritTab(cat)} className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeMeritTab === cat ? 'bg-asis-primary text-[#0000bf] shadow-md' : 'opacity-40'}`}>
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
                    <span className="font-black text-xs">{t(reason.labelKey as any)}</span>
                    <span className={`font-black text-xl ${reason.points > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{reason.points > 0 ? `+${reason.points}` : reason.points}</span>
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
                  <div className="flex-1">
                    <h4 className="text-lg font-black">{record.reason}</h4>
                    <p className="text-[10px] font-black opacity-30 uppercase">{new Date(record.timestamp).toLocaleString()} • {record.teacherName}</p>
                  </div>
                  <div className={`text-2xl font-black ${record.points > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{record.points > 0 ? `+${record.points}` : record.points}</div>
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
