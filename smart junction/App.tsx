import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
// Added TrafficDensity to imports to fix type incompatibility
import { LaneState, SignalState, TrafficUpdate, TrafficDensity } from './types';
import { MIN_GREEN, MAX_GREEN, SEC_PER_VEHICLE, EMERGENCY_GREEN } from './constants';
import VideoFeed from './components/VideoFeed';
import StatusPanel from './components/StatusPanel';
import Header from './components/Header';
import ControlBar from './components/ControlBar';

const TARGET_IP = '190.236.57.163';
const TARGET_PORT = '5005';

const App: React.FC = () => {
  const [lanes, setLanes] = useState<LaneState[]>([
    { id: 0, name: 'Road A (Main)', vehicleCount: 0, signal: SignalState.GREEN, remainingTime: 20, videoUrl: null, isEmergency: false, aiInsight: 'Waiting for feed...' },
    { id: 1, name: 'Road B (Cross)', vehicleCount: 0, signal: SignalState.RED, remainingTime: 0, videoUrl: null, isEmergency: false, aiInsight: 'Waiting for feed...' },
    { id: 2, name: 'Road C (Side)', vehicleCount: 0, signal: SignalState.RED, remainingTime: 0, videoUrl: null, isEmergency: false, aiInsight: 'Waiting for feed...' }
  ]);

  const [activeLaneIndex, setActiveLaneIndex] = useState(0);
  const [isIntelliMode, setIsIntelliMode] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isSystemRunning, setIsSystemRunning] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState<Record<number, boolean>>({});
  const [isTransmitting, setIsTransmitting] = useState(false);

  const timerRef = useRef<number | null>(null);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});

  const addLog = (msg: string) => {
    setLogs(prev => [ `${new Date().toLocaleTimeString()} - ${msg}`, ...prev.slice(0, 19)]);
  };

  const transmitSystemUpdate = useCallback(async (currentLanes: LaneState[], activeIdx: number) => {
    if (!isSystemRunning) return;
    
    setIsTransmitting(true);
    const payload: TrafficUpdate = {
      timestamp: Date.now(),
      // Fix: Use TrafficDensity enum members instead of string literals to satisfy TrafficUpdate type
      lanes: currentLanes.map(l => ({
        name: l.name,
        status: l.isEmergency ? TrafficDensity.EMERGENCY : (l.signal === SignalState.GREEN ? TrafficDensity.CLEAR : TrafficDensity.CONGESTION),
        count: l.vehicleCount
      })),
      activeLane: currentLanes[activeIdx].name,
      targetIp: `${TARGET_IP}:${TARGET_PORT}`
    };

    try {
      // Browsers cannot send raw UDP, so we use a POST request to simulate the packet transmission
      // We use a short timeout and no-cors to approximate a 'fire-and-forget' UDP send
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);

      await fetch(`http://${TARGET_IP}:${TARGET_PORT}/traffic-update`, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      addLog(`NETWORK: Uplink packet sent to ${TARGET_IP}`);
    } catch (err) {
      // Fail silently to the user as this is a background broadcast, but log internally
      addLog(`NETWORK: Dispatching state to ${TARGET_IP} (No-Ack)`);
    } finally {
      setTimeout(() => setIsTransmitting(false), 500);
    }
  }, [isSystemRunning]);

  const analyzeLane = async (laneId: number) => {
    const video = videoRefs.current[laneId];
    if (!video || !isSystemRunning || video.paused) return;

    try {
      setIsAiProcessing(prev => ({ ...prev, [laneId]: true }));
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);
      const base64Image = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];

      // Fix: Use correct @google/genai initialization and call pattern
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { inlineData: { mimeType: "image/jpeg", data: base64Image } },
              { text: "Analyze this traffic camera feed. Count the total number of vehicles. Return JSON: { \"count\": number, \"emergency\": boolean, \"description\": string }" }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              count: { type: Type.INTEGER },
              emergency: { type: Type.BOOLEAN },
              description: { type: Type.STRING }
            },
            required: ["count", "emergency", "description"]
          }
        }
      });

      // Fix: Access .text property directly (not a method)
      const result = JSON.parse(response.text || "{}");
      
      setLanes(prev => {
        const next = prev.map(l => l.id === laneId ? {
          ...l,
          vehicleCount: result.count,
          isEmergency: result.emergency || l.isEmergency, 
          aiInsight: result.description
        } : l);
        return next;
      });

      if (result.emergency && !lanes[laneId].isEmergency) {
        addLog(`AI DETECTED EMERGENCY ON ${lanes[laneId].name}: ${result.description}`);
        // Immediately broadcast emergency to network
        transmitSystemUpdate(lanes, activeLaneIndex);
      }

    } catch (err) {
      console.error("AI Analysis Error:", err);
    } finally {
      setIsAiProcessing(prev => ({ ...prev, [laneId]: false }));
    }
  };

  // Automated Cycle Logic
  useEffect(() => {
    if (!isSystemRunning) return;

    timerRef.current = window.setInterval(() => {
      setLanes(prevLanes => {
        const newLanes = [...prevLanes];
        const emergencyLane = newLanes.find(l => l.isEmergency);
        
        if (emergencyLane && emergencyLane.id !== activeLaneIndex) {
          setActiveLaneIndex(emergencyLane.id);
          addLog(`EMERGENCY: Uplink prioritized ${emergencyLane.name}`);
          const updated = newLanes.map((l, i) => ({
            ...l,
            signal: i === emergencyLane.id ? SignalState.GREEN : SignalState.RED,
            remainingTime: i === emergencyLane.id ? EMERGENCY_GREEN : 0
          }));
          transmitSystemUpdate(updated, emergencyLane.id);
          return updated;
        }

        const activeLane = newLanes[activeLaneIndex];
        const nextCount = Math.max(0, activeLane.remainingTime - 1);

        if (nextCount === 0) {
          const nextIdx = (activeLaneIndex + 1) % 3;
          setActiveLaneIndex(nextIdx);
          
          const nextLaneData = newLanes[nextIdx];
          const normalTime = 20; 
          const intelliTime = Math.max(MIN_GREEN, Math.min(MAX_GREEN, nextLaneData.vehicleCount * SEC_PER_VEHICLE));
          const finalDuration = isIntelliMode ? intelliTime : normalTime;
          
          addLog(`NETWORK: Switching broadcast to ${nextLaneData.name}`);
          
          const updated = newLanes.map((l, i) => ({
            ...l,
            isEmergency: i === nextIdx ? l.isEmergency : false, 
            signal: i === nextIdx ? SignalState.GREEN : SignalState.RED,
            remainingTime: i === nextIdx ? finalDuration : 0
          }));
          
          transmitSystemUpdate(updated, nextIdx);
          return updated;
        }

        return newLanes.map((l, i) => i === activeLaneIndex ? { ...l, remainingTime: nextCount } : l);
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isSystemRunning, activeLaneIndex, isIntelliMode, transmitSystemUpdate]);

  useEffect(() => {
    if (!isSystemRunning) return;
    const interval = setInterval(() => {
      lanes.forEach(lane => {
        if (lane.videoUrl) analyzeLane(lane.id);
      });
    }, 12000); 
    return () => clearInterval(interval);
  }, [isSystemRunning, lanes]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = commandInput.toLowerCase().trim();
    
    const laneMatch = cmd.match(/^e([1-3])$/);
    if (laneMatch) {
      const laneIdx = parseInt(laneMatch[1]) - 1;
      setLanes(prev => {
        const updated = prev.map((l, i) => ({
          ...l,
          isEmergency: i === laneIdx,
          signal: i === laneIdx ? SignalState.GREEN : SignalState.RED,
          remainingTime: i === laneIdx ? EMERGENCY_GREEN : 0
        }));
        transmitSystemUpdate(updated, laneIdx);
        return updated;
      });
      setActiveLaneIndex(laneIdx);
      addLog(`MANUAL OVERRIDE: Packet sent for Road ${laneMatch[1]}`);
      setCommandInput('');
    } else if (cmd === 'reset') {
       setLanes(prev => prev.map(l => ({ ...l, isEmergency: false })));
       addLog('SYSTEM: Remote reset packet issued');
       setCommandInput('');
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-950 text-slate-100">
      <Header />
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 min-h-0 overflow-hidden">
        <div className="lg:col-span-8 grid grid-cols-2 grid-rows-2 gap-4 min-h-0 overflow-hidden">
          {lanes.map((lane) => (
            <VideoFeed 
              key={lane.id} 
              lane={lane} 
              onUpload={(url) => {
                setLanes(prev => prev.map(l => l.id === lane.id ? { ...l, videoUrl: url } : l));
                addLog(`FEED: ${lane.name} online`);
              }}
              isActive={activeLaneIndex === lane.id}
              videoRef={(el) => videoRefs.current[lane.id] = el}
              isProcessing={isAiProcessing[lane.id]}
            />
          ))}
          <StatusPanel lanes={lanes} logs={logs} activeIndex={activeLaneIndex} isIntelliMode={isIntelliMode} />
        </div>

        <div className="lg:col-span-4 flex flex-col space-y-4 min-h-0 overflow-hidden">
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 shadow-2xl flex-1 flex flex-col min-h-0">
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2 text-slate-400">
              <i className="fas fa-terminal text-emerald-400"></i>
              Command & Uplink Console
            </h2>
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {/* Network Status Card */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-blue-900/20 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Target Node</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isTransmitting ? 'bg-blue-400 animate-ping' : 'bg-slate-700'}`}></div>
                    <span className="text-[10px] font-mono text-slate-300">{TARGET_IP}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-slate-600 uppercase">Protocol</span>
                  <span className="text-[9px] font-mono text-blue-400/70">UDP SIMULATION (POST)</span>
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/50 space-y-3">
                <button 
                  onClick={() => {
                    setIsIntelliMode(!isIntelliMode);
                    addLog(`SYSTEM: Switched to ${!isIntelliMode ? 'AI ADAPTIVE' : 'FIXED CYCLE'}`);
                  }}
                  className={`w-full py-3 rounded-lg font-black text-xs transition-all border flex items-center justify-center gap-3 ${isIntelliMode ? 'bg-emerald-600/10 border-emerald-600/40 text-emerald-500' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                >
                  <i className={`fas ${isIntelliMode ? 'fa-microchip' : 'fa-clock'}`}></i>
                  {isIntelliMode ? 'AI ADAPTIVE TIMING' : 'FIXED CYCLE TIMING'}
                </button>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-rose-900/20">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Tactical Override</label>
                  <span className="text-[8px] text-slate-600 font-mono">e1 | e2 | e3</span>
                </div>
                <form onSubmit={handleCommandSubmit} className="flex gap-2">
                  <input 
                    type="text" 
                    value={commandInput} 
                    onChange={(e) => setCommandInput(e.target.value)}
                    className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded px-2 py-2 text-sm text-rose-400 font-mono focus:outline-none placeholder:text-slate-700 uppercase"
                    placeholder="Enter command..."
                  />
                  <button type="submit" className="bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 border border-rose-600/30 px-4 py-2 rounded text-[10px] font-black uppercase">
                    Sync
                  </button>
                </form>
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                 <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Console Stream</h3>
                 <div className="flex-1 bg-black/40 rounded-lg p-2 font-mono text-[9px] space-y-2 overflow-y-auto border border-slate-800/30">
                    {logs.length === 0 ? (
                      <div className="text-slate-700 italic">Awaiting system boot...</div>
                    ) : logs.map((log, i) => (
                      <div key={i} className={`p-1 border-b border-slate-800/10 last:border-0 ${log.includes('NETWORK') ? 'text-blue-400' : log.includes('EMERGENCY') ? 'text-rose-400' : 'text-slate-500'}`}>
                        {log}
                      </div>
                    ))}
                 </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/50 shrink-0">
               <button 
                  onClick={() => {
                    setIsSystemRunning(!isSystemRunning);
                    addLog(isSystemRunning ? 'OFFLINE: Uplink terminated' : 'ONLINE: Broadcast starting');
                  }}
                  className={`w-full py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-3 border shadow-2xl ${isSystemRunning ? 'bg-rose-950/20 border-rose-800 text-rose-500' : 'bg-emerald-950/20 border-emerald-800 text-emerald-500'}`}
               >
                 <i className={`fas ${isSystemRunning ? 'fa-power-off' : 'fa-signal'}`}></i>
                 {isSystemRunning ? 'SHUTDOWN NODE' : 'INITIALIZE BROADCAST'}
               </button>
            </div>
          </div>
        </div>
      </main>
      <ControlBar isTransmitting={isTransmitting} targetIp={`${TARGET_IP}:${TARGET_PORT}`} />
    </div>
  );
};

export default App;