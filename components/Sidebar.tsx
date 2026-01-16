
import React from 'react';
import { View } from '../types';

interface SidebarProps {
  activeView: View;
  setView: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
  t: (key: any) => string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setView, isOpen, onClose, t }) => {
  const items = [
    { id: 'dashboard', label: t('nav_dashboard'), icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
    )},
    { id: 'students', label: t('nav_students'), icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
    )},
    { id: 'cases', label: t('nav_cases'), icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
    )},
    { id: 'admin', label: t('nav_admin'), icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
    )}
  ];

  return (
    <aside className={`
      fixed lg:static inset-y-0 left-0 z-50 w-64 bg-asis-card text-asis-text flex flex-col shrink-0 border-r border-asis-border
      transition-transform duration-300 ease-in-out transform 
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="p-8 mb-4 border-b border-asis-border flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-4xl font-black tracking-tighter leading-none">ASiS</span>
          <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-2">{t('school_name')}</span>
        </div>
        <button onClick={onClose} className="lg:hidden p-2 opacity-40 hover:opacity-100 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <nav className="flex-1 px-4 mt-6 space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as View)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-[#0000bf] !font-black ${
              activeView === item.id || (activeView === 'student-detail' && item.id === 'students')
                ? 'bg-asis-primary shadow-lg shadow-asis-primary/20' 
                : 'hover:bg-asis-text/10'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 mt-auto">
        <div className="bg-asis-text/5 rounded-2xl p-4 border border-asis-border">
          <p className="text-[10px] opacity-40 uppercase font-black tracking-widest mb-2">{t('system_status')}</p>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-black">{t('active_safe')}</span>
          </div>
          <p className="text-[10px] opacity-30 font-medium italic">ASiS Merit v2.5</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
