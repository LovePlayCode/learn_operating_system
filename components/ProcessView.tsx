
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Play, Pause, RotateCcw, Plus, Clock, Activity, ListOrdered, GitCommit, ArrowRight, LayoutTemplate } from 'lucide-react';
import { Process, ProcessState, AlgorithmType, TimeSlice } from '../types';

// --- Helper Components ---
const ProcessBox = ({ p, compact = false }: { p: Process, compact?: boolean }) => {
  const { mode } = useTheme();
  return (
    <div className={`
      relative transition-all duration-300 border-2
      ${mode === 'cute' ? 'rounded-2xl shadow-sm' : 'rounded-lg shadow'}
      ${compact ? 'p-2 w-24' : 'p-3 w-32'}
      ${p.color} bg-opacity-20 border-opacity-50
      flex flex-col items-center justify-center
    `}
    style={{ borderColor: 'currentColor' }}>
      <div className="font-bold text-sm truncate">{p.name}</div>
      {!compact && <div className="text-[10px] opacity-70">Burst: {p.remainingTime}/{p.burstTime}</div>}
      <div className={`absolute top-0 right-0 w-3 h-3 rounded-full -mt-1 -mr-1 ${p.state === ProcessState.RUNNING ? 'bg-green-400 animate-pulse' : 'bg-slate-300'}`}></div>
    </div>
  );
};

