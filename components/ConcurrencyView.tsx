
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { ShieldCheck, ShieldAlert, Cpu, Database, Play, Pause, RotateCcw, Plus, Minus, UserPlus, Utensils, AlertTriangle, Lock, Unlock, ArrowDown, ArrowUp, ChevronRight, ChevronLeft, MessageSquare, Repeat, Zap, Clock, MousePointer, Server, Layers, Maximize2, X, Trash2 } from 'lucide-react';

// --- Step Definitions ---
type ScenarioStep = {
  id: number;
  label: string;
  activeThread: 'A' | 'B' | null;
  threadAState: any;
  threadBState: any;
  memoryVal: number;
  lockOwner: 'A' | 'B' | null;
  log: string;
  explanation: string; // Plain language explanation
  visualAction?: 'READ_A' | 'WRITE_A' | 'READ_B' | 'WRITE_B' | 'LOCK_A' | 'FAIL_B' | 'SWITCH'; // For animations
};

// Initial States
const INITIAL_THREAD_STATE = { pc: -1, reg: null, state: 'IDLE' };

export const ConcurrencyView: React.FC = () => {
  const { styles, mode } = useTheme();
  const [tab, setTab] = useState<'mutex' | 'semaphore' | 'dining' | 'event'>('mutex');

  return (
    <div className={`flex flex-col h-full p-6 gap-6 overflow-y-auto ${styles.bg}`}>
       <div className="flex justify-center shrink-0 overflow-x-auto">
         <div className={`p-1 rounded-xl flex gap-1 border ${mode === 'cute' ? 'bg-white border-pink-100' : 'bg-slate-200 border-slate-300'}`}>
           <button onClick={() => setTab('mutex')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${tab === 'mutex' ? (mode === 'cute' ? 'bg-pink-400 text-white shadow' : 'bg-white text-slate-800 shadow') : 'text-slate-400 hover:text-slate-600'}`}>
             互斥锁与竞态 (Mutex)
           </button>
           <button onClick={() => setTab('semaphore')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${tab === 'semaphore' ? (mode === 'cute' ? 'bg-pink-400 text-white shadow' : 'bg-white text-slate-800 shadow') : 'text-slate-400 hover:text-slate-600'}`}>
             信号量 (Producer-Consumer)
           </button>
           <button onClick={() => setTab('dining')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${tab === 'dining' ? (mode === 'cute' ? 'bg-pink-400 text-white shadow' : 'bg-white text-slate-800 shadow') : 'text-slate-400 hover:text-slate-600'}`}>
             经典问题 (Deadlock)
           </button>
           <button onClick={() => setTab('event')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${tab === 'event' ? (mode === 'cute' ? 'bg-pink-400 text-white shadow' : 'bg-white text-slate-800 shadow') : 'text-slate-400 hover:text-slate-600'}`}>
             基于事件 (Event Loop)
           </button>
         </div>
       </div>

       {tab === 'mutex' ? <RaceConditionDemo /> : 
        tab === 'semaphore' ? <ProducerConsumerDemo /> : 
        tab === 'dining' ? <PhilosophersDemo /> : 
        <EventLoopDemo />}
    </div>
  );
};

