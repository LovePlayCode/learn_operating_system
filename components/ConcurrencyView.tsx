
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { ShieldCheck, ShieldAlert, Cpu, Database, Play, Pause, RotateCcw, Plus, Minus, UserPlus, Utensils, AlertTriangle, Lock, Unlock, ArrowDown, ArrowUp, ChevronRight, ChevronLeft, MessageSquare } from 'lucide-react';

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
  const [tab, setTab] = useState<'mutex' | 'semaphore' | 'dining'>('mutex');

  return (
    <div className={`flex flex-col h-full p-6 gap-6 ${styles.bg}`}>
       <div className="flex justify-center shrink-0">
         <div className={`p-1 rounded-xl flex gap-1 border ${mode === 'cute' ? 'bg-white border-pink-100' : 'bg-slate-200 border-slate-300'}`}>
           <button onClick={() => setTab('mutex')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${tab === 'mutex' ? (mode === 'cute' ? 'bg-pink-400 text-white shadow' : 'bg-white text-slate-800 shadow') : 'text-slate-400 hover:text-slate-600'}`}>
             互斥锁与竞态 (Mutex)
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
