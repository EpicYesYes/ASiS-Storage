
import React, { useState, useRef } from 'react';
import { Student, StudentRecord, BehaviorType, TeacherProfile, MeritCategory } from '../types';
import { COMMON_REASONS, HOUSE_COLORS } from '../constants';
import { getBehaviorInsight } from '../services/geminiService';
import { GoogleGenAI } from "@google/genai";

interface StudentDetailProps {
  student: Student & { totalPoints: number, records: StudentRecord[] };
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

const compressImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 150; canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(img, 0, 0, 150, 150);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      } else resolve(base64Str);
    };
  });
};

const StudentDetail: React.FC<StudentDetailProps> = ({ student, teacher, onBack, onUpdate, onUpdateAvatar, t }) => {
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
          parts: [{ text: `A clean professional school portrait headshot for a student named ${student.firstName}. Consistent soft lighting.` }]
        },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData) {
            const compressed = await compressImage(`data:image/png;base64,${part.inlineData.data}`);
            onUpdateAvatar(student.id, compressed);
            break;
          }
        }
      }
    } catch (error) {
      console.error(error);
      alert("AI Gagal menjana imej.");
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        onUpdateAvatar(student.id, compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 text-asis-text">
      {pendingUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-asis-card rounded-3xl shadow-2xl max-w-md w-full p-8 text-center border-t-8 border-asis-primary">
            <h3 className="text-xl font-black mb-2">{t('sd_confirm_title')}</h3>
            <p className="opacity-60 mb-8 leading-relaxed">Sahkan rekod: {pendingUpdate.reason} ({pendingUpdate.points} mata)?</p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmUpdate} className="w-full py-4 rounded-xl font-black text-asis-text shadow-lg bg-asis-primary">Sahkan</button>
              <button onClick={() => setPendingUpdate(null)} className="w-full py-3 font-black opacity-40">Batal</button>
            </div>
          </div>
        </div>
      )}

      <button onClick={onBack} className="flex items-center gap-2 opacity-40 hover:opacity-100 font-black">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        {t('sd_back_dir')}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-asis-card p-10 rounded-[2.5rem] border border-asis-border shadow-xl text-center">
            <div className="w-48 h-48 mx-auto bg-asis-bg rounded-[3rem] overflow-hidden mb-6 border-4 border-white shadow-xl relative group">
              <img src={student.avatar} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <button onClick={() => fileInputRef.current?.click()} className="text-white text-xs font-black">TUKAR</button>
              </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            
            <h2 className="text-3xl font-black">{student.firstName} {student.lastName}</h2>
            <p className="font-black uppercase mt-2" style={{ color: houseColor }}>{student.house} • {student.classGroup}</p>
            
            <div className="mt-8 p-6 bg-asis-bg/30 rounded-3xl">
              <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">{t('sd_total_merit')}</p>
              <p className={`text-6xl font-black mt-2 ${student.totalPoints >= 100 ? 'text-emerald-500' : 'text-rose-500'}`}>{student.totalPoints}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
               <button onClick={handleGenerateAvatar} disabled={isGeneratingAvatar} className="py-2 bg-asis-bg border border-asis-border rounded-xl text-[10px] font-black uppercase disabled:opacity-50">{isGeneratingAvatar ? '...' : 'AI Avatar'}</button>
               <button onClick={handleGenerateInsight} disabled={isLoadingInsight} className="py-2 bg-asis-primary text-asis-text rounded-xl text-[10px] font-black uppercase disabled:opacity-50">Analisis AI</button>
            </div>
          </div>
          
          {insight && (
            <div className="bg-asis-text text-asis-bg p-8 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-4">
              <h3 className="text-xl font-black mb-4">Ulasan AI</h3>
              <p className="opacity-80 text-sm leading-relaxed italic">"{insight}"</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-asis-card p-8 rounded-[2.5rem] border border-asis-border shadow-lg">
            <h3 className="text-xl font-black mb-6">{t('sd_record_entry')}</h3>
            <div className="flex bg-asis-bg/50 p-1 rounded-2xl mb-6">
               {Object.values(MeritCategory).map(cat => (
                  <button key={cat} onClick={() => setActiveMeritTab(cat)} className={`flex-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeMeritTab === cat ? 'bg-asis-primary shadow-sm' : 'opacity-40'}`}>{cat}</button>
               ))}
               <button onClick={() => setActiveMeritTab('DEMERIT' as any)} className={`flex-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${(activeMeritTab as any) === 'DEMERIT' ? 'bg-rose-600 text-white' : 'text-rose-500 opacity-60'}`}>Demerit</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {COMMON_REASONS.filter(r => (activeMeritTab as any) === 'DEMERIT' ? r.type === BehaviorType.DEMERIT : r.category === activeMeritTab).map(reason => (
                <button key={reason.id} onClick={() => setPendingUpdate({ type: reason.type, reason: t(reason.labelKey as any), points: reason.points, category: reason.category })} className="p-4 border-2 border-asis-border rounded-2xl hover:bg-asis-bg/30 text-left flex justify-between items-center transition-all">
                  <span className="text-xs font-black">{t(reason.labelKey as any)}</span>
                  <span className={`font-black ${reason.points > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{reason.points > 0 ? `+${reason.points}` : reason.points}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-asis-card p-8 rounded-[2.5rem] border border-asis-border shadow-lg">
            <h3 className="text-xl font-black mb-6">{t('sd_timeline')}</h3>
            <div className="space-y-4">
              {student.records.length > 0 ? student.records.map(r => (
                <div key={r.id} className="p-4 bg-asis-bg/20 rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="font-black text-sm">{r.reason}</p>
                    <p className="text-[10px] opacity-40 uppercase font-black">{new Date(r.timestamp).toLocaleDateString()} • {r.teacherName}</p>
                  </div>
                  <p className={`font-black text-lg ${r.points > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{r.points > 0 ? `+${r.points}` : r.points}</p>
                </div>
              )) : <div className="text-center py-10 opacity-20 font-black">Tiada rekod.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;
