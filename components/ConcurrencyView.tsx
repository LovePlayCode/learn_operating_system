
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { ShieldCheck, ShieldAlert, Cpu, Database, Play, Pause, RotateCcw, Plus, Minus, UserPlus, Utensils, AlertTriangle } from 'lucide-react';

// --- Race Condition Demo ---
const RaceConditionDemo = () => {
  const { styles, mode } = useTheme();
  const [counter, setCounter] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [thread1State, setThread1State] = useState<'idle' | 'load' | 'store'>('idle');
  const [thread2State, setThread2State] = useState<'idle' | 'load' | 'store'>('idle');
  const [lockActive, setLockActive] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 5));

  const runUnprotected = async () => {
    addLog("线程 1: 开始加载 Counter...");
    setThread1State('load');
    await new Promise(r => setTimeout(r, 800));
    
    addLog("时钟中断！切换到线程 2");
    setThread2State('load');
    await new Promise(r => setTimeout(r, 800));
    
    addLog("线程 2: 将 Counter+1 并存回");
    setCounter(c => c + 1);
    setThread2State('store');
    await new Promise(r => setTimeout(r, 500));
    setThread2State('idle');

    addLog("线程 1: 恢复执行，存回旧值+1");
    setCounter(c => c + 1); // 模拟错误的覆盖逻辑
    setThread1State('store');
    await new Promise(r => setTimeout(r, 500));
    setThread1State('idle');
    addLog("结果异常！这就是竞态条件。");
  };

  const runProtected = async () => {
    if (lockActive) return;
    setLockActive(true);
    addLog("线程 1: 尝试获取 Mutex...");
    setThread1State('load');
    await new Promise(r => setTimeout(r, 500));
    
    addLog("线程 1: 成功加锁 🔒");
    setIsLocked(true);
    await new Promise(r => setTimeout(r, 800));
    
    addLog("时钟中断！切换线程 2...");
    setThread2State('load');
    await new Promise(r => setTimeout(r, 500));
    addLog("线程 2: Mutex 已锁定，进入阻塞队列");
    setThread2State('idle'); // 实际上是 blocked
    
    await new Promise(r => setTimeout(r, 800));
    addLog("线程 1: 释放 Mutex 🔓");
    setIsLocked(false);
    setCounter(c => c + 1);
    setThread1State('idle');
    
    addLog("线程 2: 被唤醒，获取 Mutex...");
    setThread2State('load');
    setIsLocked(true);
    await new Promise(r => setTimeout(r, 500));
    setCounter(c => c + 1);
    setIsLocked(false);
    setThread2State('idle');
    setLockActive(false);
    addLog("结果正确：2");
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        {/* Memory View */}
        <div className={`${styles.card} p-6 flex flex-col items-center justify-center relative`}>
           <div className={`absolute top-4 left-4 flex items-center gap-2 ${styles.text.primary}`}>
             <Database size={18}/> 共享内存 (Shared Data)
           </div>
           
           <div className={`w-32 h-32 rounded-3xl border-4 flex flex-col items-center justify-center transition-all duration-500 ${isLocked ? 'border-red-400 bg-red-50' : 'border-emerald-400 bg-emerald-50'}`}>
              <div className="text-4xl font-black font-mono">{counter}</div>
              <div className="text-[10px] uppercase font-bold opacity-50">Variable X</div>
           </div>

           {isLocked && (
             <div className="mt-4 flex items-center gap-2 text-red-500 font-bold animate-pulse">
               <ShieldAlert size={16}/> MUTEX LOCKED
             </div>
           )}
        </div>

        {/* Thread States */}
        <div className={`${styles.card} p-6 flex flex-col gap-4`}>
           <h3 className={`font-bold flex items-center gap-2 ${styles.text.primary}`}><Cpu size={18}/> 执行单元</h3>
           
           <div className={`p-4 rounded-xl border-2 transition-all ${thread1State !== 'idle' ? 'border-blue-400 bg-blue-50' : 'border-slate-100 opacity-50'}`}>
             <div className="flex justify-between items-center mb-2">
               <span className="font-bold">Thread A</span>
               <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded">Core 0</span>
             </div>
             <div className="text-xs font-mono">Instruction: {thread1State === 'load' ? 'LOAD R1, [X]' : thread1State === 'store' ? 'STORE [X], R1' : 'IDLE'}</div>
           </div>

           <div className={`p-4 rounded-xl border-2 transition-all ${thread2State !== 'idle' ? 'border-purple-400 bg-purple-50' : 'border-slate-100 opacity-50'}`}>
             <div className="flex justify-between items-center mb-2">
               <span className="font-bold">Thread B</span>
               <span className="text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded">Core 1</span>
             </div>
             <div className="text-xs font-mono">Instruction: {thread2State === 'load' ? 'LOAD R1, [X]' : thread2State === 'store' ? 'STORE [X], R1' : 'IDLE'}</div>
           </div>

           <div className="mt-auto bg-slate-900 text-slate-300 p-3 rounded-lg font-mono text-[10px] h-24 overflow-hidden">
             {logs.map((l, i) => <div key={i}>{'> '}{l}</div>)}
           </div>
        </div>
      </div>

      <div className={`${styles.card} p-4 flex justify-center gap-4`}>
         <button onClick={runUnprotected} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all">
           <ShieldAlert size={18}/> 模拟竞态条件
         </button>
         <button onClick={runProtected} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all">
           <ShieldCheck size={18}/> 模拟互斥锁 (Mutex)
         </button>
         <button onClick={() => { setCounter(0); setLogs([]); setIsLocked(false); }} className={styles.button.icon + " p-2"}>
           <RotateCcw size={20}/>
         </button>
      </div>
    </div>
  );
};

