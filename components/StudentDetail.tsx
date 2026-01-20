
import React, { useState, useRef } from 'react';
import { Student, StudentRecord, BehaviorType, TeacherProfile, MeritCategory } from '../types';
import { HOUSE_COLORS } from '../constants';

interface StudentDetailProps {
  student: Student & { totalPoints: number, records: StudentRecord[] };
  teacher: TeacherProfile;
  onBack: () => void;
  onUpdate: (id: string, record: any) => void;
  onUpdateAvatar: (id: string, newAvatar: string) => void;
  onRemove: (id: string) => void;
  t: (key: any) => string;
}

const compressAvatar = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 90; canvas.height = 90;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(img, 0, 0, 90, 90);
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      } else resolve(base64Str);
    };
  });
};

const StudentDetail: React.FC<StudentDetailProps> = ({ student, onBack, onUpdate, t }) => {
  const houseColor = HOUSE_COLORS[student.house] || '#6366f1';

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 text-asis-text">
      <button onClick={onBack} className="flex items-center gap-2 opacity-40 hover:opacity-100 font-black">Back</button>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="bg-asis-card p-10 rounded-[2.5rem] border border-asis-border shadow-xl text-center">
          <div className="w-48 h-48 mx-auto bg-asis-bg rounded-[3rem] overflow-hidden mb-6 border-4 border-white shadow-xl">
            <img src={student.avatar} className="w-full h-full object-cover" />
          </div>
          <h2 className="text-3xl font-black">{student.firstName} {student.lastName}</h2>
          <p className="font-black uppercase mt-2" style={{ color: houseColor }}>{student.house} • {student.classGroup}</p>
          <div className="mt-8 p-6 bg-asis-bg/30 rounded-3xl">
            <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">Total Points</p>
            <p className="text-6xl font-black mt-2">{student.totalPoints}</p>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-asis-card p-8 rounded-[2.5rem] border border-asis-border">
            <h3 className="text-xl font-black mb-6">Rekod Terkini</h3>
            <div className="space-y-4">
              {student.records.map(r => (
                <div key={r.id} className="p-4 bg-asis-bg/20 rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="font-black">{r.reason}</p>
                    <p className="text-[10px] opacity-40 uppercase font-black">{new Date(r.timestamp).toLocaleDateString()} • {r.teacherName}</p>
                  </div>
                  <p className={`font-black text-lg ${r.points > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{r.points > 0 ? `+${r.points}` : r.points}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;
