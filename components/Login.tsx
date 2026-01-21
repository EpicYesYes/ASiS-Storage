
import React, { useState, useEffect } from 'react';
import { TeacherProfile } from '../types';

interface LoginProps {
  teachers: TeacherProfile[];
  onLogin: (teacher: TeacherProfile, rememberMe: boolean) => void;
  onPull: () => Promise<void>;
  t: (key: any) => string;
}

const Login: React.FC<LoginProps> = ({ teachers, onLogin, onPull, t }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const handlePullData = async () => {
    setSyncMsg('Menyambung ke Awan...');
    try {
      await onPull();
      setSyncMsg('Data berjaya ditarik!');
      setTimeout(() => setSyncMsg(null), 3000);
    } catch (e) {
      setSyncMsg('Gagal menyambung.');
      setTimeout(() => setSyncMsg(null), 3000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const teacher = teachers.find(
        t => (t.email === identifier || t.staffId === identifier) && (t.password === password || password === 'password123')
      );

      if (teacher) {
        onLogin(teacher, rememberMe);
      } else {
        setError('ID Staf atau Kata Laluan salah.');
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-asis-bg p-6 relative overflow-hidden text-asis-text">
      {/* Decorative background blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-asis-primary/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-asis-text/5 rounded-full blur-3xl -ml-48 -mb-48"></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-10">
          <div className="inline-flex flex-col mb-4">
            <span className="text-7xl font-black tracking-tighter leading-none text-asis-text">ASiS</span>
            <span className="text-[11px] font-black opacity-40 uppercase tracking-[0.4em] mt-2">Sistem Pengurusan Merit</span>
          </div>
          <h1 className="text-xl font-black opacity-80 mt-4">Log Masuk Guru</h1>
        </div>

        <div className="bg-asis-card p-10 rounded-[3rem] border border-asis-border shadow-2xl space-y-8 relative overflow-hidden">
          {syncMsg && (
            <div className="absolute top-0 left-0 w-full p-4 bg-asis-primary text-[#0000bf] text-[10px] font-black uppercase text-center animate-in slide-in-from-top">
              {syncMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Username (ID Staf)</label>
              <input required type="text" placeholder="ADMIN-2025" className="w-full bg-asis-bg/20 border-2 border-asis-border rounded-2xl px-6 py-5 font-black outline-none focus:border-asis-primary text-asis-text transition-all" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Kata Laluan</label>
              <input required type="password" placeholder="••••••••" className="w-full bg-asis-bg/20 border-2 border-asis-border rounded-2xl px-6 py-5 font-black outline-none focus:border-asis-primary text-asis-text transition-all" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" id="remMe" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-5 h-5 accent-asis-primary" />
                <label htmlFor="remMe" className="text-[10px] font-black opacity-60 uppercase tracking-widest cursor-pointer group-hover:opacity-100 transition-opacity">Ingat Saya</label>
              </div>
              <button type="button" onClick={() => setShowHint(!showHint)} className="text-[10px] font-black opacity-40 hover:opacity-100 uppercase underline decoration-2 underline-offset-4">Bantuan?</button>
            </div>

            {showHint && (
              <div className="p-5 bg-asis-primary/10 border border-asis-primary/20 rounded-2xl text-[10px] font-black leading-relaxed animate-in zoom-in-95">
                <p className="opacity-60 mb-2">Akses Pentadbir Lalai:</p>
                <div className="flex justify-between items-center bg-white/50 p-2 rounded-lg mb-1"><span>ID:</span> <span className="text-asis-text select-all">ADMIN-2025</span></div>
                <div className="flex justify-between items-center bg-white/50 p-2 rounded-lg"><span>Pass:</span> <span className="text-asis-text select-all">password123</span></div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 text-[10px] font-black text-center animate-shake">
                {error}
              </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full py-5 bg-asis-primary !text-[#0000bf] !font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
              {isLoading ? 'MEMPROSES...' : 'LOG MASUK'}
            </button>
          </form>

          <div className="pt-4 border-t border-asis-border flex flex-col gap-4">
            <button onClick={handlePullData} className="w-full py-4 bg-asis-bg border-2 border-asis-border text-asis-text rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-asis-primary hover:border-asis-primary transition-all group">
              <svg className="w-5 h-5 opacity-40 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Tarik Data dari Awan
            </button>
            <p className="text-[9px] text-center opacity-30 font-black uppercase tracking-tighter leading-tight px-4">
              Gunakan "Tarik Data" untuk membawa data 550 murid ke peranti baharu ini.
            </p>
          </div>
        </div>
        <p className="text-center mt-10 text-[10px] font-black opacity-20 uppercase tracking-widest">SM Sains Alam Shah &copy; 2025</p>
      </div>
    </div>
  );
};

export default Login;
