
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Play, Pause, RotateCcw, Plus, Clock, Activity, ListOrdered, GitCommit, ArrowRight, LayoutTemplate, Ticket, Info, FileDigit, Cpu, Hash, HardDrive, ScanFace, Box, Layers, FolderOpen, BookOpen, ChevronRight, FileCode, PlayCircle, Zap } from 'lucide-react';
import { Process, ProcessState, AlgorithmType, TimeSlice } from '../types';

const ALGO_DESCRIPTIONS: Record<AlgorithmType, string> = {
  [AlgorithmType.FIFO]: "先来先服务 (FIFO): 非抢占式。严格按照到达顺序执行。简单，但存在“护航效应”，短任务可能被长任务阻塞。",
  [AlgorithmType.RR]: "时间片轮转 (RR): 抢占式。每个进程分配固定时间片。公平性好，响应时间短，适用于分时系统。",
  [AlgorithmType.MLFQ]: "多级反馈队列: 动态调整。通常包含多个队列，优先级递减，时间片递增。I/O 密集型保持高优先级。",
  [AlgorithmType.SJF]: "最短任务优先 (SJF): 非抢占式。选择预估 Burst Time 最短的进程执行到底。平均等待时间最优，但长作业可能面临“饥饿”。",
  [AlgorithmType.SRTF]: "最短完成时间优先 (SRTF): SJF 的抢占式版本。如果新到达进程剩余时间更短，则抢占当前进程。吞吐量高。",
  [AlgorithmType.LOTTERY]: "比例/彩票调度 (Proportional): 概率性调度。进程持有一定数量彩票，CPU 随机抽取。票数越多，获得 CPU 概率越高，实现比例分配。"
};

// --- Knowledge Base for PCB ---
const PCB_KNOWLEDGE = {
  'INTRO': {
    title: '进程控制块 (PCB)',
    subtitle: 'struct task_struct',
    desc: 'PCB 是操作系统内核中描述进程的数据结构。它是进程存在的唯一标志。内核通过 PCB 来管理进程的生命周期、资源分配和调度。',
    points: [
      'Linux 中对应 struct task_struct',
      '包含进程所有运行时信息',
      '常驻内核内存 (Kernel Space)',
      '上下文切换的核心对象'
    ]
  },
  'ID': {
    title: '标识符 (Identifiers)',
    subtitle: 'PID & PPID',
    desc: '每个进程都有唯一的 ID (PID)。进程通常由父进程创建 (fork)，因此也有父进程 ID (PPID)。',
    points: [
      'PID: 进程唯一编号，用于 kill 或查找',
      'PPID: 父进程编号，形成进程树',
      'UID/GID: 决定进程的文件访问权限'
    ]
  },
  'STATE': {
    title: '进程状态 (State)',
    subtitle: 'volatile long state',
    desc: '记录进程当前处于什么阶段。调度器根据状态决定是否将 CPU 分配给该进程。',
    points: [
      'Running: 正在 CPU 上执行',
      'Ready: 准备好执行，等待调度',
      'Blocked: 等待 I/O 或锁，不可被调度',
      'Zombie: 已退出但父进程未回收'
    ]
  },
  'CPU': {
    title: '处理器上下文 (Context)',
    subtitle: 'struct thread_struct',
    desc: '当进程被切出 CPU 时，必须保存当前的寄存器值（存档），以便下次恢复执行（读档）。',
    points: [
      'PC (Program Counter): 下一条指令地址',
      'SP (Stack Pointer): 当前栈顶位置',
      'General Regs: AX, BX, CX 等通用寄存器',
      '这是实现“并发”的硬件基础'
    ]
  },
  'MEM': {
    title: '内存描述符 (Memory)',
    subtitle: 'struct mm_struct *mm',
    desc: '指向进程的虚拟地址空间信息。包含页表指针、代码段、数据段、堆和栈的起始/结束地址。',
    points: [
      '页表基址 (CR3): 用于虚拟地址转换',
      'VMA: 虚拟内存区域链表',
      '隔离性: 确保进程不能访问其他进程内存'
    ]
  },
  'SCHED': {
    title: '调度信息 (Scheduling)',
    subtitle: 'prio, policy, rt_priority',
    desc: '调度器根据这些信息决定谁先运行，以及运行多久。',
    points: [
      'Priority: 优先级 (Nice value)',
      'Policy: 调度策略 (如 SCHED_NORMAL)',
      'Time Slice: 剩余时间片',
      'cpus_allowed: 可以在哪些核上运行'
    ]
  },
  'FILES': {
    title: '打开文件表 (Files)',
    subtitle: 'struct files_struct *files',
    desc: '记录进程打开的所有文件。文件描述符 (FD) 就是这个数组的下标。',
    points: [
      'FD 0, 1, 2: 标准输入、输出、错误',
      'fd_array[]: 指向系统级打开文件表的指针',
      '资源限制: 每个进程能打开的文件数是有限的'
    ]
  }
};

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
      {!compact && <div className="text-[10px] opacity-70">执行: {p.remainingTime}/{p.burstTime}</div>}
      <div className={`absolute top-0 right-0 w-3 h-3 rounded-full -mt-1 -mr-1 ${p.state === ProcessState.RUNNING ? 'bg-green-400 animate-pulse' : 'bg-slate-300'}`}></div>
    </div>
  );
};