// --- Producer Consumer ---
const ProducerConsumerDemo = () => {
  const { styles, mode } = useTheme();
  const [buffer, setBuffer] = useState<number[]>([]);
  const [semEmpty, setSemEmpty] = useState(5);
  const [semFull, setSemFull] = useState(0);
  const [semMutex, setSemMutex] = useState(1);
  const BUFFER_SIZE = 5;

  const produce = async () => {
    if (semEmpty === 0) return;
    
    // Wait(empty)
    setSemEmpty(s => s - 1);
    // Wait(mutex)
    setSemMutex(0);
    await new Promise(r => setTimeout(r, 400));
    
    setBuffer(prev => [...prev, Math.floor(Math.random() * 100)]);
    
    // Signal(mutex)
    setSemMutex(1);
    // Signal(full)
    setSemFull(s => s + 1);
  };

  const consume = async () => {
    if (semFull === 0) return;

    // Wait(full)
    setSemFull(s => s - 1);
    // Wait(mutex)
    setSemMutex(0);
    await new Promise(r => setTimeout(r, 400));
    
    setBuffer(prev => prev.slice(1));
    
    // Signal(mutex)
    setSemMutex(1);
    // Signal(empty)
    setSemEmpty(s => s + 1);
  };

  return (
    <div className="flex flex-col gap-6 h-full">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`${styles.card} p-4 text-center`}>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Semaphore: EMPTY</div>
            <div className={`text-4xl font-black ${semEmpty === 0 ? 'text-red-500' : 'text-blue-500'}`}>{semEmpty}</div>
            <div className="text-[10px] mt-1 opacity-50">可写入槽位</div>
          </div>
          <div className={`${styles.card} p-4 text-center`}>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Semaphore: FULL</div>
            <div className={`text-4xl font-black ${semFull === 0 ? 'text-red-500' : 'text-orange-500'}`}>{semFull}</div>
            <div className="text-[10px] mt-1 opacity-50">待消费数据</div>
          </div>
          <div className={`${styles.card} p-4 text-center`}>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Semaphore: MUTEX</div>
            <div className={`text-4xl font-black ${semMutex === 0 ? 'text-red-500' : 'text-emerald-500'}`}>{semMutex}</div>
            <div className="text-[10px] mt-1 opacity-50">二进制信号量</div>
          </div>
       </div>

       <div className={`${styles.card} p-8 flex-1 flex flex-col items-center justify-center`}>
          <div className="flex gap-4 mb-12">
             {Array.from({ length: BUFFER_SIZE }).map((_, i) => (
               <div key={i} className={`w-20 h-20 rounded-2xl border-4 flex items-center justify-center transition-all duration-500 ${buffer[i] !== undefined ? 'border-orange-400 bg-orange-50 scale-105' : 'border-slate-100 bg-slate-50 opacity-30'}`}>
                 {buffer[i] !== undefined && <span className="font-bold text-orange-600">{buffer[i]}</span>}
               </div>
             ))}
          </div>
          
          <div className="flex gap-8">
             <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                   <Plus size={32}/>
                </div>
                <button onClick={produce} disabled={semEmpty === 0 || semMutex === 0} className={styles.button.primary + " px-8 py-2 disabled:opacity-30"}>
                  生产 (Producer)
                </button>
             </div>

             <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shadow-lg">
                   <Minus size={32}/>
                </div>
                <button onClick={consume} disabled={semFull === 0 || semMutex === 0} className={styles.button.secondary + " px-8 py-2 disabled:opacity-30"}>
                  消费 (Consumer)
                </button>
             </div>
          </div>
       </div>
    </div>
  );
};