// --- Producer Consumer Demo ---
const ProducerConsumerDemo = () => {
  const { styles, mode } = useTheme();
  // Buffer size 5
  const BUFFER_SIZE = 5;
  const [buffer, setBuffer] = useState<(number | null)[]>(Array(BUFFER_SIZE).fill(null));
  const [mutex, setMutex] = useState(true); // true = unlocked
  const [empty, setEmpty] = useState(BUFFER_SIZE);
  const [full, setFull] = useState(0);
  const [producerState, setProducerState] = useState<'IDLE' | 'WAIT' | 'PRODUCING'>('IDLE');
  const [consumerState, setConsumerState] = useState<'IDLE' | 'WAIT' | 'CONSUMING'>('IDLE');

  const produce = async () => {
    if (producerState !== 'IDLE') return;
    setProducerState('WAIT');
    
    // Check semaphores
    if (empty > 0) {
        // Wait Mutex
        if (mutex) {
            setMutex(false);
            setProducerState('PRODUCING');
            await new Promise(r => setTimeout(r, 800)); // Simulate work
            
            setBuffer(prev => {
                const idx = prev.findIndex(x => x === null);
                const next = [...prev];
                if(idx !== -1) next[idx] = Math.floor(Math.random() * 100);
                return next;
            });
            setEmpty(e => e - 1);
            setFull(f => f + 1);
            
            setMutex(true);
            setProducerState('IDLE');
        } else {
             // Blocked on mutex
             setTimeout(() => setProducerState('IDLE'), 500); // Retry later visually
        }
    } else {
        // Blocked on Empty
        setTimeout(() => setProducerState('IDLE'), 500); 
    }
  };

  const consume = async () => {
    if (consumerState !== 'IDLE') return;
    setConsumerState('WAIT');

    if (full > 0) {
        if (mutex) {
            setMutex(false);
            setConsumerState('CONSUMING');
            await new Promise(r => setTimeout(r, 800));

            setBuffer(prev => {
                // Find first non-null
                const idx = prev.findIndex(x => x !== null);
                const next = [...prev];
                if(idx !== -1) next[idx] = null;
                // Shift visual queue behavior: move items to the left
                const newB = next.filter(x => x !== null);
                while(newB.length < BUFFER_SIZE) newB.push(null);
                return newB;
            });
            setEmpty(e => e + 1);
            setFull(f => f - 1);

            setMutex(true);
            setConsumerState('IDLE');
        } else {
            setTimeout(() => setConsumerState('IDLE'), 500);
        }
    } else {
        setTimeout(() => setConsumerState('IDLE'), 500);
    }
  };

  return (
      <div className="flex flex-col gap-6 h-full">
          {/* Dashboard */}
          <div className={`${styles.card} p-6 flex justify-around items-center`}>
              <div className="flex flex-col items-center">
                  <div className="text-xs uppercase font-bold text-slate-400 mb-1">Semaphore: Empty</div>
                  <div className="text-3xl font-mono font-bold text-blue-500">{empty}</div>
              </div>
              <div className="flex flex-col items-center">
                  <div className="text-xs uppercase font-bold text-slate-400 mb-1">Semaphore: Mutex</div>
                  <div className={`text-3xl font-mono font-bold ${mutex ? 'text-green-500' : 'text-red-500'}`}>
                      {mutex ? '1 (Unlock)' : '0 (Lock)'}
                  </div>
              </div>
              <div className="flex flex-col items-center">
                  <div className="text-xs uppercase font-bold text-slate-400 mb-1">Semaphore: Full</div>
                  <div className="text-3xl font-mono font-bold text-orange-500">{full}</div>
              </div>
          </div>

          <div className="flex-1 flex items-center justify-between gap-8 min-h-[300px]">
              {/* Producer */}
              <div className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-4 transition-all ${producerState === 'PRODUCING' ? 'border-green-400 bg-green-50 scale-105 shadow-lg' : 'border-slate-200 bg-white'}`}>
                  <div className="font-bold text-lg">Producer</div>
                  <div className={`text-xs px-2 py-1 rounded font-bold ${producerState === 'IDLE' ? 'bg-slate-100' : producerState === 'WAIT' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                      {producerState}
                  </div>
                  <button onClick={produce} disabled={producerState !== 'IDLE'} className={styles.button.primary + " px-6 py-2"}>
                      Produce Item
                  </button>
              </div>

              {/* Buffer */}
              <div className={`${styles.card} p-4 flex-1 flex flex-col items-center`}>
                  <div className="text-xs font-bold uppercase text-slate-400 mb-4">Bounded Buffer (FIFO)</div>
                  <div className="flex gap-2">
                      {buffer.map((item, i) => (
                          <div key={i} className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center font-bold text-lg transition-all ${item !== null ? 'bg-orange-100 border-orange-400 text-orange-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                              {item !== null ? item : '∅'}
                          </div>
                      ))}
                  </div>
              </div>

              {/* Consumer */}
              <div className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-4 transition-all ${consumerState === 'CONSUMING' ? 'border-blue-400 bg-blue-50 scale-105 shadow-lg' : 'border-slate-200 bg-white'}`}>
                  <div className="font-bold text-lg">Consumer</div>
                  <div className={`text-xs px-2 py-1 rounded font-bold ${consumerState === 'IDLE' ? 'bg-slate-100' : consumerState === 'WAIT' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}>
                      {consumerState}
                  </div>
                  <button onClick={consume} disabled={consumerState !== 'IDLE'} className={styles.button.secondary + " px-6 py-2 border-blue-200 text-blue-600"}>
                      Consume Item
                  </button>
              </div>
          </div>
      </div>
  );
};

// --- Philosophers Demo ---
const PhilosophersDemo = () => {
    const { styles, mode } = useTheme();
    // 0: Thinking, 1: Hungry, 2: Eating
    const [philosophers, setPhilosophers] = useState<number[]>([0, 0, 0, 0, 0]);
    const [forks, setForks] = useState<boolean[]>([true, true, true, true, true]); // true = free
    const [deadlock, setDeadlock] = useState(false);

    const tryEat = (id: number) => {
        if (deadlock) return;

        setPhilosophers(prev => {
            const next = [...prev];
            next[id] = 1; // Hungry
            return next;
        });

        // Simple logic: Try get left then right
        setTimeout(() => {
            setForks(currentForks => {
                const left = id;
                const right = (id + 1) % 5;
                
                // If both available, eat
                if (currentForks[left] && currentForks[right]) {
                    const nextForks = [...currentForks];
                    nextForks[left] = false;
                    nextForks[right] = false;

                    setPhilosophers(p => {
                        const next = [...p];
                        next[id] = 2; // Eating
                        return next;
                    });

                    // Finish eating after delay
                    setTimeout(() => {
                        setForks(f => {
                            const nf = [...f];
                            nf[left] = true;
                            nf[right] = true;
                            return nf;
                        });
                        setPhilosophers(p => {
                            const next = [...p];
                            next[id] = 0; // Thinking
                            return next;
                        });
                    }, 2000);

                    return nextForks;
                } else {
                    // Failed to get forks
                    return currentForks;
                }
            });
        }, 500);
    };
    
    // Deadlock Simulation: Everyone pick left fork
    const triggerDeadlock = () => {
        setDeadlock(true);
        setPhilosophers([1,1,1,1,1]); // All hungry
        // Everyone takes left fork
        setForks([false, false, false, false, false]);
        // No one can take right fork
    };

    const reset = () => {
        setDeadlock(false);
        setPhilosophers([0,0,0,0,0]);
        setForks([true,true,true,true,true]);
    };

    return (
        <div className="flex flex-col h-full gap-6 items-center justify-center">
            <div className={`${styles.card} p-4 w-full flex justify-between items-center`}>
                <h3 className={`font-bold ${styles.text.primary}`}>哲学家就餐问题 (Dining Philosophers)</h3>
                <div className="flex gap-2">
                    <button onClick={triggerDeadlock} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-red-600">
                        模拟死锁 (Deadlock)
                    </button>
                    <button onClick={reset} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200">
                        <RotateCcw size={16}/> 重置
                    </button>
                </div>
            </div>

            <div className="relative w-[400px] h-[400px] flex-1">
                 {/* Table */}
                 <div className="absolute inset-0 m-auto w-48 h-48 rounded-full bg-amber-100 border-8 border-amber-200 shadow-xl flex items-center justify-center">
                    {deadlock && <div className="text-red-500 font-bold animate-pulse text-lg">DEADLOCK!</div>}
                 </div>

                 {/* Philosophers */}
                 {philosophers.map((state, i) => {
                     const angle = (i * 72 - 90) * (Math.PI / 180);
                     const r = 160;
                     const x = 200 + r * Math.cos(angle);
                     const y = 200 + r * Math.sin(angle);
                     
                     return (
                         <div key={i} 
                              className={`absolute w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center transition-all shadow-lg transform -translate-x-1/2 -translate-y-1/2 ${state === 2 ? 'bg-green-100 border-green-400 text-green-700' : state === 1 ? 'bg-red-100 border-red-400 text-red-700' : 'bg-white border-slate-200 text-slate-500'}`}
                              style={{ left: x, top: y }}
                         >
                             <div className="font-bold">P{i}</div>
                             <div className="text-[10px] uppercase font-bold">{state === 2 ? 'Eating' : state === 1 ? 'Hungry' : 'Thinking'}</div>
                             {state === 0 && !deadlock && (
                                 <button onClick={() => tryEat(i)} className="absolute -bottom-6 bg-blue-500 hover:bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full shadow-sm z-10">
                                     Eat
                                 </button>
                             )}
                         </div>
                     );
                 })}

                 {/* Forks */}
                 {forks.map((available, i) => {
                     // Fork i is between P(i) and P(i+1)
                     const angle = ((i * 72) - 90 + 36) * (Math.PI / 180);
                     const r = 100;
                     const x = 200 + r * Math.cos(angle);
                     const y = 200 + r * Math.sin(angle);

                     return (
                         <div key={i}
                              className={`absolute w-2 h-12 rounded-full transition-all transform -translate-x-1/2 -translate-y-1/2 ${available ? 'bg-slate-400' : 'bg-transparent'}`}
                              style={{ left: x, top: y, transform: `translate(-50%, -50%) rotate(${i*72 + 36}deg)` }}
                         >
                             {/* Only show fork if available on table */}
                         </div>
                     )
                 })}
            </div>
            
            <div className={`text-center text-sm ${deadlock ? 'text-red-500' : styles.text.secondary}`}>
                {deadlock ? "死锁发生！每个人都拿着左手的叉子等待右手的叉子，导致循环等待。" : "点击 'Eat' 让哲学家尝试进餐。如果有死锁风险，系统会卡住。"}
            </div>
        </div>
    );
};

// --- Event Loop Demo ---
interface EventTask {
  id: number;
  type: 'ui' | 'calc' | 'network' | 'callback';
  name: string;
  duration: number; // ms
  color: string;
  icon: any;
}

const EventLoopDemo = () => {
  const { styles, mode } = useTheme();
  const [queue, setQueue] = useState<EventTask[]>([]);
  const [currentTask, setCurrentTask] = useState<EventTask | null>(null);
  const [backgroundTasks, setBackgroundTasks] = useState<EventTask[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogDrawer, setShowLogDrawer] = useState(false);
  
  // Stats
  const [processedCount, setProcessedCount] = useState(0);

  const addTask = (type: 'ui' | 'calc' | 'network') => {
    const id = Date.now();
    let task: EventTask;

    if (type === 'ui') {
      task = { id, type, name: '点击事件 (Click)', duration: 800, color: 'bg-blue-500', icon: MousePointer };
    } else if (type === 'calc') {
      task = { id, type, name: '复杂计算 (Blocking)', duration: 3000, color: 'bg-red-500', icon: Cpu };
    } else {
      task = { id, type, name: '网络请求 (Async I/O)', duration: 2000, color: 'bg-emerald-500', icon: Zap };
    }

    setQueue(prev => [...prev, task]);
    addLog(`➕ 添加任务: ${task.name}`);
  };

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev]);
  };

  // Main Loop Logic
  useEffect(() => {
    if (currentTask) return; // Busy

    if (queue.length > 0) {
      const task = queue[0];
      setQueue(prev => prev.slice(1));
      setCurrentTask(task);
      
      // Process logic
      if (task.type === 'ui' || task.type === 'callback') {
        // Fast execution
        setTimeout(() => {
          finishTask(task);
        }, task.duration);
      } else if (task.type === 'calc') {
        // Blocking execution
        setIsBlocked(true);
        addLog(`⚠️ 主线程被阻塞！界面失去响应...`);
        setTimeout(() => {
          setIsBlocked(false);
          finishTask(task);
        }, task.duration);
      } else if (task.type === 'network') {
        // Async offload
        addLog(`⚡ 异步卸载: ${task.name} -> 发送到后台`);
        // Immediately finish main thread part (initiate request)
        setTimeout(() => {
           // Move to background
           setBackgroundTasks(prev => [...prev, task]);
           setCurrentTask(null); // Free up the loop immediately!
           
           // Simulate network delay then callback
           setTimeout(() => {
             const callbackTask: EventTask = {
               id: task.id + 1,
               type: 'callback',
               name: `回调: ${task.name} 完成`,
               duration: 500,
               color: 'bg-emerald-600',
               icon: MessageSquare
             };
             setBackgroundTasks(prev => prev.filter(t => t.id !== task.id));
             setQueue(prev => [...prev, callbackTask]);
             addLog(`📩 网络请求完成，回调函数进入队列`);
           }, task.duration); // Simulated network latency

        }, 500); // Small overhead to initiate
      }

    }
  }, [queue, currentTask]);

  const finishTask = (task: EventTask) => {
    setCurrentTask(null);
    setProcessedCount(prev => prev + 1);
    addLog(`✅ 完成任务: ${task.name}`);
  };

  return (
    <div className="flex flex-col min-h-full gap-6">
       
       {/* 1. Header / Controls */}
       <div className={`${styles.card} p-5 flex flex-col md:flex-row gap-6 shrink-0`}>
          <div className="flex-1">
             <h3 className={`font-bold text-lg ${styles.text.primary} flex items-center gap-2`}>
               <RotateCcw size={20} className={isBlocked ? 'text-red-500' : 'text-blue-500 animate-spin-slow'} />
               事件循环 (Event Loop)
             </h3>
             <p className={`text-sm mt-1 ${styles.text.secondary}`}>
               单线程架构。所有任务在主线程排队执行。耗时任务应异步处理，否则会阻塞循环。
             </p>
          </div>
          
          <div className="flex gap-2">
             <button onClick={() => addTask('ui')} className={`${styles.button.secondary} px-4 py-2 border-blue-200 text-blue-600 flex items-center gap-2`}>
                <MousePointer size={16}/> UI 点击 (快)
             </button>
             <button onClick={() => addTask('network')} className={`${styles.button.secondary} px-4 py-2 border-emerald-200 text-emerald-600 flex items-center gap-2`}>
                <Zap size={16}/> 网络请求 (异步)
             </button>
             <button onClick={() => addTask('calc')} className={`${styles.button.secondary} px-4 py-2 border-red-200 text-red-500 flex items-center gap-2`}>
                <Cpu size={16}/> 复杂计算 (阻塞)
             </button>
          </div>
       </div>

       {/* 2. Main Visualization Area */}
       <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-[400px]">
          
          {/* LEFT: The Event Loop & Stack */}
          <div className={`${styles.card} flex-1 p-8 flex flex-col items-center justify-center relative overflow-hidden bg-slate-50/50`}>
             
             {/* The Loop Spinner */}
             <div className="relative w-64 h-64 flex items-center justify-center">
                {/* Track */}
                <div className="absolute inset-0 rounded-full border-8 border-slate-100"></div>
                
                {/* Spinner */}
                <div className={`absolute inset-0 rounded-full border-t-8 border-r-8 transition-all duration-[2000ms] ease-linear ${
                   isBlocked ? 'border-red-500 rotate-0' : 'border-blue-400 animate-spin'
                }`} style={{ animationDuration: '3s' }}></div>

                {/* Center Core (CPU/Thread) */}
                <div className={`z-10 w-32 h-32 rounded-full shadow-xl flex flex-col items-center justify-center border-4 transition-all ${
                   isBlocked 
                    ? 'bg-red-50 border-red-400 animate-pulse scale-105' 
                    : (currentTask ? 'bg-white border-blue-400' : 'bg-slate-50 border-slate-200')
                }`}>
                   {currentTask ? (
                     <div className="text-center animate-in zoom-in duration-300">
                        <currentTask.icon size={24} className={`mx-auto mb-1 ${isBlocked ? 'text-red-500' : 'text-blue-500'}`}/>
                        <div className={`text-[10px] font-bold uppercase ${isBlocked ? 'text-red-500' : 'text-slate-400'}`}>
                          {isBlocked ? 'BLOCKING' : 'Processing'}
                        </div>
                        <div className={`text-xs font-bold px-2 truncate max-w-[100px] ${styles.text.primary}`}>{currentTask.name}</div>
                     </div>
                   ) : (
                     <div className="text-center text-slate-300">
                        <Repeat size={32} className="mx-auto mb-1 opacity-50"/>
                        <div className="text-xs font-bold uppercase">Idle</div>
                     </div>
                   )}
                </div>
             </div>

             {/* Blocking Warning Overlay */}
             {isBlocked && (
               <div className="absolute top-4 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg font-bold text-xs flex items-center gap-2 animate-bounce">
                  <AlertTriangle size={16}/> 主线程阻塞中！无法响应新事件！
               </div>
             )}

             {/* Background Workers (Async) */}
             {backgroundTasks.length > 0 && (
                <div className="absolute bottom-4 right-4 animate-in slide-in-from-right">
                   <div className="bg-slate-800 text-white p-3 rounded-xl shadow-lg border border-slate-700">
                      <div className="text-[10px] font-bold uppercase text-slate-400 mb-2 flex items-center gap-2">
                         <Server size={12}/> Web APIs / Worker Threads
                      </div>
                      <div className="space-y-2">
                        {backgroundTasks.map(t => (
                          <div key={t.id} className="flex items-center gap-2 text-xs">
                             <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                             <span>Processing {t.name}...</span>
                          </div>
                        ))}
                      </div>
                   </div>
                   {/* Connector Line Logic (Simplified visually) */}
                   <div className="absolute -top-4 left-1/2 w-0.5 h-4 bg-slate-300 -z-10"></div>
                </div>
             )}

          </div>

          {/* RIGHT: Event Queue & Logs */}
          <div className="w-full lg:w-80 flex flex-col gap-4">
             
             {/* Event Queue Visual */}
             <div className={`${styles.card} p-4 flex-1 flex flex-col bg-slate-100/50 min-h-0`}>
                <h4 className="font-bold text-sm mb-3 flex items-center gap-2 text-slate-500 shrink-0">
                   <Layers size={16}/> 事件队列 (Task Queue)
                </h4>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                   {queue.length === 0 && (
                     <div className="h-full flex flex-col items-center justify-center text-slate-300 text-xs border-2 border-dashed border-slate-200 rounded-lg">
                        队列为空
                     </div>
                   )}
                   {queue.map((t, i) => (
                      <div key={t.id} className={`p-3 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center gap-3 animate-in slide-in-from-right-2 duration-300 delay-${i*100}`}>
                         <div className={`p-2 rounded-lg ${t.color} text-white`}>
                            <t.icon size={14}/>
                         </div>
                         <div className="flex-1 min-w-0">
                            <div className="font-bold text-xs truncate text-slate-700">{t.name}</div>
                            <div className="text-[10px] text-slate-400">{t.type === 'ui' ? 'User Interaction' : t.type === 'network' ? 'I/O Task' : 'CPU Task'}</div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {/* Log Panel (Clickable to open Drawer) */}
             <div 
               onClick={() => setShowLogDrawer(true)}
               className={`${styles.card} p-4 bg-slate-900 text-slate-300 h-40 overflow-hidden flex flex-col shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all group relative`}
               title="点击查看完整日志"
             >
                <div className="flex justify-between items-center border-b border-slate-800 pb-1 mb-2">
                   <div className="text-[10px] font-bold uppercase text-slate-500">System Logs</div>
                   <div className="flex items-center gap-1 text-[9px] text-slate-500 group-hover:text-blue-400 transition-colors">
                      <Maximize2 size={10}/> 展开
                   </div>
                </div>
                <div className="font-mono text-[10px] space-y-1.5 overflow-hidden flex-1 relative">
                   {/* Gradient fade at bottom to indicate more content */}
                   <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none z-10"></div>
                   
                   {logs.slice(0, 8).map((l, i) => (
                      <div key={i} className="truncate opacity-90">{'>'} {l}</div>
                   ))}
                   {logs.length === 0 && <div className="text-slate-600 italic text-center mt-4">暂无日志...</div>}
                </div>
             </div>

          </div>

       </div>

       {/* Log Drawer (Overlay) */}
       {showLogDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm animate-in fade-in" onClick={() => setShowLogDrawer(false)}>
             <div 
               className="w-full max-w-md bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-700"
               onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
             >
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-950">
                   <h3 className="font-bold text-white flex items-center gap-2"><Server size={18}/> 完整系统日志 ({logs.length})</h3>
                   <div className="flex items-center gap-2">
                      <button onClick={() => setLogs([])} className="p-2 hover:bg-red-900/30 text-red-400 rounded-lg transition-colors" title="清空日志">
                         <Trash2 size={18}/>
                      </button>
                      <button onClick={() => setShowLogDrawer(false)} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors">
                         <X size={20}/>
                      </button>
                   </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-300 space-y-1 bg-slate-900 custom-scrollbar">
                   {logs.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                         <Server size={32} className="opacity-20"/>
                         <p>日志已清空</p>
                      </div>
                   )}
                   {logs.map((l, i) => (
                      <div key={i} className="flex gap-2 hover:bg-slate-800/50 p-1 rounded transition-colors break-all">
                         <span className="text-slate-600 shrink-0 w-8 text-right select-none">#{logs.length - i}</span>
                         <span className={l.includes('⚠️') ? 'text-red-300' : l.includes('✅') ? 'text-green-300' : l.includes('⚡') ? 'text-blue-300' : 'text-slate-300'}>
                           {l}
                         </span>
                      </div>
                   ))}
                </div>
             </div>
          </div>
       )}
    </div>
  );
};