// --- New: Program to Process Visualization ---
const ProgramToProcessView = () => {
  const { styles, mode } = useTheme();
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "1. 存储阶段 (Program on Disk)",
      desc: "程序只是躺在硬盘上的一个二进制文件（如 .exe 或 ELF）。它包含代码指令（Text）和初始化数据（Data），此时它是“死”的，不占用内存。",
      activeParts: ['disk']
    },
    {
      title: "2. 加载与映射 (Loading)",
      desc: "操作系统读取文件头，申请虚拟内存空间。加载器（Loader）将磁盘上的代码段和数据段复制（或映射）到内存中。",
      activeParts: ['disk', 'loader', 'mem-static']
    },
    {
      title: "3. 内存分配 (Allocation)",
      desc: "OS 为进程分配“栈 (Stack)”用于函数调用和局部变量，分配“堆 (Heap)”用于动态内存。BSS 段被初始化为 0。",
      activeParts: ['disk', 'loader', 'mem-static', 'mem-dynamic']
    },
    {
      title: "4. PCB 创建 (Context Setup)",
      desc: "内核创建 task_struct (PCB)，分配 PID，初始化文件表和页表。程序正式变为“进程”，进入就绪状态。",
      activeParts: ['disk', 'loader', 'mem-static', 'mem-dynamic', 'pcb']
    },
    {
      title: "5. 开始执行 (Execution)",
      desc: "CPU 的 PC 寄存器指向程序的入口点（如 _start 或 main）。进程开始在 CPU 上“活”了起来。",
      activeParts: ['disk', 'loader', 'mem-static', 'mem-dynamic', 'pcb', 'cpu']
    }
  ];

  const isActive = (part: string) => steps[step].activeParts.includes(part);

  return (
    <div className="flex flex-col h-full gap-6">
       {/* Controller */}
       <div className={`${styles.card} p-6 shrink-0 flex items-center justify-between`}>
          <div>
            <h3 className={`font-bold text-lg ${styles.text.primary}`}>从程序到进程 (From Program to Process)</h3>
            <p className={`text-sm ${styles.text.secondary}`}>
               Step {step + 1}/{steps.length}: {steps[step].title}
            </p>
          </div>
          <div className="flex gap-2">
             <button onClick={() => setStep(0)} className={styles.button.icon + " p-3"}>
               <RotateCcw size={18}/>
             </button>
             <button 
               onClick={() => setStep(s => Math.min(s + 1, steps.length - 1))} 
               disabled={step === steps.length - 1}
               className={`${styles.button.primary} px-6 py-2 flex items-center gap-2 disabled:opacity-50`}
             >
               下一步 <ArrowRight size={18}/>
             </button>
          </div>
       </div>

       {/* Main Stage */}
       <div className="flex-1 flex gap-8 items-stretch min-h-[500px]">
          
          {/* 1. DISK (Left) */}
          <div className={`w-1/4 flex flex-col items-center justify-center transition-opacity duration-500 ${step > 0 ? 'opacity-60 grayscale' : 'opacity-100'}`}>
             <div className={`w-48 h-64 rounded-xl border-4 flex flex-col items-center justify-center relative shadow-xl ${mode === 'cute' ? 'bg-slate-700 border-slate-600' : 'bg-slate-800 border-slate-700'}`}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 bg-slate-200 text-slate-800 px-3 py-1 rounded-full text-xs font-bold border border-slate-300">Hard Disk</div>
                <HardDrive size={48} className="text-slate-500 mb-4"/>
                
                {/* File on Disk */}
                <div className={`w-32 bg-white rounded-lg p-2 shadow-lg flex flex-col gap-1 transition-transform ${isActive('loader') ? 'translate-x-20 opacity-0 duration-1000' : ''}`}>
                   <div className="flex items-center gap-2 border-b pb-1 mb-1">
                     <FileCode size={16} className="text-blue-500"/>
                     <span className="text-xs font-bold text-slate-700">game.exe</span>
                   </div>
                   <div className="h-6 bg-emerald-100 rounded border border-emerald-200 text-[8px] flex items-center justify-center text-emerald-700">.text (Code)</div>
                   <div className="h-4 bg-blue-100 rounded border border-blue-200 text-[8px] flex items-center justify-center text-blue-700">.data (Init)</div>
                   <div className="h-4 bg-slate-100 rounded border border-slate-200 text-[8px] flex items-center justify-center text-slate-400">Headers</div>
                </div>
                <div className="text-xs text-slate-400 mt-4 text-center px-4">Passive Entity<br/>(静态实体)</div>
             </div>
          </div>

          {/* Arrow / Loader */}
          <div className="flex flex-col justify-center items-center w-24 relative">
             {isActive('loader') && (
               <>
                 <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10"></div>
                 <div className="bg-white p-3 rounded-full shadow-lg border animate-bounce z-10">
                    <ArrowRight size={24} className={mode === 'cute' ? 'text-pink-400' : 'text-blue-600'}/>
                 </div>
                 <div className="mt-2 text-[10px] font-bold uppercase text-slate-400 bg-white px-2 py-0.5 rounded border">OS Loader</div>
               </>
             )}
          </div>

          {/* 2. RAM (Right) */}
          <div className="flex-1 flex flex-col items-center justify-center">
             <div className={`w-full max-w-md h-[450px] rounded-[2rem] border-4 relative flex flex-col items-center pt-10 shadow-2xl transition-all ${mode === 'cute' ? 'bg-pink-50 border-pink-200' : 'bg-slate-50 border-slate-300'}`}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-bold border border-emerald-200 shadow-sm flex items-center gap-2">
                   <Zap size={14} fill="currentColor"/> RAM (Memory)
                </div>

                {/* Process Address Space */}
                {isActive('mem-static') ? (
                  <div className="w-64 flex-1 flex flex-col gap-1 mb-8 animate-in zoom-in duration-500">
                     <div className="flex justify-between text-[10px] text-slate-400 px-1"><span>0xFFFFFFFF</span><span>High Addr</span></div>
                     
                     {/* Kernel Space */}
                     <div className="h-12 bg-slate-200 rounded-t-lg border-2 border-slate-300 border-dashed flex items-center justify-center text-xs text-slate-400 font-mono">
                        Kernel Space
                     </div>

                     {/* Stack */}
                     <div className={`transition-all duration-700 h-24 rounded border-2 flex flex-col items-center justify-center text-xs font-bold relative ${isActive('mem-dynamic') ? (mode === 'cute' ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-indigo-100 border-indigo-300 text-indigo-700') : 'opacity-0'}`}>
                        Stack (栈)
                        <span className="text-[9px] font-normal opacity-70">Local Vars / Return Addr</span>
                        <div className="absolute bottom-1 right-2 text-[8px] opacity-50">⬇ Grows Down</div>
                     </div>

                     {/* Empty / Heap Gap */}
                     <div className="flex-1 flex items-center justify-center">
                        {isActive('mem-dynamic') && <div className="text-slate-300 text-lg">...</div>}
                     </div>

                     {/* Heap */}
                     <div className={`transition-all duration-700 h-16 rounded border-2 flex flex-col items-center justify-center text-xs font-bold relative ${isActive('mem-dynamic') ? (mode === 'cute' ? 'bg-orange-100 border-orange-300 text-orange-700' : 'bg-amber-100 border-amber-300 text-amber-700') : 'opacity-0'}`}>
                        Heap (堆)
                        <span className="text-[9px] font-normal opacity-70">malloc / new</span>
                        <div className="absolute top-1 right-2 text-[8px] opacity-50">⬆ Grows Up</div>
                     </div>

                     {/* Data */}
                     <div className={`h-10 rounded border-2 flex items-center justify-center text-xs font-bold ${mode === 'cute' ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-sky-100 border-sky-300 text-sky-700'}`}>
                        .data / .bss
                     </div>

                     {/* Text */}
                     <div className={`h-16 rounded-b-lg border-2 flex flex-col items-center justify-center text-xs font-bold ${mode === 'cute' ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-green-100 border-green-300 text-green-700'}`}>
                        .text (Code Segment)
                        <span className="text-[9px] font-normal opacity-70">Binary Instructions</span>
                     </div>

                     <div className="flex justify-between text-[10px] text-slate-400 px-1"><span>0x00000000</span><span>Low Addr</span></div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                     <Box size={48} className="mb-2 opacity-50"/>
                     <span className="text-sm">Empty Space</span>
                  </div>
                )}
                
                {/* PCB Badge */}
                {isActive('pcb') && (
                  <div className="absolute -right-16 top-20 animate-in slide-in-from-left-4 duration-500">
                     <div className={`w-32 bg-white p-3 rounded-xl border-2 shadow-lg ${mode === 'cute' ? 'border-pink-300' : 'border-slate-600'}`}>
                        <div className="text-[10px] font-bold uppercase mb-1 flex items-center gap-1">
                           <ScanFace size={12}/> Task_Struct
                        </div>
                        <div className="space-y-1 text-[9px] font-mono text-slate-600">
                           <div className="flex justify-between"><span>PID:</span> <b>101</b></div>
                           <div className="flex justify-between"><span>State:</span> <b className="text-green-500">READY</b></div>
                           <div className="flex justify-between"><span>PC:</span> <b>0x0804800</b></div>
                        </div>
                     </div>
                     {/* Connector Line */}
                     <div className="absolute top-6 -left-4 w-4 h-0.5 bg-slate-400"></div>
                  </div>
                )}
             </div>

             {isActive('cpu') && (
                <div className="mt-6 flex items-center gap-4 animate-in slide-in-from-bottom-4">
                   <div className="h-12 w-0.5 bg-slate-300"></div>
                   <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl shadow-lg text-white ${mode === 'cute' ? 'bg-gradient-to-r from-pink-400 to-orange-400' : 'bg-slate-800'}`}>
                      <PlayCircle size={24} className="animate-pulse"/>
                      <div>
                         <div className="text-xs font-bold opacity-80 uppercase">CPU Execute</div>
                         <div className="font-mono font-bold">PC -> 0x0804800 (main)</div>
                      </div>
                   </div>
                </div>
             )}
          </div>
       </div>

       {/* Explainer Footer */}
       <div className={`p-4 rounded-xl border ${mode === 'cute' ? 'bg-white border-pink-100 text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
          <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
             <BookOpen size={16} className={mode === 'cute' ? 'text-pink-400' : 'text-blue-500'}/>
             原理说明
          </h4>
          <p className="text-xs leading-relaxed opacity-80">
             {steps[step].desc}
          </p>
       </div>
    </div>
  );
};

// --- PCB Visualizer (Diagram Mode) ---
const PCBStructureView = () => {
  const { styles, mode } = useTheme();
  const [selectedId, setSelectedId] = useState<number>(1);
  const [activeSection, setActiveSection] = useState<keyof typeof PCB_KNOWLEDGE>('INTRO');
  
  // Mock Data specific for visualization
  const pcbData = [
    { id: 1, name: "System_Init", state: "RUNNING", prio: 0, pc: 0x00401A, sp: 0x7FFF0, regs: { ax: 0x1A, bx: 0x00, cx: 0xFF }, files: ["stdin", "stdout", "sys.log"] },
    { id: 102, name: "Chrome_Tab", state: "READY", prio: 5, pc: 0x0080B2, sp: 0x7FFA0, regs: { ax: 0x00, bx: 0x12, cx: 0x00 }, files: ["cache.db"] },
    { id: 105, name: "VS_Code", state: "BLOCKED", prio: 2, pc: 0x0091CC, sp: 0x7FFC8, regs: { ax: 0xEE, bx: 0xEE, cx: 0x01 }, files: ["project.ts", "node_modules"] },
    { id: 108, name: "Spotify", state: "READY", prio: 4, pc: 0x002011, sp: 0x7FF10, regs: { ax: 0x11, bx: 0x44, cx: 0x22 }, files: ["song.mp3", "audio_out"] },
  ];

  const activeProcess = pcbData.find(p => p.id === selectedId) || pcbData[0];
  const info = PCB_KNOWLEDGE[activeSection];

  const getColorByState = (s: string) => {
    switch(s) {
      case 'RUNNING': return 'bg-green-500 text-white';
      case 'READY': return 'bg-blue-500 text-white';
      case 'BLOCKED': return 'bg-amber-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[600px]">
       {/* Left: Process List */}
       <div className={`${styles.card} p-4 w-full lg:w-56 shrink-0 flex flex-col gap-3`}>
          <h3 className={`font-bold flex items-center gap-2 ${styles.text.primary} text-sm`}>
            <ListOrdered size={16}/> 进程列表
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 h-32 lg:h-auto">
             {pcbData.map(p => (
               <button 
                 key={p.id}
                 onClick={() => setSelectedId(p.id)}
                 className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center justify-between group ${
                   selectedId === p.id 
                     ? (mode === 'cute' ? 'bg-pink-50 border-pink-300 shadow-sm' : 'bg-blue-50 border-blue-400 shadow-sm') 
                     : 'bg-white border-transparent hover:bg-slate-50'
                 }`}
               >
                 <div>
                   <div className={`font-bold text-xs ${styles.text.primary}`}>{p.name}</div>
                   <div className="text-[10px] text-slate-400 font-mono">PID: {p.id}</div>
                 </div>
                 <div className={`w-2 h-2 rounded-full ${p.state === 'RUNNING' ? 'bg-green-400 animate-pulse' : p.state === 'BLOCKED' ? 'bg-amber-400' : 'bg-blue-300'}`}></div>
               </button>
             ))}
          </div>
       </div>

       {/* Center: Interactive PCB Diagram */}
       <div className="flex-1 overflow-y-auto">
          <div className="relative max-w-xl mx-auto flex flex-col gap-4">
             <div className="bg-slate-100/50 p-2 rounded-lg text-center text-xs text-slate-400 mb-2 border border-dashed border-slate-300">
                👇 点击下方各个模块，查看右侧知识点详解
             </div>

             {/* Main PCB Block */}
             <div className={`${styles.card} overflow-hidden border-4 relative transition-all duration-300 ${mode === 'cute' ? 'border-pink-200' : 'border-slate-700'}`}>
                
                {/* Header (State) */}
                <div 
                  onClick={() => setActiveSection('STATE')}
                  className={`cursor-pointer p-4 border-b-2 flex justify-between items-center transition-colors ${activeSection === 'STATE' ? 'bg-opacity-100' : 'bg-opacity-90'} ${mode === 'cute' ? 'bg-pink-100 border-pink-200 hover:bg-pink-200' : 'bg-slate-800 text-white border-slate-600 hover:bg-slate-700'}`}
                >
                   <div>
                      <h2 className="text-lg font-black tracking-wider">task_struct</h2>
                      <p className="text-[10px] opacity-70 font-mono">Kernel Addr: 0xC000{activeProcess.id}</p>
                   </div>
                   <div className={`px-3 py-1 rounded-lg font-bold text-xs shadow-sm ${getColorByState(activeProcess.state)}`}>
                      {activeProcess.state}
                   </div>
                </div>

                <div className="p-6 grid gap-6">
                   
                   {/* 1. Identifier Section */}
                   <div 
                     onClick={() => setActiveSection('ID')}
                     className={`relative group cursor-pointer p-2 -m-2 rounded-xl border-2 border-transparent transition-all ${activeSection === 'ID' ? (mode === 'cute' ? 'bg-purple-50 border-purple-200' : 'bg-slate-100 border-slate-300') : 'hover:bg-slate-50'}`}
                   >
                      <div className="absolute left-0 top-2 bottom-2 w-1 bg-purple-400 rounded-full"></div>
                      <h4 className="text-xs font-bold uppercase text-purple-500 mb-2 pl-3">Identifiers</h4>
                      <div className="grid grid-cols-2 gap-4 pl-2">
                         <div className={`p-2 rounded-lg border flex justify-between items-center bg-white ${mode === 'cute' ? 'border-purple-100' : 'border-slate-200'}`}>
                            <span className="text-xs text-slate-500 font-bold">PID</span>
                            <span className="font-mono font-bold">{activeProcess.id}</span>
                         </div>
                         <div className={`p-2 rounded-lg border flex justify-between items-center bg-white ${mode === 'cute' ? 'border-purple-100' : 'border-slate-200'}`}>
                            <span className="text-xs text-slate-500 font-bold">PPID</span>
                            <span className="font-mono font-bold">0</span>
                         </div>
                      </div>
                   </div>

                   {/* 2. CPU Context */}
                   <div 
                     onClick={() => setActiveSection('CPU')}
                     className={`relative group cursor-pointer p-2 -m-2 rounded-xl border-2 border-transparent transition-all ${activeSection === 'CPU' ? (mode === 'cute' ? 'bg-blue-50 border-blue-200' : 'bg-slate-100 border-slate-300') : 'hover:bg-slate-50'}`}
                   >
                      <div className="absolute left-0 top-2 bottom-2 w-1 bg-blue-400 rounded-full"></div>
                      <h4 className="text-xs font-bold uppercase text-blue-500 mb-2 pl-3">CPU Context (Registers)</h4>
                      
                      <div className={`pl-2`}>
                         <div className="grid grid-cols-4 gap-2 mb-2">
                            {['AX', 'BX', 'CX', 'DX'].map((reg, i) => (
                               <div key={reg} className="text-center bg-white border rounded py-1 shadow-sm text-[10px] font-mono">
                                  <span className="text-slate-400 block text-[8px]">{reg}</span>
                                  {i === 0 ? `0x${activeProcess.regs.ax.toString(16).toUpperCase()}` : 
                                   i === 1 ? `0x${activeProcess.regs.bx.toString(16).toUpperCase()}` :
                                   i === 2 ? `0x${activeProcess.regs.cx.toString(16).toUpperCase()}` : '0x00'}
                               </div>
                            ))}
                         </div>
                         <div className="flex gap-2 text-[10px]">
                            <div className="flex-1 bg-slate-700 text-white rounded px-2 py-1 flex justify-between">
                               <span className="opacity-60">PC</span>
                               <span className="font-mono text-yellow-400">0x{activeProcess.pc.toString(16).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 bg-slate-600 text-white rounded px-2 py-1 flex justify-between">
                               <span className="opacity-60">SP</span>
                               <span className="font-mono">0x{activeProcess.sp.toString(16).toUpperCase()}</span>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* 3. Memory & Scheduling */}
                   <div className="grid grid-cols-2 gap-4">
                      <div 
                        onClick={() => setActiveSection('MEM')}
                        className={`relative cursor-pointer p-2 -m-2 rounded-xl border-2 border-transparent transition-all ${activeSection === 'MEM' ? (mode === 'cute' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-100 border-slate-300') : 'hover:bg-slate-50'}`}
                      >
                         <div className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-400 rounded-full"></div>
                         <h4 className="text-xs font-bold uppercase text-emerald-500 mb-2 pl-3">Memory (mm)</h4>
                         <div className="bg-white p-2 rounded border space-y-1 pl-3">
                            <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
                               <Box size={12}/> mm_struct
                            </div>
                            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                               <div className="h-full bg-emerald-400 w-2/3"></div>
                            </div>
                            <div className="text-[9px] font-mono text-slate-400">Base: 0x1000</div>
                         </div>
                      </div>

                      <div 
                        onClick={() => setActiveSection('SCHED')}
                        className={`relative cursor-pointer p-2 -m-2 rounded-xl border-2 border-transparent transition-all ${activeSection === 'SCHED' ? (mode === 'cute' ? 'bg-orange-50 border-orange-200' : 'bg-slate-100 border-slate-300') : 'hover:bg-slate-50'}`}
                      >
                         <div className="absolute left-0 top-2 bottom-2 w-1 bg-orange-400 rounded-full"></div>
                         <h4 className="text-xs font-bold uppercase text-orange-500 mb-2 pl-3">Scheduling</h4>
                         <div className="bg-white p-2 rounded border space-y-1 pl-3">
                            <div className="flex justify-between text-[10px]">
                               <span className="text-slate-500">Prio</span>
                               <span className="font-bold">{activeProcess.prio}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                               <span className="text-slate-500">Slice</span>
                               <span className="font-bold">20ms</span>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* 4. Files */}
                   <div 
                     onClick={() => setActiveSection('FILES')}
                     className={`relative cursor-pointer p-2 -m-2 rounded-xl border-2 border-transparent transition-all ${activeSection === 'FILES' ? (mode === 'cute' ? 'bg-sky-50 border-sky-200' : 'bg-slate-100 border-slate-300') : 'hover:bg-slate-50'}`}
                   >
                      <div className="absolute left-0 top-2 bottom-2 w-1 bg-sky-400 rounded-full"></div>
                      <h4 className="text-xs font-bold uppercase text-sky-500 mb-2 pl-3">Files (FD Table)</h4>
                      <div className="flex flex-wrap gap-1 pl-2">
                         {activeProcess.files.map((f, i) => (
                           <div key={i} className="px-2 py-1 rounded border text-[10px] bg-white flex items-center gap-1 shadow-sm">
                              <span className="font-mono font-bold text-slate-400">{i}:</span>
                              <span>{f}</span>
                           </div>
                         ))}
                         <div className="px-2 py-1 rounded border border-dashed text-[10px] text-slate-400 bg-white opacity-60">...</div>
                      </div>
                   </div>
                
                </div>
             </div>
          </div>
       </div>

       {/* Right: Info Panel */}
       <div className={`w-full lg:w-72 shrink-0 flex flex-col transition-all duration-300 ${styles.card} overflow-hidden border-2 ${mode === 'cute' ? 'border-pink-200' : 'border-slate-200'}`}>
          <div className={`p-5 border-b ${mode === 'cute' ? 'bg-pink-50 border-pink-100' : 'bg-slate-50 border-slate-200'}`}>
             <h3 className={`font-bold text-lg ${styles.text.primary}`}>{info.title}</h3>
             <div className="text-xs font-mono opacity-60 mt-1">{info.subtitle}</div>
          </div>
          
          <div className="p-5 flex-1 overflow-y-auto">
             <div className="mb-6">
                <h4 className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-2">
                   <BookOpen size={14}/> 核心概念
                </h4>
                <p className={`text-sm leading-relaxed ${styles.text.primary} text-justify`}>
                   {info.desc}
                </p>
             </div>

             <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-2">
                   <ChevronRight size={14}/> 关键知识点
                </h4>
                <ul className="space-y-3">
                   {info.points.map((pt, i) => (
                     <li key={i} className={`text-xs p-3 rounded-xl border flex items-start gap-2 ${mode === 'cute' ? 'bg-white border-pink-100' : 'bg-slate-50 border-slate-100'}`}>
                        <div className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${mode === 'cute' ? 'bg-pink-400' : 'bg-blue-500'}`}></div>
                        <span className="text-slate-600 leading-snug">{pt}</span>
                     </li>
                   ))}
                </ul>
             </div>
          </div>
          
          {/* Footer Hint */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-[10px] text-center text-slate-400 italic">
             知识点基于 Linux 内核设计
          </div>
       </div>

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
    <div className="flex flex-col min-h-[700px] lg:h-full gap-6">
      <div className={`${styles.card} p-6 h-[500px] lg:flex-1 relative overflow-hidden flex flex-col items-center justify-center`}>
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
      <div className={`${styles.card} p-6 shrink-0`}>
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
  const [lotteryWinner, setLotteryWinner] = useState<number | null>(null);
  
  // Selection State
  const [selectedProcId, setSelectedProcId] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ slice: TimeSlice, rect: DOMRect } | null>(null);

  // Derived selected process
  const displayProcess = processes.find(p => p.id === selectedProcId) || null;

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
      arrivalTime: time, 
      burstTime: Math.floor(Math.random() * 6) + 2,
      remainingTime: Math.floor(Math.random() * 6) + 2,
      priority: Math.floor(Math.random() * 3),
      state: ProcessState.READY,
      color: generateColor(id),
      startTime: null,
      completionTime: null,
      tickets: Math.floor(Math.random() * 50) + 10 // Tickets 10-60
    };
    // Sync Burst Time with Remaining for consistent demo
    newProc.remainingTime = newProc.burstTime;

    setProcesses(prev => [...prev, newProc]);
    setReadyQueue(prev => [...prev, newProc]);
    
    // Auto select new process if none selected
    if (!selectedProcId) setSelectedProcId(id);
  };

  const reset = () => {
    setProcesses([]);
    setReadyQueue([]);
    setGanttChart([]);
    setTime(0);
    setIsRunning(false);
    setLotteryWinner(null);
    setTooltip(null);
    setSelectedProcId(null);
  };

  // Simulation Step (Simplified for brevity, same logic as before)
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
    const active = processes.filter(p => p.remainingTime > 0);
    if (active.length === 0) {
      setIsRunning(false);
      return;
    }

    const lastSlice = ganttChart[ganttChart.length - 1];
    const prevProcId = (lastSlice && lastSlice.endTime === time) ? lastSlice.processId : null;
    let sliceExpired = false;
    if (prevProcId !== null) {
        let duration = 0;
        for(let i = ganttChart.length - 1; i>=0; i--) {
             if(ganttChart[i].processId === prevProcId) duration += (ganttChart[i].endTime - ganttChart[i].startTime);
             else break;
        }
        if (duration > 0 && duration % timeSlice === 0) sliceExpired = true;
    }

    let currentProc: Process | null = null;
    let nextQueue = [...readyQueue];

    // ... Algorithm Logic (kept identical to previous) ...
    if (algorithm === AlgorithmType.FIFO) {
       currentProc = nextQueue[0] || null;
    } else if (algorithm === AlgorithmType.RR) {
       currentProc = nextQueue[0] || null;
    } else if (algorithm === AlgorithmType.SJF) {
       const prevProc = processes.find(p => p.id === prevProcId);
       if (prevProc && prevProc.remainingTime > 0) currentProc = prevProc;
       else currentProc = [...nextQueue].sort((a, b) => a.burstTime - b.burstTime)[0] || null;
    } else if (algorithm === AlgorithmType.SRTF) {
       currentProc = [...nextQueue].sort((a, b) => a.remainingTime - b.remainingTime)[0] || null;
    } else if (algorithm === AlgorithmType.MLFQ) {
       currentProc = [...nextQueue].sort((a, b) => a.priority - b.priority)[0] || null;
    } else if (algorithm === AlgorithmType.LOTTERY) {
       const prevProc = processes.find(p => p.id === prevProcId);
       if (prevProc && prevProc.remainingTime > 0 && !sliceExpired) currentProc = prevProc;
       else {
           const totalTickets = nextQueue.reduce((acc, p) => acc + p.tickets, 0);
           if (totalTickets > 0) {
              let r = Math.floor(Math.random() * totalTickets);
              for (const p of nextQueue) {
                  r -= p.tickets;
                  if (r < 0) { currentProc = p; setLotteryWinner(p.id); break; }
              }
           }
       }
    }

    if (currentProc) {
      const updatedProc = { 
          ...currentProc, 
          remainingTime: currentProc.remainingTime - 1,
          startTime: currentProc.startTime === null ? time : currentProc.startTime,
          state: ProcessState.RUNNING
      };
      
      setGanttChart(prev => {
        const last = prev[prev.length - 1];
        if (last && last.processId === currentProc!.id) {
          return [...prev.slice(0, -1), { ...last, endTime: time + 1 }];
        }
        return [...prev, { 
            processId: currentProc!.id, 
            startTime: time, 
            endTime: time + 1, 
            color: currentProc!.color,
            priority: currentProc!.priority, 
            tickets: currentProc!.tickets    
        }];
      });

      setProcesses(prev => prev.map(p => p.id === currentProc!.id ? updatedProc : (p.state === ProcessState.RUNNING ? {...p, state: ProcessState.READY} : p)));

      if (updatedProc.remainingTime === 0) {
         setProcesses(prev => prev.map(p => p.id === currentProc!.id ? { ...p, remainingTime: 0, completionTime: time + 1, state: ProcessState.TERMINATED } : p));
         nextQueue = nextQueue.filter(p => p.id !== currentProc!.id);
      } else {
         if (algorithm === AlgorithmType.RR) {
            let duration = 1; 
            for(let i = ganttChart.length - 1; i>=0; i--) {
                if(ganttChart[i].processId === currentProc!.id) duration += (ganttChart[i].endTime - ganttChart[i].startTime);
                else break;
            }
            if (duration % timeSlice === 0) {
               nextQueue = nextQueue.filter(p => p.id !== currentProc!.id);
               nextQueue.push({...updatedProc, state: ProcessState.READY});
            } else {
               nextQueue = nextQueue.map(p => p.id === updatedProc.id ? updatedProc : p);
            }
         } else if (algorithm === AlgorithmType.LOTTERY) {
             nextQueue = nextQueue.map(p => p.id === updatedProc.id ? updatedProc : p);
         } else {
             nextQueue = nextQueue.map(p => p.id === updatedProc.id ? updatedProc : p);
         }
      }
      setReadyQueue(nextQueue);
    } else {
      setGanttChart(prev => {
        const last = prev[prev.length - 1];
        if (last && last.processId === null) return [...prev.slice(0, -1), { ...last, endTime: time + 1 }];
        return [...prev, { processId: null, startTime: time, endTime: time + 1, color: 'bg-slate-200' }];
      });
      setLotteryWinner(null);
    }
    setTime(t => t + 1);
  };

  // Stats
  const finishedProcesses = processes.filter(p => p.remainingTime === 0 && p.completionTime !== null);
  const avgTurnaround = finishedProcesses.length > 0 
    ? (finishedProcesses.reduce((acc, p) => acc + ((p.completionTime!) - p.arrivalTime), 0) / finishedProcesses.length).toFixed(1)
    : '--';
  const avgWaiting = finishedProcesses.length > 0
    ? (finishedProcesses.reduce((acc, p) => acc + (((p.completionTime!) - p.arrivalTime) - p.burstTime), 0) / finishedProcesses.length).toFixed(1)
    : '--';

  return (
    <div className="flex flex-col gap-6">
       {/* Toolbar */}
       <div className={`${styles.card} p-4 flex flex-wrap items-center justify-between gap-4 shrink-0`}>
          <div className="flex items-center gap-4">
             <div className="flex flex-col">
               <label className="text-[10px] uppercase font-bold text-slate-400">调度算法 (Algorithm)</label>
               <select 
                  value={algorithm} 
                  onChange={(e) => { setAlgorithm(e.target.value as AlgorithmType); reset(); }}
                  className={`font-bold outline-none bg-transparent ${styles.text.primary} cursor-pointer`}
               >
                 <option value={AlgorithmType.FIFO}>先来先服务 (FIFO)</option>
                 <option value={AlgorithmType.RR}>时间片轮转 (RR)</option>
                 <option value={AlgorithmType.SJF}>最短任务优先 (SJF)</option>
                 <option value={AlgorithmType.SRTF}>最短完成时间 (SRTF)</option>
                 <option value={AlgorithmType.LOTTERY}>彩票/比例调度 (Lottery)</option>
                 <option value={AlgorithmType.MLFQ}>多级反馈队列 (MLFQ)</option>
               </select>
             </div>
             {(algorithm === AlgorithmType.RR || algorithm === AlgorithmType.LOTTERY) && (
               <div className="flex flex-col w-24">
                 <label className="text-[10px] uppercase font-bold text-slate-400">
                   {algorithm === AlgorithmType.LOTTERY ? '时间片 (Slice)' : '时间片 (Quantum)'}
                 </label>
                 <input 
                   type="number" min="1" max="10" value={timeSlice}
                   onChange={(e) => setTimeSlice(Number(e.target.value))}
                   className={`bg-transparent font-bold w-full outline-none ${styles.text.primary}`} 
                 />
               </div>
             )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsRunning(!isRunning)} className={styles.button.primary + " px-4 py-2 flex items-center gap-2"}>
               {isRunning ? <Pause size={16}/> : <Play size={16}/>} {isRunning ? "暂停" : "开始"}
            </button>
            <button onClick={reset} className={styles.button.icon + " p-2"}><RotateCcw size={16}/></button>
            <div className="w-px h-6 bg-slate-200 mx-2"></div>
            <button onClick={addProcess} className={`${styles.button.secondary} px-4 py-2 flex items-center gap-2 border-dashed border-2`}><Plus size={16}/> 添加进程</button>
          </div>
       </div>

       {/* Algorithm Info */}
       <div className={`px-4 py-3 rounded-xl border text-xs flex gap-2 items-start shrink-0 ${mode === 'cute' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
          <Info size={16} className="shrink-0 mt-0.5"/>
          <p>{ALGO_DESCRIPTIONS[algorithm]}</p>
       </div>

       {/* Main Content Layout - Responsive & Scrollable */}
       <div className="flex flex-col lg:flex-row gap-6">
          
          {/* LEFT: Queue - Stack on Mobile, Side on Large */}
          <div className="w-full lg:w-72 flex flex-col gap-6 shrink-0">
             
             {/* Queue - Fixed Height */}
             <div className={`${styles.card} p-4 flex flex-col h-72`}>
                <h4 className={`font-bold mb-3 flex items-center gap-2 text-sm ${styles.text.primary}`}>
                   <ListOrdered size={16}/> 就绪队列
                </h4>
                <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                   {readyQueue.map(p => (
                     <div 
                        key={p.id} 
                        onClick={() => setSelectedProcId(p.id)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                            selectedProcId === p.id 
                                ? (mode === 'cute' ? 'bg-pink-50 border-pink-200 ring-1 ring-pink-200' : 'bg-blue-50 border-blue-200 ring-1 ring-blue-200') 
                                : 'bg-white hover:bg-slate-50 border-slate-100'
                        }`}
                     >
                        <div className="flex items-center gap-2 min-w-0">
                           <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${p.color}`}></div>
                           <div className="font-bold text-xs truncate">{p.name}</div>
                           {lotteryWinner === p.id && algorithm === AlgorithmType.LOTTERY && <Ticket size={12} className="text-yellow-500 animate-bounce"/>}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                           {p.remainingTime}s
                        </div>
                     </div>
                   ))}
                   {readyQueue.length === 0 && <div className="text-center py-4 text-slate-400 text-xs italic">队列为空</div>}
                </div>
             </div>
          </div>

          {/* RIGHT: Gantt & Stats - Flexible but with Min Height */}
          <div className="flex-1 flex flex-col gap-6 min-w-0">
             <div className={`${styles.card} p-6 flex flex-col min-h-[500px]`}>
                 <h4 className={`font-bold mb-4 flex items-center gap-2 ${styles.text.primary}`}>
                    <Activity size={16}/> CPU 调度图 (Gantt Chart)
                    <span className="text-xs font-normal bg-slate-100 px-2 py-1 rounded ml-2 font-mono">Time: {time}s</span>
                 </h4>
                 
                 <div className="relative h-24 w-full bg-slate-50 rounded-xl overflow-x-auto flex border border-slate-200 items-stretch" onMouseLeave={() => setTooltip(null)}>
                    {ganttChart.map((slice, i) => {
                       const duration = slice.endTime - slice.startTime;
                       return (
                         <div 
                            key={i} 
                            style={{ flex: duration }}
                            className={`${slice.processId !== null ? slice.color : 'bg-slate-100'} border-r border-white/20 relative group min-w-[20px] transition-all flex items-center justify-center hover:opacity-90 cursor-pointer shrink-0`}
                            onMouseEnter={(e) => setTooltip({ slice, rect: e.currentTarget.getBoundingClientRect() })}
                            onClick={() => slice.processId !== null && setSelectedProcId(slice.processId)}
                         >
                            {slice.processId !== null && <div className="text-[10px] font-bold text-white pointer-events-none truncate px-1">P{slice.processId}</div>}
                         </div>
                       );
                    })}
                 </div>
                 
                 {/* Tooltip */}
                 {tooltip && tooltip.slice.processId !== null && (
                    <div className="fixed z-50 pointer-events-none" style={{ top: tooltip.rect.top - 10, left: tooltip.rect.left + tooltip.rect.width / 2, transform: 'translate(-50%, -100%)' }}>
                        <div className="bg-slate-800 text-white text-[10px] p-2 rounded shadow-xl whitespace-nowrap">
                            <div className="font-bold border-b border-slate-600 pb-1 mb-1">Process P{tooltip.slice.processId}</div>
                            <div>Start: {tooltip.slice.startTime}s | End: {tooltip.slice.endTime}s</div>
                            {tooltip.slice.priority !== undefined && <div>Priority: Q{tooltip.slice.priority}</div>}
                            {tooltip.slice.tickets !== undefined && <div>Tickets: {tooltip.slice.tickets}</div>}
                        </div>
                        <div className="w-2 h-2 bg-slate-800 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                    </div>
                 )}

                 {/* Stats */}
                 <div className="mt-auto pt-6 grid grid-cols-2 gap-4">
                     <div className={`p-4 rounded-xl ${mode === 'cute' ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-700'}`}>
                        <div className="text-[10px] uppercase font-bold opacity-60">Avg Turnaround</div>
                        <div className="text-2xl font-mono font-bold">{avgTurnaround}s</div>
                     </div>
                     <div className={`p-4 rounded-xl ${mode === 'cute' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                        <div className="text-[10px] uppercase font-bold opacity-60">Avg Waiting</div>
                        <div className="text-2xl font-mono font-bold">{avgWaiting}s</div>
                     </div>
                 </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export const ProcessView: React.FC = () => {
  const { styles, mode } = useTheme();
  const [tab, setTab] = useState<'lifecycle' | 'scheduler' | 'pcb' | 'creation'>('creation');

  return (
    <div className={`flex flex-col h-full p-6 gap-6 overflow-y-auto ${styles.bg}`}>
       <div className="flex justify-center shrink-0">
         <div className={`p-1 rounded-xl flex gap-1 border ${mode === 'cute' ? 'bg-white border-pink-100' : 'bg-slate-200 border-slate-300'}`}>
           <button 
             onClick={() => setTab('creation')}
             className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
               tab === 'creation' 
                 ? (mode === 'cute' ? 'bg-pink-400 text-white shadow' : 'bg-white text-slate-800 shadow') 
                 : 'text-slate-400 hover:text-slate-600'
             }`}
           >
             <Zap size={16} className="inline mr-2"/> 创建过程
           </button>
           <button 
             onClick={() => setTab('lifecycle')}
             className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
               tab === 'lifecycle' 
                 ? (mode === 'cute' ? 'bg-pink-400 text-white shadow' : 'bg-white text-slate-800 shadow') 
                 : 'text-slate-400 hover:text-slate-600'
             }`}
           >
             <GitCommit size={16} className="inline mr-2"/> 状态模型
           </button>
           <button 
             onClick={() => setTab('scheduler')}
             className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
               tab === 'scheduler' 
                 ? (mode === 'cute' ? 'bg-pink-400 text-white shadow' : 'bg-white text-slate-800 shadow') 
                 : 'text-slate-400 hover:text-slate-600'
             }`}
           >
             <LayoutTemplate size={16} className="inline mr-2"/> 调度算法
           </button>
           <button 
             onClick={() => setTab('pcb')}
             className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
               tab === 'pcb' 
                 ? (mode === 'cute' ? 'bg-pink-400 text-white shadow' : 'bg-white text-slate-800 shadow') 
                 : 'text-slate-400 hover:text-slate-600'
             }`}
           >
             <ScanFace size={16} className="inline mr-2"/> PCB 结构
           </button>
         </div>
       </div>

       {tab === 'lifecycle' ? <LifecycleView /> : tab === 'scheduler' ? <SchedulerView /> : tab === 'pcb' ? <PCBStructureView /> : <ProgramToProcessView />}
    </div>
  );
};