// --- Lifecycle View ---
const LifecycleView = () => {
  const { styles, mode } = useTheme();
  // Simple simulation state for lifecycle demo
  const [demoProc, setDemoProc] = useState<ProcessState>(ProcessState.NEW);

  const states = [
    { id: ProcessState.NEW, label: '新建 (New)', x: 10, y: 10, color: 'bg-slate-100 border-slate-300' },
    { id: ProcessState.READY, label: '就绪 (Ready)', x: 40, y: 30, color: 'bg-blue-100 border-blue-300' },
    { id: ProcessState.RUNNING, label: '运行 (Running)', x: 40, y: 70, color: 'bg-green-100 border-green-300' },
    { id: ProcessState.BLOCKED, label: '阻塞 (Blocked)', x: 70, y: 50, color: 'bg-amber-100 border-amber-300' },
    { id: ProcessState.TERMINATED, label: '终止 (Terminated)', x: 10, y: 90, color: 'bg-red-100 border-red-300' },
  ];

  // Transitions
  const transition = (to: ProcessState) => setDemoProc(to);

  return (
    <div className="flex flex-col h-full gap-6">
      <div className={`${styles.card} p-6 flex-1 relative overflow-hidden flex flex-col items-center justify-center`}>
         {/* Background Arrows/Flow - Simplified SVG overlay */}
         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* New -> Ready */}
            <path d="M 15 15 Q 25 15 40 25" fill="none" stroke="currentColor" strokeWidth="0.5" markerEnd="url(#arrow)" />
            {/* Ready <-> Running */}
            <path d="M 40 35 L 40 65" fill="none" stroke="currentColor" strokeWidth="0.5" markerEnd="url(#arrow)" />
            <path d="M 45 65 L 45 35" fill="none" stroke="currentColor" strokeWidth="0.5" markerEnd="url(#arrow)" strokeDasharray="2,2"/>
            {/* Running -> Terminated */}
            <path d="M 40 75 Q 25 85 15 90" fill="none" stroke="currentColor" strokeWidth="0.5" markerEnd="url(#arrow)" />
            {/* Running -> Blocked */}
            <path d="M 50 70 L 65 55" fill="none" stroke="currentColor" strokeWidth="0.5" markerEnd="url(#arrow)" />
            {/* Blocked -> Ready */}
            <path d="M 65 45 L 50 30" fill="none" stroke="currentColor" strokeWidth="0.5" markerEnd="url(#arrow)" />
            
            <defs>
              <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L9,3 z" fill="currentColor" />
              </marker>
            </defs>
         </svg>

         {/* States Nodes */}
         <div className="relative w-full max-w-2xl h-[400px]">
            {states.map(s => (
              <div 
                key={s.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 px-6 py-4 rounded-xl border-2 font-bold transition-all duration-500 flex flex-col items-center ${s.color} ${demoProc === s.id ? 'scale-110 shadow-xl ring-4 ring-offset-2 ring-blue-200 z-10' : 'opacity-60 grayscale'}`}
                style={{ left: `${s.x}%`, top: `${s.y}%` }}
              >
                 {s.label}
                 {demoProc === s.id && (
                   <div className="mt-2 w-8 h-8 rounded-full bg-blue-600 animate-bounce flex items-center justify-center text-white text-xs">
                     PCB
                   </div>
                 )}
              </div>
            ))}
         </div>
      </div>

      {/* Controls */}
      <div className={`${styles.card} p-6`}>
         <h3 className={`font-bold mb-4 ${styles.text.primary}`}>进程状态控制</h3>
         <div className="flex flex-wrap gap-4 justify-center">
            {demoProc === ProcessState.NEW && (
              <button onClick={() => transition(ProcessState.READY)} className={styles.button.primary + " px-6 py-2"}>
                 许可 (Admit)
              </button>
            )}
            {demoProc === ProcessState.READY && (
              <button onClick={() => transition(ProcessState.RUNNING)} className={styles.button.primary + " px-6 py-2"}>
                 调度 (Dispatch)
              </button>
            )}
            {demoProc === ProcessState.RUNNING && (
              <>
                <button onClick={() => transition(ProcessState.READY)} className={styles.button.secondary + " px-6 py-2"}>
                   时间片完 (Interrupt)
                </button>
                <button onClick={() => transition(ProcessState.BLOCKED)} className={styles.button.secondary + " px-6 py-2"}>
                   I/O 请求 (Event Wait)
                </button>
                <button onClick={() => transition(ProcessState.TERMINATED)} className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-6 py-2 shadow transition-colors">
                   退出 (Exit)
                </button>
              </>
            )}
            {demoProc === ProcessState.BLOCKED && (
              <button onClick={() => transition(ProcessState.READY)} className={styles.button.primary + " px-6 py-2"}>
                 I/O 完成 (Event Occur)
              </button>
            )}
            {demoProc === ProcessState.TERMINATED && (
              <button onClick={() => transition(ProcessState.NEW)} className={styles.button.secondary + " px-6 py-2"}>
                 重置进程 (Reset)
              </button>
            )}
         </div>
      </div>
    </div>
  );
};

// --- Scheduler View ---
const SchedulerView = () => {
  const { styles, mode } = useTheme();
  const [processes, setProcesses] = useState<Process[]>([]);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [algorithm, setAlgorithm] = useState<AlgorithmType>(AlgorithmType.FIFO);
  const [timeSlice, setTimeSlice] = useState(2);
  const [ganttChart, setGanttChart] = useState<TimeSlice[]>([]);
  const [readyQueue, setReadyQueue] = useState<Process[]>([]);

  // Helpers
  const generateColor = (id: number) => {
    const colors = ['bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-green-400', 'bg-emerald-400', 'bg-teal-400', 'bg-cyan-400', 'bg-sky-400', 'bg-blue-400', 'bg-indigo-400', 'bg-violet-400', 'bg-purple-400', 'bg-fuchsia-400', 'bg-pink-400', 'bg-rose-400'];
    return colors[id % colors.length];
  };

  const addProcess = () => {
    const id = processes.length + 1;
    const newProc: Process = {
      id,
      name: `P${id}`,
      arrivalTime: time, // Assume dynamic arrival at current time for simplicity in interactive mode
      burstTime: Math.floor(Math.random() * 5) + 3,
      remainingTime: Math.floor(Math.random() * 5) + 3,
      priority: Math.floor(Math.random() * 3),
      state: ProcessState.READY,
      color: generateColor(id),
      startTime: null,
      completionTime: null
    };
    setProcesses(prev => [...prev, newProc]);
    setReadyQueue(prev => [...prev, newProc]);
  };

  const reset = () => {
    setProcesses([]);
    setReadyQueue([]);
    setGanttChart([]);
    setTime(0);
    setIsRunning(false);
  };

  // Simulation Step
  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        runStep();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, readyQueue, processes, algorithm]);

  const runStep = () => {
    // Check if all done
    const active = processes.filter(p => p.remainingTime > 0);
    if (active.length === 0) {
      setIsRunning(false);
      return;
    }

    let currentProc: Process | null = null;
    let nextQueue = [...readyQueue];
    
    // Select process based on algorithm
    if (nextQueue.length > 0) {
      if (algorithm === AlgorithmType.FIFO) {
        currentProc = nextQueue[0];
      } else if (algorithm === AlgorithmType.RR) {
        currentProc = nextQueue[0];
      } else if (algorithm === AlgorithmType.MLFQ) {
        // Simple priority sort (lower num = higher priority)
        nextQueue.sort((a, b) => a.priority - b.priority);
        currentProc = nextQueue[0];
      }
    }

    if (currentProc) {
      // Execute 1 unit
      const updatedProc = { ...currentProc, remainingTime: currentProc.remainingTime - 1 };
      
      // Update chart
      setGanttChart(prev => {
        const last = prev[prev.length - 1];
        if (last && last.processId === currentProc!.id) {
          return [...prev.slice(0, -1), { ...last, endTime: time + 1 }];
        }
        return [...prev, { processId: currentProc!.id, startTime: time, endTime: time + 1, color: currentProc!.color }];
      });

      // Update Process List State
      setProcesses(prev => prev.map(p => p.id === currentProc!.id ? updatedProc : p));

      // Algorithm Specific Queue Logic
      if (updatedProc.remainingTime === 0) {
         // Finished
         nextQueue = nextQueue.filter(p => p.id !== currentProc!.id);
      } else {
         if (algorithm === AlgorithmType.RR) {
           // Check time slice logic implementation for simulation step
           // For visual simplicity, we rotate every N steps. 
           // We need to track how long it's been running.
           // A simpler approach for this visualizer: Rotate strictly if slice expired.
           // Since we step 1 by 1, we can check gantt chart length for this proc.
           
           // Hacky simulation for RR: just rotate to back of queue immediately for single step visual
           // To do it properly we'd need a "currentBurst" counter.
           // Let's keep it simple: RR rotates every step effectively if we just move to back? 
           // No, that's time slice = 1.
           // Let's implement simple "Move to back if active step % slice == 0"
           
           // Find consecutive duration
           let duration = 1;
           for(let i = ganttChart.length - 1; i>=0; i--) {
             if(ganttChart[i].processId === currentProc.id) duration += (ganttChart[i].endTime - ganttChart[i].startTime);
             else break;
           }
           
           if (duration % timeSlice === 0) {
              // Rotate
              nextQueue = nextQueue.filter(p => p.id !== currentProc!.id);
              nextQueue.push(updatedProc);
           } else {
              // Update in place
              nextQueue = nextQueue.map(p => p.id === updatedProc.id ? updatedProc : p);
           }

         } else {
           // Update in place
           nextQueue = nextQueue.map(p => p.id === updatedProc.id ? updatedProc : p);
         }
      }
      
      setReadyQueue(nextQueue);
    } else {
      // Idle
      setGanttChart(prev => {
        const last = prev[prev.length - 1];
        if (last && last.processId === null) {
          return [...prev.slice(0, -1), { ...last, endTime: time + 1 }];
        }
        return [...prev, { processId: null, startTime: time, endTime: time + 1, color: 'bg-slate-200' }];
      });
    }

    setTime(t => t + 1);
  };

  return (
    <div className="flex flex-col h-full gap-6">
       {/* Toolbar */}
       <div className={`${styles.card} p-4 flex flex-wrap items-center justify-between gap-4`}>
          <div className="flex items-center gap-4">
             <div className="flex flex-col">
               <label className="text-[10px] uppercase font-bold text-slate-400">Algorithm</label>
               <select 
                  value={algorithm} 
                  onChange={(e) => { setAlgorithm(e.target.value as AlgorithmType); reset(); }}
                  className={`font-bold outline-none bg-transparent ${styles.text.primary}`}
               >
                 <option value={AlgorithmType.FIFO}>先来先服务 (FIFO)</option>
                 <option value={AlgorithmType.RR}>时间片轮转 (RR)</option>
                 <option value={AlgorithmType.MLFQ}>多级反馈队列 (MLFQ)</option>
               </select>
             </div>
             
             {algorithm === AlgorithmType.RR && (
               <div className="flex flex-col w-20">
                 <label className="text-[10px] uppercase font-bold text-slate-400">Time Slice</label>
                 <input 
                   type="number" 
                   min="1" max="10" 
                   value={timeSlice}
                   onChange={(e) => setTimeSlice(Number(e.target.value))}
                   className={`bg-transparent font-bold w-full outline-none ${styles.text.primary}`} 
                 />
               </div>
             )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setIsRunning(!isRunning)} className={styles.button.primary + " px-4 py-2 flex items-center gap-2"}>
               {isRunning ? <Pause size={16}/> : <Play size={16}/>}
               {isRunning ? "暂停" : "开始"}
            </button>
            <button onClick={reset} className={styles.button.icon + " p-2"}>
               <RotateCcw size={16}/>
            </button>
            <div className="w-px h-6 bg-slate-200 mx-2"></div>
            <button onClick={addProcess} className={`${styles.button.secondary} px-4 py-2 flex items-center gap-2 border-dashed border-2`}>
               <Plus size={16}/> 添加进程
            </button>
          </div>
       </div>

       {/* Main Visualization */}
       <div className="flex flex-1 gap-6 min-h-0">
          
          {/* Queue & List */}
          <div className="w-1/3 flex flex-col gap-6">
             <div className={`${styles.card} p-4 flex-1 overflow-auto`}>
                <h4 className={`font-bold mb-3 flex items-center gap-2 ${styles.text.primary}`}>
                   <ListOrdered size={16}/> 
                   {algorithm === AlgorithmType.FIFO ? 'Ready Queue (FIFO)' : algorithm === AlgorithmType.RR ? 'Ready Queue (Circular)' : 'Priority Queues'}
                </h4>
                <div className="space-y-2">
                   {readyQueue.map(p => (
                     <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg border bg-white ${mode === 'cute' ? 'shadow-sm' : ''}`}>
                        <div className="flex items-center gap-3">
                           <div className={`w-3 h-3 rounded-full ${p.color}`}></div>
                           <div className="font-bold text-sm">{p.name}</div>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                           Rem: {p.remainingTime} | Prio: {p.priority}
                        </div>
                     </div>
                   ))}
                   {readyQueue.length === 0 && (
                     <div className="text-center py-8 text-slate-400 text-sm italic">Queue Empty</div>
                   )}
                </div>
             </div>
          </div>

          {/* Gantt Chart Area */}
          <div className={`${styles.card} flex-1 p-6 flex flex-col`}>
             <h4 className={`font-bold mb-6 flex items-center gap-2 ${styles.text.primary}`}>
                <Activity size={16}/> CPU Gantt Chart
                <span className="text-xs font-normal bg-slate-100 px-2 py-1 rounded ml-2">Time: {time}</span>
             </h4>
             
             <div className="relative h-24 w-full bg-slate-50 rounded-xl overflow-hidden flex border border-slate-200">
                {ganttChart.map((slice, i) => {
                   const duration = slice.endTime - slice.startTime;
                   const widthPct = (duration / Math.max(time, 10)) * 100; // Auto scale a bit
                   // For better scrolling, simpler fixed width per unit?
                   // Let's use flex-grow based on duration
                   return (
                     <div 
                        key={i} 
                        style={{ flex: duration }}
                        className={`${slice.processId !== null ? slice.color : 'bg-slate-100'} border-r border-white/20 relative group min-w-[20px] transition-all`}
                     >
                        {slice.processId !== null && (
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                             P{slice.processId}
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 text-[9px] text-slate-400 p-0.5 bg-white/80">{slice.startTime}</div>
                     </div>
                   );
                })}
             </div>

             {/* Stats */}
             <div className="mt-8 grid grid-cols-2 gap-4">
                 <div className={`p-4 rounded-xl ${mode === 'cute' ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-700'}`}>
                    <div className="text-xs uppercase font-bold opacity-60">Avg Turnaround Time</div>
                    <div className="text-2xl font-mono font-bold">--</div>
                 </div>
                 <div className={`p-4 rounded-xl ${mode === 'cute' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                    <div className="text-xs uppercase font-bold opacity-60">Avg Waiting Time</div>
                    <div className="text-2xl font-mono font-bold">--</div>
                 </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export const ProcessView: React.FC = () => {
  const { styles, mode } = useTheme();
  const [tab, setTab] = useState<'lifecycle' | 'scheduler'>('lifecycle');

  return (
    <div className={`flex flex-col h-full p-6 gap-6 ${styles.bg}`}>
       {/* Tabs */}
       <div className="flex justify-center">
         <div className={`p-1 rounded-xl flex gap-1 border ${mode === 'cute' ? 'bg-white border-pink-100' : 'bg-slate-200 border-slate-300'}`}>
           <button 
             onClick={() => setTab('lifecycle')}
             className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
               tab === 'lifecycle' 
                 ? (mode === 'cute' ? 'bg-pink-400 text-white shadow' : 'bg-white text-slate-800 shadow') 
                 : 'text-slate-400 hover:text-slate-600'
             }`}
           >
             <GitCommit size={16} className="inline mr-2"/> 状态模型 (Lifecycle)
           </button>
           <button 
             onClick={() => setTab('scheduler')}
             className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
               tab === 'scheduler' 
                 ? (mode === 'cute' ? 'bg-pink-400 text-white shadow' : 'bg-white text-slate-800 shadow') 
                 : 'text-slate-400 hover:text-slate-600'
             }`}
           >
             <LayoutTemplate size={16} className="inline mr-2"/> 调度算法 (Scheduler)
           </button>
         </div>
       </div>

       {tab === 'lifecycle' ? <LifecycleView /> : <SchedulerView />}
    </div>
  );
};