// --- Race Condition Demo (Refactored) ---
const RaceConditionDemo = () => {
  const { styles, mode } = useTheme();
  
  const [scenarioType, setScenarioType] = useState<'RACE' | 'MUTEX'>('RACE');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Define Scenarios
  const RACE_STEPS: ScenarioStep[] = [
    { 
      id: 0, label: 'Start', activeThread: null, 
      threadAState: { ...INITIAL_THREAD_STATE }, 
      threadBState: { ...INITIAL_THREAD_STATE },
      memoryVal: 0, lockOwner: null,
      log: "系统初始化完成。共享变量 X = 0。",
      explanation: "初始状态：两个线程都准备运行，内存中 X 的值为 0。"
    },
    { 
      id: 1, label: 'A Load', activeThread: 'A', 
      threadAState: { pc: 0, reg: null, state: 'RUNNING' }, 
      threadBState: { ...INITIAL_THREAD_STATE },
      memoryVal: 0, lockOwner: null,
      log: "Thread A 准备读取 X...",
      explanation: "Thread A 开始执行。第一步是把内存中的 X 读取到自己的寄存器中。",
      visualAction: 'READ_A'
    },
    { 
      id: 2, label: 'A Loaded', activeThread: 'A', 
      threadAState: { pc: 0, reg: 0, state: 'RUNNING' }, 
      threadBState: { ...INITIAL_THREAD_STATE },
      memoryVal: 0, lockOwner: null,
      log: "Thread A 读取成功：Reg = 0",
      explanation: "Thread A 成功获取了 X 的值 (0)。",
    },
    { 
      id: 3, label: 'Switch to B', activeThread: 'B', 
      threadAState: { pc: 0, reg: 0, state: 'IDLE' }, 
      threadBState: { pc: -1, reg: null, state: 'RUNNING' },
      memoryVal: 0, lockOwner: null,
      log: "⚡ 上下文切换！Thread A 被暂停。",
      explanation: "突然！操作系统进行了上下文切换。Thread A 还没来得及修改数值就被暂停了，现在轮到 Thread B 运行。",
      visualAction: 'SWITCH'
    },
    { 
      id: 4, label: 'B Load', activeThread: 'B', 
      threadAState: { pc: 0, reg: 0, state: 'IDLE' }, 
      threadBState: { pc: 0, reg: null, state: 'RUNNING' },
      memoryVal: 0, lockOwner: null,
      log: "Thread B 读取 X...",
      explanation: "Thread B 不知道 A 已经读过了，它也去读内存中的 X。",
      visualAction: 'READ_B'
    },
    { 
      id: 5, label: 'B Loaded', activeThread: 'B', 
      threadAState: { pc: 0, reg: 0, state: 'IDLE' }, 
      threadBState: { pc: 0, reg: 0, state: 'RUNNING' },
      memoryVal: 0, lockOwner: null,
      log: "Thread B 读取成功：Reg = 0 (旧值!)",
      explanation: "因为 A 还没写回，B 读到的仍然是旧值 0。",
    },
    { 
      id: 6, label: 'B Inc', activeThread: 'B', 
      threadAState: { pc: 0, reg: 0, state: 'IDLE' }, 
      threadBState: { pc: 1, reg: 1, state: 'RUNNING' },
      memoryVal: 0, lockOwner: null,
      log: "Thread B 计算：0 + 1 = 1",
      explanation: "Thread B 在自己的寄存器里把值加 1。",
    },
    { 
      id: 7, label: 'B Store', activeThread: 'B', 
      threadAState: { pc: 0, reg: 0, state: 'IDLE' }, 
      threadBState: { pc: 2, reg: 1, state: 'RUNNING' },
      memoryVal: 0, lockOwner: null,
      log: "Thread B 准备写回...",
      explanation: "Thread B 准备把结果写回内存。",
      visualAction: 'WRITE_B'
    },
    { 
      id: 8, label: 'B Stored', activeThread: 'B', 
      threadAState: { pc: 0, reg: 0, state: 'IDLE' }, 
      threadBState: { pc: 2, reg: 1, state: 'FINISHED' },
      memoryVal: 1, lockOwner: null,
      log: "Thread B 写回内存：X = 1",
      explanation: "内存中的 X 变成了 1。Thread B 任务完成。",
    },
    { 
      id: 9, label: 'Switch to A', activeThread: 'A', 
      threadAState: { pc: 0, reg: 0, state: 'RUNNING' }, 
      threadBState: { pc: 2, reg: 1, state: 'FINISHED' },
      memoryVal: 1, lockOwner: null,
      log: "⚡ 上下文切换！回到 Thread A。",
      explanation: "现在切回 Thread A。注意：A 的寄存器里还存着之前读到的 0！",
      visualAction: 'SWITCH'
    },
    { 
      id: 10, label: 'A Inc', activeThread: 'A', 
      threadAState: { pc: 1, reg: 1, state: 'RUNNING' }, 
      threadBState: { pc: 2, reg: 1, state: 'FINISHED' },
      memoryVal: 1, lockOwner: null,
      log: "Thread A 计算：0 + 1 = 1 (基于旧值)",
      explanation: "Thread A 继续执行加法。它完全不知道中间 B 已经把内存改了。",
    },
    { 
      id: 11, label: 'A Store', activeThread: 'A', 
      threadAState: { pc: 2, reg: 1, state: 'RUNNING' }, 
      threadBState: { pc: 2, reg: 1, state: 'FINISHED' },
      memoryVal: 1, lockOwner: null,
      log: "Thread A 写回内存...",
      explanation: "Thread A 把它的结果 1 写回内存。",
      visualAction: 'WRITE_A'
    },
    { 
      id: 12, label: 'A Stored', activeThread: 'A', 
      threadAState: { pc: 2, reg: 1, state: 'FINISHED' }, 
      threadBState: { pc: 2, reg: 1, state: 'FINISHED' },
      memoryVal: 1, lockOwner: null,
      log: "Thread A 写回内存：X = 1 (覆盖了!)",
      explanation: "糟糕！Thread A 用 1 覆盖了内存。Thread B 的工作丢失了。正确结果应该是 2。",
    }
  ];

  const MUTEX_STEPS: ScenarioStep[] = [
    { 
      id: 0, label: 'Start', activeThread: null, 
      threadAState: { ...INITIAL_THREAD_STATE }, 
      threadBState: { ...INITIAL_THREAD_STATE },
      memoryVal: 0, lockOwner: null,
      log: "初始状态。启用互斥锁保护。",
      explanation: "现在我们引入了一把锁 (Mutex)。访问 X 之前必须先拿锁。"
    },
    { 
      id: 1, label: 'A Lock', activeThread: 'A', 
      threadAState: { pc: 0, reg: null, state: 'RUNNING' }, 
      threadBState: { ...INITIAL_THREAD_STATE },
      memoryVal: 0, lockOwner: 'A',
      log: "Thread A 获取锁 (LOCK) 成功。",
      explanation: "Thread A 成功拿到了锁。它是现在唯一能访问临界区的人。",
      visualAction: 'LOCK_A'
    },
    { 
      id: 2, label: 'A Load', activeThread: 'A', 
      threadAState: { pc: 1, reg: 0, state: 'RUNNING' }, 
      threadBState: { ...INITIAL_THREAD_STATE },
      memoryVal: 0, lockOwner: 'A',
      log: "Thread A 读取 X = 0",
      explanation: "Thread A 安全地读取数据。",
      visualAction: 'READ_A'
    },
    { 
      id: 3, label: 'Switch to B', activeThread: 'B', 
      threadAState: { pc: 1, reg: 0, state: 'IDLE' }, 
      threadBState: { pc: -1, reg: null, state: 'RUNNING' },
      memoryVal: 0, lockOwner: 'A',
      log: "⚡ 尝试切换到 Thread B...",
      explanation: "操作系统尝试切换到 B。B 试图运行...",
      visualAction: 'SWITCH'
    },
    { 
      id: 4, label: 'B Lock Fail', activeThread: 'B', 
      threadAState: { pc: 1, reg: 0, state: 'IDLE' }, 
      threadBState: { pc: 0, reg: null, state: 'BLOCKED' },
      memoryVal: 0, lockOwner: 'A',
      log: "Thread B 尝试加锁失败！被阻塞。",
      explanation: "Thread B 试图拿锁，但锁被 A 拿着。B 被操作系统强制“阻塞 (Blocked)”，去睡觉了。",
      visualAction: 'FAIL_B'
    },
    { 
      id: 5, label: 'Back to A', activeThread: 'A', 
      threadAState: { pc: 1, reg: 0, state: 'RUNNING' }, 
      threadBState: { pc: 0, reg: null, state: 'BLOCKED' },
      memoryVal: 0, lockOwner: 'A',
      log: "⚡ 系统切回 Thread A (B在睡觉)。",
      explanation: "因为 B 阻塞了，CPU 只能切回 A 继续运行。",
    },
    { 
      id: 6, label: 'A Inc', activeThread: 'A', 
      threadAState: { pc: 2, reg: 1, state: 'RUNNING' }, 
      threadBState: { pc: 0, reg: null, state: 'BLOCKED' },
      memoryVal: 0, lockOwner: 'A',
      log: "Thread A 计算：0 + 1 = 1",
      explanation: "Thread A 可以在不受打扰的情况下完成计算。",
    },
    { 
      id: 7, label: 'A Store', activeThread: 'A', 
      threadAState: { pc: 3, reg: 1, state: 'RUNNING' }, 
      threadBState: { pc: 0, reg: null, state: 'BLOCKED' },
      memoryVal: 1, lockOwner: 'A',
      log: "Thread A 写回内存：X = 1",
      explanation: "Thread A 更新内存。",
      visualAction: 'WRITE_A'
    },
    { 
      id: 8, label: 'A Unlock', activeThread: 'A', 
      threadAState: { pc: 4, reg: 1, state: 'FINISHED' }, 
      threadBState: { pc: 0, reg: null, state: 'BLOCKED' },
      memoryVal: 1, lockOwner: null,
      log: "Thread A 释放锁 (UNLOCK)。",
      explanation: "Thread A 完成任务，释放锁。这会唤醒正在等待的 B。",
    },
    { 
      id: 9, label: 'B Wake', activeThread: 'B', 
      threadAState: { pc: 4, reg: 1, state: 'FINISHED' }, 
      threadBState: { pc: 0, reg: null, state: 'RUNNING' },
      memoryVal: 1, lockOwner: null,
      log: "Thread B 被唤醒，准备重试。",
      explanation: "Thread B 醒来，变为就绪状态。",
      visualAction: 'SWITCH'
    },
    { 
      id: 10, label: 'B Lock', activeThread: 'B', 
      threadAState: { pc: 4, reg: 1, state: 'FINISHED' }, 
      threadBState: { pc: 0, reg: null, state: 'RUNNING' },
      memoryVal: 1, lockOwner: 'B',
      log: "Thread B 获取锁成功。",
      explanation: "现在锁是空闲的，B 成功拿到了锁。",
      visualAction: 'LOCK_A' // Reusing animation logic
    },
    { 
      id: 11, label: 'B Load', activeThread: 'B', 
      threadAState: { pc: 4, reg: 1, state: 'FINISHED' }, 
      threadBState: { pc: 1, reg: 1, state: 'RUNNING' },
      memoryVal: 1, lockOwner: 'B',
      log: "Thread B 读取 X = 1",
      explanation: "B 读到了 A 更新后的新值 1。",
      visualAction: 'READ_B'
    },
    { 
      id: 12, label: 'B Finish', activeThread: 'B', 
      threadAState: { pc: 4, reg: 1, state: 'FINISHED' }, 
      threadBState: { pc: 4, reg: 2, state: 'FINISHED' },
      memoryVal: 2, lockOwner: null,
      log: "Thread B 计算并写回：X = 2",
      explanation: "B 计算 1+1=2 并写回。最终结果正确！",
      visualAction: 'WRITE_B'
    }
  ];

  const steps = scenarioType === 'RACE' ? RACE_STEPS : MUTEX_STEPS;
  const currentStep = steps[currentStepIndex];

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Sync state with step
  useEffect(() => {
    // Only append log if we moved forward and it's a new log
    if (logs[logs.length - 1] !== currentStep.log) {
       setLogs(prev => [...prev, currentStep.log]);
    }
  }, [currentStepIndex, currentStep.log]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setLogs([]);
  };

  const switchScenario = (type: 'RACE' | 'MUTEX') => {
    setScenarioType(type);
    setCurrentStepIndex(0);
    setLogs([]);
  };

  // Instructions
  const INSTRUCTIONS = [
    { code: 'LOAD R1, [X]', desc: '读取内存 X' },
    { code: 'INC R1',       desc: 'R1 加 1' },
    { code: 'STORE [X], R1',desc: '写回内存 X' },
  ];

  const MUTEX_INSTRUCTIONS = [
    { code: 'LOCK (Mutex)', desc: '获取锁' },
    ...INSTRUCTIONS,
    { code: 'UNLOCK (Mutex)', desc: '释放锁' }
  ];

  return (
    <div className="flex flex-col gap-6 h-full">
      
      {/* 1. Control & Story Panel */}
      <div className={`${styles.card} p-5 flex flex-col md:flex-row gap-6 shrink-0`}>
         {/* Mode Switcher */}
         <div className="flex flex-col gap-2 w-full md:w-48 shrink-0">
            <h4 className={`text-xs font-bold uppercase ${styles.text.secondary}`}>场景选择</h4>
            <div className="flex flex-col gap-2">
               <button 
                 onClick={() => switchScenario('RACE')}
                 className={`px-4 py-3 rounded-xl font-bold text-sm text-left flex items-center justify-between transition-all ${scenarioType === 'RACE' ? 'bg-orange-100 text-orange-700 border-2 border-orange-200' : 'bg-slate-50 text-slate-500 border border-transparent'}`}
               >
                 竞态条件 (Race)
                 {scenarioType === 'RACE' && <AlertTriangle size={16}/>}
               </button>
               <button 
                 onClick={() => switchScenario('MUTEX')}
                 className={`px-4 py-3 rounded-xl font-bold text-sm text-left flex items-center justify-between transition-all ${scenarioType === 'MUTEX' ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200' : 'bg-slate-50 text-slate-500 border border-transparent'}`}
               >
                 互斥锁 (Mutex)
                 {scenarioType === 'MUTEX' && <ShieldCheck size={16}/>}
               </button>
            </div>
         </div>

         {/* Story Box */}
         <div className={`flex-1 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden ${mode === 'cute' ? 'bg-indigo-50 border-2 border-indigo-100' : 'bg-slate-100 border border-slate-200'}`}>
            <div className="flex items-start gap-3 relative z-10">
               <MessageSquare size={20} className={`${mode === 'cute' ? 'text-indigo-400' : 'text-slate-400'} mt-1`}/>
               <div>
                  <h3 className={`font-bold text-lg mb-1 ${styles.text.primary}`}>步骤 {currentStepIndex + 1}/{steps.length}: {currentStep.label}</h3>
                  <p className={`text-sm leading-relaxed ${styles.text.primary} opacity-80`}>{currentStep.explanation}</p>
               </div>
            </div>
            {/* Step Controls */}
            <div className="flex justify-end gap-3 mt-4 relative z-10">
               <button 
                  onClick={handleReset}
                  className="p-2 rounded-lg bg-white border shadow-sm hover:bg-slate-50 text-slate-500 transition-colors"
                  title="重新开始"
               >
                  <RotateCcw size={18}/>
               </button>
               <button 
                  onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                  disabled={currentStepIndex === 0}
                  className="px-4 py-2 rounded-lg bg-white border shadow-sm hover:bg-slate-50 text-slate-700 font-bold text-sm disabled:opacity-50 flex items-center gap-1"
               >
                  <ChevronLeft size={16}/> 上一步
               </button>
               <button 
                  onClick={handleNext}
                  disabled={currentStepIndex === steps.length - 1}
                  className={`px-6 py-2 rounded-lg shadow-md hover:translate-y-[-1px] active:translate-y-[1px] transition-all font-bold text-sm text-white flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${mode === 'cute' ? 'bg-indigo-400 hover:bg-indigo-500' : 'bg-blue-600 hover:bg-blue-700'}`}
               >
                  下一步 <ChevronRight size={16}/>
               </button>
            </div>
         </div>
      </div>

      {/* 2. Visual Stage */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[400px]">
         
         {/* LEFT: Memory & Threads Visual */}
         <div className="flex-1 flex flex-col gap-6">
            
            {/* Shared Memory Area */}
            <div className={`${styles.card} p-6 flex items-center justify-between relative`}>
               <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-2 font-bold text-slate-500 uppercase text-xs">
                   <Database size={14}/> 共享内存 (Address: 0x1000)
                 </div>
                 <h3 className={`font-bold text-xl ${styles.text.primary}`}>变量 X</h3>
               </div>

               {/* Value Box */}
               <div className={`w-32 h-24 rounded-2xl border-4 flex flex-col items-center justify-center transition-all duration-300 relative z-10 ${currentStep.lockOwner ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-slate-50'}`}>
                  <span className="text-4xl font-black font-mono text-slate-700">{currentStep.memoryVal}</span>
                  {currentStep.lockOwner && (
                     <div className="absolute -top-3 right-0 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                        <Lock size={10}/> Locked by {currentStep.lockOwner}
                     </div>
                  )}
               </div>

               {/* Visual Actions (Arrows) */}
               {currentStep.visualAction === 'READ_A' && (
                  <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-full h-1 bg-gradient-to-l from-transparent via-blue-400 to-transparent animate-pulse opacity-50 pointer-events-none" />
               )}
               {/* Note: Complex animation paths are simplified here using status indicators in thread panels instead */}
            </div>

            {/* Threads Area */}
            <div className="grid grid-cols-2 gap-6 flex-1">
               <ThreadPanel 
                  id="A"
                  state={currentStep.threadAState}
                  instructions={scenarioType === 'MUTEX' ? MUTEX_INSTRUCTIONS : INSTRUCTIONS}
                  isActive={currentStep.activeThread === 'A'}
                  action={currentStep.visualAction?.includes('_A') ? currentStep.visualAction : null}
                  color="blue"
                  mode={mode}
               />
               <ThreadPanel 
                  id="B"
                  state={currentStep.threadBState}
                  instructions={scenarioType === 'MUTEX' ? MUTEX_INSTRUCTIONS : INSTRUCTIONS}
                  isActive={currentStep.activeThread === 'B'}
                  action={currentStep.visualAction?.includes('_B') ? currentStep.visualAction : null}
                  color="purple"
                  mode={mode}
               />
            </div>
         </div>

         {/* RIGHT: Logs */}
         <div className={`${styles.card} w-full lg:w-72 shrink-0 flex flex-col overflow-hidden`}>
            <div className={`p-4 border-b text-xs font-bold uppercase text-slate-500 bg-slate-50 flex justify-between`}>
               <span>运行日志</span>
               <span className="bg-slate-200 px-2 rounded text-slate-600">{logs.length} Lines</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs bg-slate-900 text-slate-300">
               {logs.length === 0 && <div className="text-slate-600 italic text-center mt-10">点击“下一步”开始...</div>}
               {logs.map((l, i) => (
                  <div key={i} className="animate-in slide-in-from-left-2 break-words leading-relaxed border-l-2 border-slate-700 pl-2">
                     <span className="text-slate-500 mr-2">[{i+1}]</span>
                     {l}
                  </div>
               ))}
               <div ref={logsEndRef} />
            </div>
         </div>

      </div>
    </div>
  );
};

// --- Helper Component: Thread Panel ---
const ThreadPanel = ({ id, state, instructions, isActive, action, color, mode }: any) => {
  return (
    <div className={`flex flex-col rounded-2xl border-2 transition-all duration-300 relative overflow-hidden ${
      isActive 
        ? (mode === 'cute' ? `border-${color}-400 bg-white ring-4 ring-${color}-100 shadow-xl scale-[1.02] z-10` : `border-${color}-500 bg-white ring-4 ring-${color}-100 shadow-xl scale-[1.02] z-10`) 
        : `border-slate-200 bg-slate-50 opacity-70`
    }`}>
      {/* Action Overlay */}
      {action && (
         <div className={`absolute inset-0 z-20 flex items-center justify-center bg-white/50 backdrop-blur-[1px] animate-in fade-in duration-200`}>
            <div className={`px-4 py-2 rounded-xl shadow-lg font-bold text-white flex items-center gap-2 animate-bounce ${action.includes('READ') ? 'bg-blue-500' : action.includes('WRITE') ? 'bg-orange-500' : 'bg-red-500'}`}>
               {action.includes('READ') && <ArrowDown size={18}/>}
               {action.includes('WRITE') && <ArrowUp size={18}/>}
               {action.includes('READ') ? '读取内存 (LOAD)' : action.includes('WRITE') ? '写入内存 (STORE)' : action.includes('LOCK') ? '加锁 (LOCK)' : '阻塞 (BLOCKED)'}
            </div>
         </div>
      )}

      <div className="p-3 border-b flex justify-between items-center bg-slate-50/50">
         <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-white text-xs bg-${color}-500`}>
              {id}
            </div>
            <div className="text-xs font-bold text-slate-700">Thread {id}</div>
         </div>
         <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
            state.state === 'RUNNING' ? 'bg-green-100 text-green-600 border-green-200' :
            state.state === 'BLOCKED' ? 'bg-red-100 text-red-600 border-red-200' :
            state.state === 'FINISHED' ? 'bg-slate-200 text-slate-500 border-slate-300' :
            'bg-slate-100 text-slate-400 border-slate-200'
         }`}>
            {state.state}
         </div>
      </div>

      <div className="flex-1 p-3 flex flex-col gap-3">
         {/* Register View */}
         <div className="flex items-center justify-between bg-slate-100 p-2 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Cpu size={12}/> Reg</span>
            <span className={`font-mono font-bold text-lg ${state.reg !== null ? `text-${color}-600` : 'text-slate-300'}`}>
               {state.reg !== null ? state.reg : '-'}
            </span>
         </div>

         {/* Code View */}
         <div className="bg-slate-800 rounded-lg p-2 font-mono text-[10px] text-slate-400 shadow-inner flex-1 flex flex-col gap-1 overflow-hidden">
            {instructions.map((line: any, idx: number) => {
               const isCurrentLine = state.pc === idx;
               return (
                 <div key={idx} className={`flex gap-2 py-1 px-2 rounded transition-all ${isCurrentLine ? 'bg-slate-600 text-white font-bold' : 'opacity-40'}`}>
                    <span className="w-3 text-right opacity-50">{idx}</span>
                    <span className={isCurrentLine ? `text-${color}-300` : ''}>{line.code}</span>
                 </div>
               )
            })}
         </div>
      </div>
    </div>
  );
}
