
import React, { useState, useRef } from 'react';
import { TeacherProfile } from '../types';
import { SUBJECT_CATEGORIES } from '../constants';
import { Language } from '../translations';

interface AccountPageProps {
  teacher: TeacherProfile;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  onUpdateProfile: (profile: TeacherProfile) => void;
  onLogout: () => void;
  t: (key: any) => string;
}

const AccountPage: React.FC<AccountPageProps> = ({ teacher, theme, setTheme, language, setLanguage, onUpdateProfile, onLogout, t }) => {
  const [showModal, setShowModal] = useState<{ show: boolean; type: 'save' | 'logout' | 'language' | 'password' }>({ show: false, type: 'save' });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<TeacherProfile>({ ...teacher });
  
  const [passwordForm, setPasswordForm] = useState({ old: '', new: '', confirm: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAction = () => {
    if (showModal.type === 'logout') {
      onLogout();
    } else if (showModal.type === 'language') {
      // Logic handled in select onChange now
    } else if (showModal.type === 'password') {
      alert('Password updated successfully!');
      setPasswordForm({ old: '', new: '', confirm: '' });
    } else {
      onUpdateProfile(editForm);
      setIsEditing(false);
      alert('Profile updated successfully!');
    }
    setShowModal({ ...showModal, show: false });
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      setEditForm({ ...teacher });
    }
    setIsEditing(!isEditing);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (isEditing) {
          setEditForm(prev => ({ ...prev, avatar: base64 }));
        } else {
          onUpdateProfile({ ...teacher, avatar: base64 });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSubject = (subject: string) => {
    setEditForm(prev => {
      const subjects = prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject];
      return { ...prev, subjects };
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 px-4 text-asis-text">
      {/* Profile Header Card */}
      <div className="bg-asis-card rounded-[3rem] border border-asis-border shadow-xl relative overflow-hidden group transition-colors duration-300">
        <div className="h-48 bg-gradient-to-r from-asis-text to-asis-text/80 relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(255,191,0,0.4),transparent)]"></div>
          <button 
            onClick={handleToggleEdit}
            className="absolute top-6 right-6 z-20 px-6 py-2 bg-asis-primary text-asis-text font-black rounded-xl hover:bg-asis-primaryHover transition-all flex items-center gap-2 shadow-lg"
          >
            {isEditing ? (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>{t('cancel')}</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>{t('acc_update_profile')}</>
            )}
          </button>
        </div>
        
        <div className="px-10 pb-10 -mt-20 relative z-10 flex flex-col md:flex-row items-end gap-8">
          <div className="relative group/avatar">
            <div className="w-44 h-44 rounded-[3rem] bg-asis-bg border-8 border-asis-card shadow-2xl flex items-center justify-center text-asis-text/30 text-6xl font-black shrink-0 overflow-hidden">
              {(isEditing ? editForm.avatar : teacher.avatar) ? (
                <img src={isEditing ? editForm.avatar : teacher.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                teacher.name.split(' ').map(n => n[0]).join('')
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-[3rem] flex items-center justify-center font-black text-sm backdrop-blur-sm"
            >
              TUKAR FOTO
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>
          
          <div className="flex-1 pb-2">
            {!isEditing ? (
              <>
                <h2 className="text-4xl font-black leading-tight">{teacher.name}</h2>
                <div className="flex flex-wrap gap-3 mt-3">
                  <span className="px-4 py-1.5 bg-asis-primary/20 text-asis-text font-black text-[10px] uppercase tracking-widest rounded-full border border-asis-primary/20">
                    {teacher.roles.join(', ')}
                  </span>
                  <span className="px-4 py-1.5 bg-asis-bg text-asis-text opacity-40 font-black text-[10px] uppercase tracking-widest rounded-full border border-asis-border">
                    ID: {teacher.staffId}
                  </span>
                </div>
              </>
            ) : (
              <div className="space-y-4 w-full">
                <div className="space-y-1">
                  <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Nama Penuh</label>
                  <input 
                    type="text" 
                    value={editForm.name} 
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full text-2xl font-black bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-4 py-2 focus:border-asis-primary outline-none"
                    placeholder="Nama Penuh"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Jawatan (Dikunci oleh Admin)</label>
                  <div className="w-full bg-asis-bg/10 border-2 border-asis-border rounded-2xl px-4 py-2 font-black opacity-30 cursor-not-allowed">
                    {teacher.roles.join(', ')}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {isEditing && (
            <button 
              onClick={() => setShowModal({ show: true, type: 'save' })}
              className="px-10 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-700 transition-all active:scale-95"
            >
              {t('save')}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Subjects Selection */}
          <div className="bg-asis-card p-10 rounded-[2.5rem] border border-asis-border shadow-lg space-y-8 transition-colors duration-300">
            <h3 className="text-2xl font-black flex items-center gap-4">
              <div className="w-3 h-10 bg-asis-primary rounded-full"></div>
              {t('acc_subjects')}
            </h3>
            {isEditing ? (
              <div className="space-y-8">
                {Object.entries(SUBJECT_CATEGORIES).map(([category, subjects]) => (
                  <div key={category} className="space-y-4">
                    <h4 className="text-sm font-black opacity-40 uppercase tracking-widest">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {subjects.map(s => (
                        <button
                          key={s}
                          onClick={() => toggleSubject(s)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 ${editForm.subjects.includes(s) ? 'bg-asis-primary border-asis-primary text-asis-text shadow-md' : 'bg-asis-bg border-asis-border opacity-40 hover:opacity-100'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {teacher.subjects.length > 0 ? teacher.subjects.map(s => (
                  <span key={s} className="px-5 py-2.5 bg-asis-primary/10 text-asis-text font-black rounded-2xl border border-asis-primary/20 text-sm">
                    {s}
                  </span>
                )) : (
                  <p className="opacity-20 italic font-black uppercase text-[10px] tracking-widest">Tiada mata pelajaran didaftarkan.</p>
                )}
              </div>
            )}
          </div>

          {/* Keselamatan */}
          <div className="bg-asis-card p-10 rounded-[2.5rem] border border-asis-border shadow-lg space-y-8 transition-colors duration-300">
            <h3 className="text-2xl font-black flex items-center gap-4">
              <div className="w-3 h-10 bg-rose-500 rounded-full"></div>
              {t('acc_security')}
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black opacity-40 uppercase tracking-widest ml-1">{t('acc_current_pass')}</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black focus:border-rose-500 outline-none transition-all text-asis-text" value={passwordForm.old} onChange={(e) => setPasswordForm({...passwordForm, old: e.target.value})} />
                </div>
                <div className="hidden md:block"></div>
                <div className="space-y-2">
                  <label className="text-xs font-black opacity-40 uppercase tracking-widest ml-1">{t('acc_new_pass')}</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black focus:border-asis-primary outline-none transition-all text-asis-text" value={passwordForm.new} onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black opacity-40 uppercase tracking-widest ml-1">{t('acc_confirm_pass')}</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black focus:border-asis-primary outline-none transition-all text-asis-text" value={passwordForm.confirm} onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})} />
                </div>
              </div>
              <button onClick={() => setShowModal({ show: true, type: 'password' })} disabled={!passwordForm.new || passwordForm.new !== passwordForm.confirm} className="w-full md:w-auto px-10 py-4 bg-asis-primary text-asis-text font-black rounded-2xl hover:bg-asis-primaryHover transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:active:scale-100 tracking-widest">
                {t('acc_update_pass')}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {isEditing && (
             <div className="bg-asis-card p-8 rounded-[2.5rem] border border-asis-border shadow-lg space-y-6">
               <h3 className="text-xl font-black flex items-center gap-3"><div className="w-2 h-8 bg-asis-primary rounded-full"></div>{t('acc_contact_info')}</h3>
               <div className="space-y-4">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">{t('acc_official_email')}</label>
                   <input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-4 py-3 font-black outline-none text-asis-text" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">{t('acc_department')}</label>
                   <input type="text" value={editForm.department} onChange={(e) => setEditForm({...editForm, department: e.target.value})} className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-4 py-3 font-black outline-none text-asis-text" />
                 </div>
               </div>
             </div>
          )}

          <div className="bg-asis-card p-8 rounded-[2.5rem] border border-asis-border shadow-lg space-y-6 transition-colors duration-300">
            <h3 className="text-xl font-black flex items-center gap-3"><div className="w-2 h-8 bg-asis-primary rounded-full"></div>{t('acc_app_theme')}</h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'light', label: t('acc_theme_light'), icon: '☀️' },
                { id: 'dark', label: t('acc_theme_dark'), icon: '🌙' },
                { id: 'system', label: t('acc_theme_system'), icon: '💻' }
              ].map((tItem) => (
                <button 
                  key={tItem.id} 
                  onClick={() => setTheme(tItem.id as any)} 
                  className={`flex items-center gap-4 px-6 py-4 rounded-2xl border-2 transition-all font-black ${theme === tItem.id ? 'border-asis-primary bg-asis-primary/10 text-asis-text shadow-md' : 'border-asis-border bg-asis-bg/20 opacity-40 hover:opacity-100'}`}
                >
                  <span className="text-xl">{tItem.icon}</span>{tItem.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-asis-text text-asis-bg p-8 rounded-[2.5rem] shadow-2xl space-y-6 transition-colors duration-300">
            <h3 className="text-xl font-black flex items-center gap-3">{t('acc_teacher_impact')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 p-5 rounded-3xl border border-white/10 text-center">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Merit</p>
                <h4 className="text-3xl font-black">{teacher.meritsGiven}</h4>
              </div>
              <div className="bg-white/10 p-5 rounded-3xl border border-white/10 text-center">
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Demerit</p>
                <h4 className="text-3xl font-black">{teacher.demeritsGiven}</h4>
              </div>
            </div>
          </div>

          <div className="bg-asis-card p-8 rounded-[2.5rem] border border-asis-border shadow-lg space-y-6 transition-colors duration-300">
            <div className="space-y-3">
              <label className="text-xs font-black opacity-40 uppercase tracking-widest ml-1">{t('acc_display_lang')}</label>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value as Language)} 
                className="w-full bg-asis-bg/30 border-2 border-asis-border rounded-2xl px-6 py-4 font-black text-asis-text outline-none focus:border-asis-primary appearance-none cursor-pointer"
              >
                <option value="ms">Bahasa Melayu</option>
                <option value="en">English (UK)</option>
              </select>
            </div>
            <button onClick={() => setShowModal({ show: true, type: 'logout' })} className="w-full py-5 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 transition-all active:scale-[0.98] shadow-sm uppercase tracking-widest">
              {t('acc_logout')}
            </button>
          </div>
        </div>
      </div>

      {showModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-asis-card rounded-[3rem] shadow-2xl max-w-md w-full p-10 text-center border-t-8 border-asis-primary animate-in zoom-in-95 duration-300 border-x border-b border-asis-border">
            <div className={`w-20 h-20 rounded-3xl mx-auto mb-8 flex items-center justify-center ${showModal.type === 'logout' ? 'bg-rose-500/10 text-rose-500' : 'bg-asis-primary/10 text-asis-text'}`}>
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">{showModal.type === 'logout' ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}</svg>
            </div>
            <h3 className="text-2xl font-black mb-3">{showModal.type === 'logout' ? t('acc_confirm_logout') : t('confirm')}</h3>
            <p className="opacity-60 font-medium leading-relaxed mb-10">{showModal.type === 'logout' ? t('acc_logout_desc') : 'Adakah anda pasti mahu menyimpan perubahan ini?'}</p>
            <div className="flex flex-col gap-4">
              <button onClick={handleAction} className={`w-full py-5 rounded-2xl font-black text-asis-text shadow-xl transform transition-transform active:scale-95 ${showModal.type === 'logout' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-asis-primary hover:bg-asis-primaryHover'}`}>
                {t('acc_yes_confirm')}
              </button>
              <button onClick={() => setShowModal({ ...showModal, show: false })} className="w-full py-4 font-black opacity-40 hover:opacity-60 transition-all">{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPage;
