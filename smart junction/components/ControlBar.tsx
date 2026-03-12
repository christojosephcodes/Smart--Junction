import React from 'react';

interface ControlBarProps {
  isTransmitting?: boolean;
  targetIp?: string;
}

const ControlBar: React.FC<ControlBarProps> = ({ isTransmitting, targetIp }) => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 px-6 py-3 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-50">
      <div className="flex items-center gap-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">
        <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-950 rounded border border-slate-800/50">
          <i className={`fas fa-network-wired transition-colors duration-300 ${isTransmitting ? 'text-blue-400' : 'text-slate-700'}`}></i>
          <span className="text-slate-400">Uplink:</span>
          <span className="font-mono text-slate-100">{targetIp || '192.168.1.2:5005'}</span>
          {isTransmitting && (
            <div className="flex gap-1 ml-1">
              <div className="w-1 h-3 bg-blue-500 animate-[bounce_0.6s_infinite]"></div>
              <div className="w-1 h-3 bg-blue-500 animate-[bounce_0.6s_infinite_0.1s]"></div>
              <div className="w-1 h-3 bg-blue-500 animate-[bounce_0.6s_infinite_0.2s]"></div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <i className="fas fa-microchip text-emerald-500"></i>
          <span>Process: 12.4ms</span>
        </div>
        
        <div className="flex items-center gap-2 hidden md:flex">
          <i className="fas fa-shield-alt text-blue-500"></i>
          <span>Encrypted Tunnel: AES-256</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end mr-4 border-r border-slate-800 pr-4 hidden sm:flex">
          <span className="text-[8px] text-slate-600 font-bold uppercase leading-none">Uptime</span>
          <span className="text-[10px] font-mono text-slate-400">12:45:02</span>
        </div>
        <button className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
          <i className="fas fa-sliders-h text-xs"></i>
        </button>
        <button className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
          <i className="fas fa-info-circle text-xs"></i>
        </button>
      </div>
    </footer>
  );
};

export default ControlBar;