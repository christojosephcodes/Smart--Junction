
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between shadow-2xl relative z-50">
      <div className="flex items-center gap-4">
        {/* New Brand Logo Integration */}
        <div className="h-12 bg-white px-3 py-1 rounded-lg flex items-center justify-center shadow-lg shadow-white/5 overflow-hidden">
          <img 
            src="https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/intelli-signal-logo.png" 
            alt="Intelli-Signal Logo" 
            className="h-full w-auto object-contain"
            onError={(e) => {
              // Fallback to stylized icon if image fails to load
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.className = "w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-900/20";
                const icon = document.createElement('i');
                icon.className = 'fas fa-traffic-light text-white text-xl';
                parent.appendChild(icon);
              }
            }}
          />
        </div>
        
        <div className="flex flex-col">
          <h1 className="text-lg font-black tracking-tight text-slate-100 leading-none">
            INTELLI-SIGNAL <span className="text-emerald-500">AI</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Hybrid Traffic Command Center
          </p>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-6">
        <div className="flex flex-col items-end text-right">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">System Health</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-400">NOMINAL</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
        </div>
        <div className="h-8 w-px bg-slate-800"></div>
        <div className="flex flex-col items-end text-right">
           <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Solar Grid</span>
           <span className="text-xs font-mono text-amber-400">ACTIVE - 94%</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
