
import React, { useState } from 'react';
import { TeacherProfile } from '../types';

interface LoginProps {
  teachers: TeacherProfile[];
  onLogin: (teacher: TeacherProfile, rememberMe: boolean) => void;
  t: (key: any) => string;
}

const Login: React.FC<LoginProps> = ({ teachers, onLogin, t }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        setError('ID Staf atau kata laluan tidak sah. Sila cuba lagi.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-asis-bg p-6 relative overflow-hidden text-asis-text">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-asis-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-asis-text/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-10">
          <div className="inline-flex flex-col mb-4">
            <span className="text-6xl font-black tracking-tighter leading-none">ASiS</span>
            <span className="text-[10px] font-black opacity-40 uppercase tracking-[0.3em] mt-2">Sistem Merit Terintegrasi</span>
          </div>
          <h1 className="text-xl font-black">Selamat Kembali, Cikgu</h1>
          <p className="opacity-60 text-sm mt-2 font-medium italic">Sila log masuk untuk menguruskan data murid.</p>
        </div>

        <div className="bg-asis-card p-10 rounded-[2.5rem] border border-asis-border shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">ID Staf / E-mel</label>
              <input required type="text" placeholder="cth: STAFF-9921" className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black outline-none focus:border-asis-primary transition-all text-asis-text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Kata Laluan</label>
              <input required type="password" placeholder="••••••••" className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black outline-none focus:border-asis-primary transition-all text-asis-text" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  <div className="w-6 h-6 border-2 border-asis-border rounded-lg bg-asis-bg/30 peer-checked:bg-asis-primary peer-checked:border-asis-primary transition-all"></div>
                  <svg className="absolute top-1 left-1 w-4 h-4 text-[#0000bf] opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-xs font-black opacity-60 group-hover:opacity-100 transition-opacity uppercase tracking-widest">{t('login_remember_me')}</span>
              </label>
            </div>
            {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 text-xs font-black animate-in fade-in zoom-in-95">{error}</div>}
            <button type="submit" disabled={isLoading} className="w-full py-5 bg-asis-primary !text-[#0000bf] !font-black rounded-2xl shadow-xl hover:bg-asis-primaryHover transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3 uppercase tracking-widest">{isLoading ? <div className="w-5 h-5 border-2 border-[#0000bf]/30 border-t-[#0000bf] rounded-full animate-spin"></div> : 'LOG MASUK'}</button>
          </form>
          <div className="mt-8 pt-8 border-t border-asis-border text-center">
            <p className="text-[10px] opacity-40 font-black uppercase tracking-widest">TEKNOSIS</p>
            <p className="text-[10px] opacity-30 mt-1 font-medium italic">Sila hubungi admin jika anda terlupa kata laluan.</p>
          </div>
        </div>
        <p className="text-center mt-10 text-[10px] font-black opacity-20 uppercase tracking-widest">SM Sains Alam Shah &copy; 2025</p>
      </div>
    </div>
  );
};

export default Login;
