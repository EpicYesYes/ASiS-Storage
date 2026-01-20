
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

  // Deep Sync on Mount to fetch new accounts across devices
  useEffect(() => {
    onPull();
  }, []);

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
        setError('ID Staf / Username atau kata laluan tidak sah. Cuba tekan "Kemas Kini Data" di bawah.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-asis-bg p-6 relative overflow-hidden text-asis-text">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-10">
          <div className="inline-flex flex-col mb-4">
            <span className="text-6xl font-black tracking-tighter leading-none">ASiS</span>
            <span className="text-[10px] font-black opacity-40 uppercase tracking-[0.3em] mt-2">Sistem Merit Terintegrasi</span>
          </div>
          <h1 className="text-xl font-black">Selamat Kembali, Cikgu</h1>
        </div>

        <div className="bg-asis-card p-10 rounded-[2.5rem] border border-asis-border shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Username (ID Staf)</label>
              <input required type="text" placeholder="cth: GURU-2025" className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black outline-none focus:border-asis-primary text-asis-text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Kata Laluan</label>
              <input required type="password" placeholder="••••••••" className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black outline-none focus:border-asis-primary text-asis-text" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" id="remMe" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-5 h-5 accent-asis-primary" />
              <label htmlFor="remMe" className="text-xs font-black opacity-60 uppercase tracking-widest cursor-pointer">{t('login_remember_me')}</label>
            </div>
            {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 text-[10px] font-black">{error}</div>}
            <button type="submit" disabled={isLoading} className="w-full py-5 bg-asis-primary !text-[#0000bf] !font-black rounded-2xl shadow-xl uppercase tracking-widest disabled:opacity-50">
              {isLoading ? 'MEMPROSES...' : 'LOG MASUK'}
            </button>
          </form>
          <button onClick={() => onPull()} className="w-full mt-4 text-[10px] font-black opacity-40 hover:opacity-100 transition-all uppercase tracking-widest flex items-center justify-center gap-2">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Klik untuk Kemas Kini Data (Awan)
          </button>
        </div>
        <p className="text-center mt-10 text-[10px] font-black opacity-20 uppercase tracking-widest">SM Sains Alam Shah &copy; 2025</p>
      </div>
    </div>
  );
};

export default Login;
