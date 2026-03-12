import React from 'react';
import { LaneState, SignalState } from '../types';

interface VideoFeedProps {
  lane: LaneState;
  onUpload: (url: string) => void;
  isActive: boolean;
  videoRef: (el: HTMLVideoElement | null) => void;
  isProcessing?: boolean;
}

const VideoFeed: React.FC<VideoFeedProps> = ({ lane, onUpload, isActive, videoRef, isProcessing }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpload(url);
    }
  };

  // Determine color for the countdown based on remaining time
  const getTimerColor = (time: number) => {
    if (time > 10) return 'text-emerald-400';
    if (time > 5) return 'text-amber-400';
    return 'text-rose-500';
  };

  return (
    <div className={`relative bg-slate-900/40 rounded-xl border overflow-hidden flex flex-col group transition-all duration-500 ${isActive ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)] scale-[1.01]' : 'border-slate-800'}`}>
      {/* Top Header */}
      <div className="p-2 flex justify-between items-center z-10 bg-slate-950/95 border-b border-slate-800/50">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-200 flex items-center gap-2 uppercase tracking-tighter">
            <i className={`fas fa-video text-[8px] ${isActive ? 'text-emerald-500 animate-pulse' : 'text-slate-600'}`}></i>
            {lane.name}
          </span>
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-0.5">Live Cam 0{lane.id + 1}</span>
        </div>
        
        <div className="flex items-center gap-3">
           {isActive && (
             <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-black/50 border border-slate-800">
                <span className={`text-[10px] font-mono font-black ${getTimerColor(lane.remainingTime)}`}>
                  T-MINUS: {lane.remainingTime}s
                </span>
             </div>
           )}
        </div>
      </div>

      <div className="relative bg-black aspect-video overflow-hidden">
        {lane.videoUrl ? (
          <>
            <video 
              ref={videoRef}
              src={lane.videoUrl} 
              className={`w-full h-full object-cover transition-opacity duration-500 ${isProcessing ? 'opacity-30' : 'opacity-70 group-hover:opacity-90'}`} 
              autoPlay 
              loop 
              muted 
              crossOrigin="anonymous"
            />
            {isProcessing && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400/50 animate-[scan_2s_linear_infinite]"></div>
              </div>
            )}
            
            {/* Visual HUD Countdown Overlay */}
            {isActive && (
              <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
                <div className="bg-black/80 backdrop-blur-md border border-slate-700/50 rounded-lg p-2 flex flex-col items-center min-w-[60px] shadow-2xl">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">SEC REMAINING</span>
                  <div className={`text-3xl font-mono font-black tabular-nums leading-none ${getTimerColor(lane.remainingTime)}`}>
                    {lane.remainingTime.toString().padStart(2, '0')}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 p-4 rounded-xl flex flex-col items-center gap-3 transition-all border border-slate-700 border-dashed hover:border-emerald-500/50">
              <i className="fas fa-plug text-2xl text-emerald-500"></i>
              <span className="text-[10px] font-black uppercase tracking-widest">Connect Feed</span>
              <input type="file" className="hidden" accept="video/*" onChange={handleFileChange} />
            </label>
          </div>
        )}

        {/* Emergency Alert Overlay */}
        {lane.isEmergency && (
          <div className="absolute inset-0 bg-rose-900/40 flex flex-col items-center justify-center border-4 border-rose-600 animate-pulse z-30 pointer-events-none">
            <div className="bg-rose-600 text-white px-4 py-2 rounded font-black text-xs shadow-2xl tracking-tighter uppercase border border-white/20">
              PRIORITY VEHICLE DETECTED
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-950 mt-auto flex items-center justify-between border-t border-slate-800/60">
        <div className="flex items-center gap-3">
           <div className={`w-3 h-3 rounded-full ${lane.signal === SignalState.GREEN ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]'} transition-all duration-300`}></div>
           <span className={`text-[10px] font-black tracking-widest uppercase ${lane.signal === SignalState.GREEN ? 'text-emerald-400' : 'text-rose-500'}`}>
             {lane.signal}
           </span>
        </div>
        <div className="flex-1 ml-4 overflow-hidden border-l border-slate-800 pl-4">
           <div className="text-[8px] font-black text-slate-600 uppercase tracking-tight">AI Observation</div>
           <div className="text-[10px] font-mono text-slate-400 truncate italic">
             {lane.aiInsight || 'System monitoring...'}
           </div>
        </div>
      </div>
      
      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
};

export default VideoFeed;