// --- Dining Philosophers ---
const PhilosophersDemo = () => {
  const { styles, mode } = useTheme();
  const [states, setStates] = useState<('thinking' | 'hungry' | 'eating')[]>(new Array(5).fill('thinking'));
  const [forks, setForks] = useState<boolean[]>(new Array(5).fill(true)); // true = available

  const togglePhilosopher = (i: number) => {
    const leftFork = i;
    const rightFork = (i + 1) % 5;

    if (states[i] === 'thinking') {
      setStates(prev => { const n = [...prev]; n[i] = 'hungry'; return n; });
    } else if (states[i] === 'hungry') {
      // Try pick forks
      if (forks[leftFork] && forks[rightFork]) {
        setForks(prev => { const n = [...prev]; n[leftFork] = false; n[rightFork] = false; return n; });
        setStates(prev => { const n = [...prev]; n[i] = 'eating'; return n; });
      }
    } else {
      // Release forks
      setForks(prev => { const n = [...prev]; n[leftFork] = true; n[rightFork] = true; return n; });
      setStates(prev => { const n = [...prev]; n[i] = 'thinking'; return n; });
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
       <div className={`${styles.card} p-8 flex-1 flex items-center justify-center relative`}>
          <div className="w-64 h-64 rounded-full border-8 border-amber-100 bg-amber-50/30 relative flex items-center justify-center">
             <span className="text-slate-300 font-bold uppercase tracking-widest">Shared Table</span>
             
             {/* Philosophers */}
             {states.map((s, i) => {
                const angle = (i * 72 - 90) * (Math.PI / 180);
                const x = Math.cos(angle) * 140;
                const y = Math.sin(angle) * 140;
                return (
                  <button 
                    key={i}
                    onClick={() => togglePhilosopher(i)}
                    className={`absolute w-16 h-16 rounded-full border-4 shadow-xl transition-all duration-500 flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 hover:scale-110
                      ${s === 'thinking' ? 'bg-slate-100 border-slate-300 text-slate-400' : s === 'hungry' ? 'bg-amber-100 border-amber-400 text-amber-600 animate-pulse' : 'bg-emerald-100 border-emerald-400 text-emerald-600 scale-125'}
                    `}
                    style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
                  >
                    <Utensils size={20}/>
                    <span className="text-[8px] font-bold">P{i}</span>
                  </button>
                )
             })}

             {/* Forks */}
             {forks.map((f, i) => {
                const angle = (i * 72 - 54) * (Math.PI / 180);
                const x = Math.cos(angle) * 80;
                const y = Math.sin(angle) * 80;
                return (
                  <div 
                    key={i}
                    className={`absolute w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 ${f ? 'text-slate-400' : 'text-red-500 opacity-20 rotate-45 scale-75'}`}
                    style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
                  >
                    /
                  </div>
                )
             })}
          </div>

          <div className="absolute bottom-4 right-4 flex items-center gap-2 text-xs bg-red-50 text-red-500 p-2 rounded-lg border border-red-100">
             <AlertTriangle size={14}/> 尝试让所有人同时变饿，可能会发生死锁！
          </div>
       </div>
    </div>
  );
};

export const ConcurrencyView: React.FC = () => {
  const { styles, mode } = useTheme();
  const [tab, setTab] = useState<'mutex' | 'semaphore' | 'dining'>('mutex');

  return (
    <div className={`flex flex-col h-full p-6 gap-6 ${styles.bg}`}>
       <div className="flex justify-center">
         <div className={`p-1 rounded-xl flex gap-1 border ${mode === 'cute' ? 'bg-white border-pink-100' : 'bg-slate-200 border-slate-300'}`}>
           <button onClick={() => setTab('mutex')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${tab === 'mutex' ? (mode === 'cute' ? 'bg-pink-400 text-white shadow' : 'bg-white text-slate-800 shadow') : 'text-slate-400 hover:text-slate-600'}`}>
             互斥锁 (Mutex)
           </button>
           <button onClick={() => setTab('semaphore')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${tab === 'semaphore' ? (mode === 'cute' ? 'bg-pink-400 text-white shadow' : 'bg-white text-slate-800 shadow') : 'text-slate-400 hover:text-slate-600'}`}>
             信号量 (Producer-Consumer)
           </button>
           <button onClick={() => setTab('dining')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${tab === 'dining' ? (mode === 'cute' ? 'bg-pink-400 text-white shadow' : 'bg-white text-slate-800 shadow') : 'text-slate-400 hover:text-slate-600'}`}>
             经典问题 (Deadlock)
           </button>
         </div>
       </div>

       {tab === 'mutex' ? <RaceConditionDemo /> : tab === 'semaphore' ? <ProducerConsumerDemo /> : <PhilosophersDemo />}
    </div>
  );
};
