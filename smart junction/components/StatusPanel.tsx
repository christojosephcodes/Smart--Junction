
import React from 'react';
import { LaneState, SignalState } from '../types';

interface StatusPanelProps {
  lanes: LaneState[];
  logs: string[];
  activeIndex: number;
  isIntelliMode: boolean;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ lanes, logs, activeIndex, isIntelliMode }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-2xl min-h-0">
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/80 flex justify-between items-center">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
          <i className="fas fa-chart-line text-emerald-500"></i>
          ANALYTICS COMPARISON
        </h3>
        <div className={`text-[9px] font-black px-2 py-0.5 rounded border ${isIntelliMode ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' : 'border-blue-500/30 text-blue-400 bg-blue-500/5'}`}>
          MODE: {isIntelliMode ? 'INTELLI (AI)' : 'NORMAL (FIXED)'}
        </div>
      </div>
      
      <div className="p-4 flex-1 space-y-3 overflow-y-auto custom-scrollbar">
        {/* Lane Analysis Summary */}
        <div className="grid gap-3">
          {lanes.map((lane) => {
            const normalTime = 20;
            const intelliTime = Math.max(10, Math.min(60, lane.vehicleCount * 3));
            const isTarget = activeIndex === lane.id;

            return (
              <div 
                key={lane.id} 
                className={`p-3 rounded-lg border transition-all duration-300 ${isTarget ? 'bg-slate-800/50 border-emerald-500/30 shadow-lg' : 'bg-slate-950/40 border-slate-800'}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isTarget ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {lane.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-[8px] text-slate-500 font-bold uppercase">Normal Timing</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-800 h-1.5 rounded-full">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(normalTime / 60) * 100}%` }}></div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{normalTime}s</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[8px] text-emerald-500/70 font-bold uppercase flex justify-between">
                      <span>Intelli Timing</span>
                      {isIntelliMode && isTarget && <span className="animate-pulse text-[7px] bg-emerald-500 text-white px-1 rounded">ACTIVE</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-800 h-1.5 rounded-full">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(intelliTime / 60) * 100}%` }}></div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400">{intelliTime}s</span>
                    </div>
                  </div>
                </div>

                {isIntelliMode && (
                  <div className="mt-2 text-[8px] flex items-center gap-2 font-bold uppercase">
                    <span className="text-slate-500">Efficiency Gain:</span>
                    <span className={intelliTime < normalTime ? 'text-emerald-400' : 'text-amber-400'}>
                      {intelliTime < normalTime 
                        ? `${Math.abs(normalTime - intelliTime)}s Saved (Optimized)` 
                        : `${Math.abs(normalTime - intelliTime)}s Added (Demand Handling)`}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mode Impact Insight */}
        <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
          <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">
            System Performance Insight
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed italic">
            {isIntelliMode 
              ? "AI Mode is actively modulating throughput. Energy consumption minimized by reducing idle wait times at low traffic density."
              : "Fixed Cycle Mode in operation. Potential congestion build-up detected in high-density lanes due to lack of adaptive timing."}
          </p>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </div>
  );
};

export default StatusPanel;
