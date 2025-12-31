
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { 
  HardDrive, FileText, Database, Info, Share2, Link as LinkIcon, 
  Layers, FileCode, Activity, AlertTriangle, RefreshCcw, ArrowRight,
  CheckCircle, RotateCcw, Shield, Box, LayoutGrid, Cpu, Zap, Radio, FastForward
} from 'lucide-react';

// --- Sub-component: Device I/O Interaction (New) ---
const DeviceIOView = () => {
  const { styles, mode } = useTheme();
  const [method, setMethod] = useState<'polling' | 'interrupt' | 'dma'>('polling');
  const [progress, setProgress] = useState(0);
  const [cpuTask, setCpuTask] = useState<string>("空闲 (Idle)");
  const [cpuStatus, setCpuStatus] = useState<'idle' | 'busy' | 'interrupt' | 'user'>('idle');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const intervalRef = useRef<any>(null);

  const reset = () => {
    setIsRunning(false);
    setProgress(0);
    setCpuStatus('idle');
    setCpuTask("空闲 (Idle)");
    setLogs([]);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 4));

  const startSimulation = () => {
    reset();
    setIsRunning(true);
    let p = 0;
    
    addLog(`开始 ${method === 'polling' ? '轮询' : method === 'interrupt' ? '中断驱动' : 'DMA'} 读取任务...`);

    if (method === 'polling') {
      // 轮询模式：CPU 一直在检查
      setCpuStatus('busy');
      setCpuTask("while(!ready) check();"); // Busy wait
      
      intervalRef.current = setInterval(() => {
        p += 5;
        // 模拟 CPU 必须参与数据搬运
        if (p % 20 === 0) {
           addLog("CPU: 设备就绪，读取一个字...");
        } else {
           // Visualizing busy wait check
        }
        
        if (p >= 100) {
          p = 100;
          setIsRunning(false);
          setCpuStatus('idle');
          setCpuTask("任务完成");
          addLog("传输完成！");
          clearInterval(intervalRef.current);
        }
        setProgress(p);
      }, 200);

    } else if (method === 'interrupt') {
      // 中断模式：CPU 发指令 -> 干别的 -> 中断 -> 搬运 -> 干别的
      setCpuStatus('busy'); // Kernel mode init
      setCpuTask("启动设备 I/O...");
      addLog("CPU: 发送读取指令");

      setTimeout(() => {
        // 切换到用户态
        setCpuStatus('user');
        setCpuTask("执行用户进程 A (计算中...)");
        addLog("CPU: 切换到其他进程");
        
        intervalRef.current = setInterval(() => {
          p += 10; // 设备准备数据的速度
          
          // 模拟设备每准备好一部分数据就发中断
          if (p % 25 === 0 && p < 100) {
             setCpuStatus('interrupt'); // Flash interrupt
             const prevTask = "执行用户进程 A (计算中...)";
             setCpuTask("ISR: 搬运数据到内存...");
             addLog("⚠️ 中断! CPU 暂停进程，搬运数据");
             
             // 短暂延迟模拟 ISR 开销
             setTimeout(() => {
                setCpuStatus('user');
                setCpuTask(prevTask);
             }, 400);
          }

          if (p >= 100) {
            p = 100;
            setIsRunning(false);
            setCpuStatus('idle');
            setCpuTask("任务完成");
            addLog("✅ 最终中断：传输结束");
            clearInterval(intervalRef.current);
          }
          setProgress(p);
        }, 300);
      }, 500);

    } else if (method === 'dma') {
      // DMA 模式：CPU 发指令 -> 干别的 -> (DMA搬运) -> 结束中断
      setCpuStatus('busy');
      setCpuTask("配置 DMA 控制器...");
      addLog("CPU: 设置 DMA 源/目的地址/长度");

      setTimeout(() => {
        setCpuStatus('user');
        setCpuTask("执行用户进程 A (计算中...)");
        addLog("CPU: 彻底释放，DMA 接管总线");

        intervalRef.current = setInterval(() => {
          p += 5; // DMA 搬运速度
          // CPU 状态保持 User，完全不被打扰
          
          if (p >= 100) {
            p = 100;
            setIsRunning(false);
            setCpuStatus('interrupt');
            setCpuTask("ISR: 处理 DMA 结束中断");
            addLog("⚠️ 中断! DMA 报告任务完成");
            setTimeout(() => {
               setCpuStatus('idle');
               setCpuTask("任务完成");
            }, 800);
            clearInterval(intervalRef.current);
          }
          setProgress(p);
        }, 100);
      }, 800);
    }
  };

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <div className="flex flex-col gap-6 h-full">
       <div className={`${styles.card} p-4 flex flex-col md:flex-row gap-6 shrink-0 items-center justify-between`}>
          <div>
             <h3 className={`font-bold text-lg ${styles.text.primary}`}>操作系统与设备交互 (I/O Control)</h3>
             <p className={`text-xs ${styles.text.secondary}`}>演示 CPU 如何控制慢速外设进行数据传输</p>
          </div>
          <div className={`flex p-1 rounded-xl border ${mode === 'cute' ? 'bg-white border-pink-100' : 'bg-slate-200 border-slate-300'}`}>
             <button onClick={() => { setMethod('polling'); reset(); }} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${method === 'polling' ? (mode === 'cute' ? 'bg-pink-400 text-white' : 'bg-slate-800 text-white') : 'text-slate-500'}`}>
               1. 轮询 (Polling)
             </button>
             <button onClick={() => { setMethod('interrupt'); reset(); }} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${method === 'interrupt' ? (mode === 'cute' ? 'bg-pink-400 text-white' : 'bg-slate-800 text-white') : 'text-slate-500'}`}>
               2. 中断 (Interrupt)
             </button>
             <button onClick={() => { setMethod('dma'); reset(); }} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${method === 'dma' ? (mode === 'cute' ? 'bg-pink-400 text-white' : 'bg-slate-800 text-white') : 'text-slate-500'}`}>
               3. DMA (Direct Memory Access)
             </button>
          </div>
       </div>

       <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-[400px]">
          
          {/* LEFT: Simulation Stage */}
          <div className={`${styles.card} flex-1 p-8 relative flex flex-col justify-between overflow-hidden bg-slate-50/50`}>
             
             {/* CPU Block */}
             <div className="flex justify-center mb-12 relative z-10">
                <div className={`w-48 p-4 rounded-2xl border-4 transition-all duration-300 flex flex-col items-center gap-2 shadow-lg ${
                   cpuStatus === 'busy' ? 'bg-orange-100 border-orange-400' :
                   cpuStatus === 'user' ? 'bg-green-100 border-green-400' :
                   cpuStatus === 'interrupt' ? 'bg-red-100 border-red-500 animate-bounce' :
                   'bg-slate-100 border-slate-300'
                }`}>
                   <Cpu size={32} className={cpuStatus === 'interrupt' ? 'text-red-500' : 'text-slate-600'}/>
                   <div className="text-center">
                      <div className="text-xs font-bold uppercase text-slate-500">CPU</div>
                      <div className="text-xs font-bold truncate max-w-[150px]">{cpuTask}</div>
                   </div>
                   {cpuStatus === 'interrupt' && <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] px-2 py-1 rounded-full animate-pulse shadow-sm flex items-center gap-1"><Zap size={10}/> INTERRUPT</div>}
                </div>
             </div>

             {/* Memory & Device Blocks */}
             <div className="flex justify-between items-end relative z-10">
                {/* Device */}
                <div className={`w-40 h-32 rounded-2xl border-4 flex flex-col items-center justify-center relative transition-all ${isRunning ? 'border-blue-400 bg-blue-50 shadow-blue-200 shadow-xl' : 'border-slate-300 bg-slate-100'}`}>
                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 text-[10px] font-bold uppercase text-slate-400 border rounded shadow-sm">Disk Controller</div>
                   <HardDrive size={32} className={isRunning ? 'text-blue-500 animate-pulse' : 'text-slate-400'}/>
                   <div className="mt-2 w-24 h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                      <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                   </div>
                   <div className="text-[10px] font-mono mt-1">{progress}% Ready</div>
                </div>

                {/* DMA Controller (Only visible in DMA mode) */}
                {method === 'dma' && (
                   <div className="absolute left-1/2 bottom-8 -translate-x-1/2 flex flex-col items-center animate-in zoom-in">
                      <div className={`w-24 h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 ${isRunning ? 'bg-purple-100 border-purple-400 text-purple-700' : 'bg-slate-50 border-slate-300 text-slate-400'}`}>
                         <FastForward size={24}/>
                         <div className="text-[9px] font-bold">DMA 芯片</div>
                      </div>
                      {isRunning && progress < 100 && (
                         <div className="mt-2 flex gap-1">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping"></div>
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping delay-75"></div>
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping delay-150"></div>
                         </div>
                      )}
                   </div>
                )}

                {/* RAM */}
                <div className="w-40 h-48 rounded-2xl border-4 border-emerald-200 bg-emerald-50 flex flex-col relative shadow-sm">
                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 text-[10px] font-bold uppercase text-slate-400 border rounded shadow-sm">Main Memory</div>
                   <div className="flex-1 p-2 flex flex-col-reverse gap-0.5 overflow-hidden">
                      {Array.from({ length: Math.floor(progress / 10) }).map((_, i) => (
                         <div key={i} className="h-3 w-full bg-emerald-400 rounded-sm animate-in slide-in-from-bottom-2 fade-in"></div>
                      ))}
                   </div>
                   <div className="p-2 text-center text-xs font-bold text-emerald-700 border-t border-emerald-200 bg-emerald-100 rounded-b-xl">
                      Buffer
                   </div>
                </div>
             </div>

             {/* Bus Lines (SVG Overlay) */}
             <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{zIndex: 0}}>
                {/* CPU to Disk/DMA */}
                <path d="M 50% 120 L 50% 50% L 20% 50% L 20% 70%" fill="none" stroke="#cbd5e1" strokeWidth="2" />
                <path d="M 50% 50% L 80% 50% L 80% 65%" fill="none" stroke="#cbd5e1" strokeWidth="2" />
                
                {/* Data Flow Animation */}
                {isRunning && (
                   <>
                     {method === 'polling' && (
                        // Disk -> CPU -> RAM
                        <>
                          <circle r="4" fill="#3b82f6">
                             <animateMotion dur="1s" repeatCount="indefinite" path="M 20% 70% L 20% 50% L 50% 50% L 50% 120" />
                          </circle>
                          <circle r="4" fill="#10b981">
                             <animateMotion dur="1s" repeatCount="indefinite" begin="0.5s" path="M 50% 120 L 50% 50% L 80% 50% L 80% 65%" />
                          </circle>
                        </>
                     )}
                     {method === 'interrupt' && cpuStatus === 'interrupt' && (
                        // Only moves during interrupt handling
                        <>
                          <circle r="4" fill="#ef4444">
                             <animateMotion dur="0.3s" repeatCount="indefinite" path="M 20% 70% L 20% 50% L 50% 50% L 50% 120" />
                          </circle>
                          <circle r="4" fill="#ef4444">
                             <animateMotion dur="0.3s" repeatCount="indefinite" begin="0.15s" path="M 50% 120 L 50% 50% L 80% 50% L 80% 65%" />
                          </circle>
                        </>
                     )}
                     {method === 'dma' && (
                        // Disk -> DMA -> RAM (Direct)
                        <circle r="4" fill="#a855f7">
                           <animateMotion dur="0.5s" repeatCount="indefinite" path="M 25% 80% Q 50% 90% 75% 80%" />
                        </circle>
                     )}
                   </>
                )}
             </svg>

          </div>

          {/* RIGHT: Controls & Explain */}
          <div className="w-full lg:w-72 flex flex-col gap-6">
             <div className={`${styles.card} p-5 flex flex-col`}>
                <div className="flex justify-center mb-4">
                   <button 
                     onClick={startSimulation} 
                     disabled={isRunning}
                     className={`${styles.button.primary} w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm shadow-lg`}
                   >
                     {isRunning ? <RefreshCcw size={16} className="animate-spin"/> : <ArrowRight size={16}/>}
                     {isRunning ? '传输中...' : '开始传输'}
                   </button>
                </div>
                
                <div className="bg-slate-900 rounded-xl p-3 h-48 overflow-y-auto font-mono text-[10px] text-green-400 space-y-1">
                   {logs.map((l, i) => <div key={i}>{'>'} {l}</div>)}
                   {logs.length === 0 && <div className="text-slate-600 italic text-center mt-10">系统日志...</div>}
                </div>
             </div>

             <div className={`p-4 rounded-xl border text-xs leading-relaxed ${mode === 'cute' ? 'bg-white border-pink-100 text-slate-600' : 'bg-white border-slate-200 text-slate-600'}`}>
                <h4 className="font-bold mb-2 flex items-center gap-2 text-indigo-600"><Info size={14}/> 核心差异</h4>
                {method === 'polling' && <p><strong>轮询：</strong>CPU 像个保姆一样不断询问“好了没？”，在数据准备期间，CPU 无法做其他事情，资源利用率极低。</p>}
                {method === 'interrupt' && <p><strong>中断：</strong>CPU 发出指令后就去做别的（如运行用户进程）。设备准备好一部分数据后发“中断”，CPU 暂停当前工作来搬运数据。比轮询好，但大量数据时中断频繁，CPU 仍需参与搬运。</p>}
                {method === 'dma' && <p><strong>DMA：</strong>CPU 只需告诉 DMA 控制器“搬什么、搬多少、搬哪去”，然后彻底甩手。DMA 芯片负责在设备和内存间传输。CPU 仅在开始和结束时参与，效率最高！</p>}
             </div>
          </div>

       </div>
    </div>
  );
};

// --- Sub-component: Hard Link vs Soft Link ---
const LinksVisual = () => {
  const { styles, mode } = useTheme();
  const [selected, setSelected] = useState<'hard' | 'soft' | null>(null);
  const [isDeleted, setIsDeleted] = useState(false);

  const reset = () => {
    setIsDeleted(false);
    setSelected(null);
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className={`${styles.card} p-10 flex flex-col items-center justify-center relative overflow-hidden min-h-[400px]`}>
        <div className={`flex gap-12 items-start relative z-10 transition-opacity duration-500 ${isDeleted ? 'opacity-40' : 'opacity-100'}`}>
          {/* Original File */}
          <div className="flex flex-col gap-4 items-center">
            <h4 className="text-[10px] font-bold uppercase text-slate-400">原始文件 (Target)</h4>
            <div className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-2 ${mode === 'cute' ? 'bg-white border-pink-200' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
              <FileText size={32} className="text-blue-500"/>
              <span className="font-bold text-sm">original.txt</span>
              <div className="bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded font-mono">Inode: 42</div>
            </div>
          </div>

          {/* Connections */}
          <div className="flex flex-col justify-center gap-16 pt-12">
            <div className="flex items-center">
               <div className="h-0.5 w-20 bg-blue-300 relative">
                 <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full"></div>
               </div>
            </div>
            {selected && (
              <div className="flex items-center animate-in fade-in slide-in-from-left-4 duration-500">
                <div className={`h-0.5 w-20 relative ${selected === 'hard' ? 'bg-blue-400' : 'bg-rose-300 border-dashed border-t-2 bg-transparent'}`}>
                  <div className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-2 rounded-full ${selected === 'hard' ? 'bg-blue-400' : 'bg-rose-400'}`}></div>
                </div>
              </div>
            )}
          </div>

          {/* Inode / Path */}
          <div className="flex flex-col gap-12 items-center">
            <div className={`p-6 rounded-[2.5rem] border-4 flex flex-col items-center gap-2 transition-all shadow-xl ${mode === 'cute' ? 'bg-indigo-50 border-indigo-200' : 'bg-blue-50 border-blue-200'}`}>
               <Layers size={40} className="text-indigo-600"/>
               <div className="text-center">
                  <div className="text-xs font-bold text-indigo-800">Inode #42</div>
                  <div className="text-[10px] text-indigo-400">Data @ Block 0xFA3</div>
                  <div className="text-[10px] font-bold mt-2 bg-indigo-200 text-indigo-700 px-3 py-1 rounded-full">
                    引用计数: {isDeleted ? (selected === 'hard' ? '1' : '0') : (selected === 'hard' ? '2' : '1')}
                  </div>
               </div>
            </div>
          </div>

          {/* Link Item */}
          {selected && (
            <div className="flex flex-col gap-4 items-center animate-in slide-in-from-right-8 duration-500">
              <h4 className="text-[10px] font-bold uppercase text-slate-400">{selected === 'hard' ? '硬链接' : '软链接'}</h4>
              <div className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-2 ${selected === 'hard' ? 'bg-blue-50 border-blue-200' : 'bg-rose-50 border-rose-200'}`}>
                <LinkIcon size={32} className={selected === 'hard' ? 'text-blue-500' : 'text-rose-500'}/>
                <span className="font-bold text-sm">{selected === 'hard' ? 'hlink.txt' : 'slink.txt'}</span>
                <div className={`text-[10px] px-2 py-0.5 rounded font-mono ${selected === 'hard' ? 'bg-slate-800 text-white' : 'bg-rose-500 text-white'}`}>
                  {selected === 'hard' ? 'Inode: 42' : 'Inode: 99'}
                </div>
              </div>
              {selected === 'soft' && (
                <div className="text-[10px] text-rose-500 italic mt-1 bg-rose-100/50 px-2 py-1 rounded">指向路径: "/original.txt"</div>
              )}
            </div>
          )}
        </div>

        {isDeleted && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] z-20 animate-in fade-in duration-700">
             <div className="text-center p-8 bg-white shadow-2xl rounded-3xl border-2 border-slate-100 flex flex-col items-center gap-3">
                <AlertTriangle size={48} className="text-orange-500 mb-2"/>
                <h3 className="text-xl font-bold">原始目录项已删除</h3>
                <p className="text-sm text-slate-500 max-w-xs">
                  {selected === 'hard' 
                    ? "由于 Inode 引用计数仍为 1，数据依然保留，硬链接有效。" 
                    : "软链接指向的路径已不存在，该链接变为‘死链接’。"}
                </p>
                <button onClick={reset} className={styles.button.primary + " mt-4 px-8 py-2"}>重置模拟</button>
             </div>
          </div>
        )}

        {!isDeleted && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
             <button onClick={() => setSelected('hard')} className={`${styles.button.secondary} px-6 py-2 border-blue-200 text-blue-600`}>创建硬链接</button>
             <button onClick={() => setSelected('soft')} className={`${styles.button.secondary} px-6 py-2 border-rose-200 text-rose-500`}>创建软链接</button>
             <button onClick={() => setIsDeleted(true)} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg transition-all ml-4">删除原文件</button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Sub-component: File Descriptor Essence ---
const DescriptorEssence = () => {
  const { styles, mode } = useTheme();
  const [activeFd, setActiveFd] = useState<number | null>(null);

  const fdList = [
    { fd: 0, type: 'stdin', inode: 10 },
    { fd: 1, type: 'stdout', inode: 11 },
    { fd: 2, type: 'stderr', inode: 11 },
    { fd: 3, type: 'config.json', inode: 405 },
  ];

  return (
    <div className="flex flex-col gap-6 h-full">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1">
          {/* 1. Per-Process FD Table */}
          <div className={`${styles.card} p-5 flex flex-col`}>
             <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h4 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2">
                  <Activity size={14}/> 进程 FD 表 (PCB)
                </h4>
                <span className="text-[10px] bg-slate-100 px-2 rounded font-mono">PID: 1234</span>
             </div>
             <div className="space-y-2">
               {fdList.map(item => (
                 <div 
                   key={item.fd} 
                   onMouseEnter={() => setActiveFd(item.fd)}
                   className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center group ${activeFd === item.fd ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-slate-50 opacity-60 hover:opacity-100'}`}
                 >
                   <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs ${activeFd === item.fd ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {item.fd}
                      </div>
                      <span className="text-sm font-bold">{item.type}</span>
                   </div>
                   {activeFd === item.fd && <ArrowRight size={14} className="text-blue-500 animate-pulse"/>}
                 </div>
               ))}
             </div>
          </div>

          {/* 2. System Open File Table */}
          <div className={`${styles.card} p-5 flex flex-col justify-center items-center relative overflow-hidden`}>
             <h4 className="absolute top-4 left-4 text-xs font-bold uppercase text-slate-400 flex items-center gap-2">
               <Share2 size={14}/> 全局打开文件表
             </h4>
             {activeFd !== null ? (
               <div className="w-full space-y-4 animate-in fade-in zoom-in duration-300">
                 <div className="p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl shadow-xl border-2 border-white/20">
                    <div className="text-[10px] uppercase font-bold opacity-70 mb-3 border-b border-white/20 pb-2">File Table Entry</div>
                    <div className="grid grid-cols-2 gap-y-3 text-xs font-mono">
                      <div><span className="opacity-60 block text-[9px]">OFFSET</span> 1024</div>
                      <div><span className="opacity-60 block text-[9px]">MODE</span> RW</div>
                      <div><span className="opacity-60 block text-[9px]">REF COUNT</span> {activeFd === 1 || activeFd === 2 ? '2' : '1'}</div>
                      <div><span className="opacity-60 block text-[9px]">FLAGS</span> O_SYNC</div>
                    </div>
                 </div>
                 <div className="flex justify-center">
                    <ArrowRight className="text-blue-300 rotate-90" />
                 </div>
               </div>
             ) : (
               <div className="text-slate-300 text-sm flex flex-col items-center gap-2">
                  <Box size={32} className="opacity-20"/>
                  请选择一个进程 FD
               </div>
             )}
          </div>

          {/* 3. Inode Table */}
          <div className={`${styles.card} p-5 flex flex-col justify-center items-center`}>
             <h4 className="absolute top-4 left-4 text-xs font-bold uppercase text-slate-400 flex items-center gap-2">
               <Layers size={14}/> 系统 Inode 表
             </h4>
             {activeFd !== null ? (
                <div className="p-6 border-4 border-indigo-200 bg-indigo-50 rounded-[3rem] shadow-lg animate-in slide-in-from-right-8 duration-500 text-center">
                   <Layers size={48} className="text-indigo-600 mb-3 mx-auto"/>
                   <div className="font-bold text-indigo-800">Inode #{fdList[activeFd].inode}</div>
                   <div className="text-[10px] text-indigo-400 mt-2 font-mono uppercase">指向物理磁盘块</div>
                   <div className="mt-4 flex gap-1 justify-center">
                      {[1, 2, 3].map(i => <div key={i} className="w-4 h-4 rounded-sm bg-indigo-200"></div>)}
                   </div>
                </div>
             ) : null}
          </div>
       </div>
       <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${mode === 'cute' ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
          <p><strong>内核知识点：</strong>文件描述符其实就是数组下标。当进程调用 <code>open()</code> 时，内核在 <strong>FD 表</strong> 中找一个空位，填入指向 <strong>系统级打开文件表项</strong> 的指针。多个 FD 可以指向同一个打开文件项（如 <code>dup()</code>），多个打开文件项可以指向同一个 <strong>Inode</strong>。</p>
       </div>
    </div>
  );
};

// --- Sub-component: RAID Visualizer ---
const RAIDVisualizer = () => {
  const { styles, mode } = useTheme();
  const [raidType, setRaidType] = useState<0 | 1 | 5>(0);

  return (
    <div className="flex flex-col gap-6 h-full">
       <div className={`${styles.card} p-3 flex justify-center gap-2`}>
          {[0, 1, 5].map(t => (
            <button 
              key={t} 
              onClick={() => setRaidType(t as any)}
              className={`px-8 py-2 rounded-xl font-bold transition-all ${raidType === t ? (mode === 'cute' ? 'bg-pink-400 text-white shadow-lg' : 'bg-slate-800 text-white shadow-md') : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              RAID {t}
            </button>
          ))}
       </div>

       <div className="grid grid-cols-3 gap-8 flex-1">
          {[1, 2, 3].map(disk => (
             <div key={disk} className={`${styles.card} p-6 flex flex-col items-center gap-6 relative overflow-hidden group hover:border-blue-300 transition-colors`}>
                <div className="absolute top-2 right-4 text-[10px] font-bold text-slate-300 font-mono">PHYSICAL DISK {disk}</div>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-inner ${mode === 'cute' ? 'bg-pink-50 text-pink-400' : 'bg-slate-100 text-slate-400'}`}>
                  <HardDrive size={32}/>
                </div>
                
                <div className="w-full space-y-2">
                   {raidType === 0 && (
                     <>
                        <div className={`p-3 rounded-xl text-center font-bold text-xs shadow-sm ${disk === 1 ? 'bg-blue-500 text-white' : disk === 2 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300 opacity-20'}`}>
                          {disk === 1 ? 'Data Block A' : disk === 2 ? 'Data Block B' : '未使用'}
                        </div>
                        <div className={`p-3 rounded-xl text-center font-bold text-xs shadow-sm ${disk === 1 ? 'bg-blue-500 text-white' : disk === 2 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300 opacity-20'}`}>
                          {disk === 1 ? 'Data Block C' : disk === 2 ? 'Data Block D' : '未使用'}
                        </div>
                     </>
                   )}
                   {raidType === 1 && (
                     <>
                        <div className={`p-3 rounded-xl text-center font-bold text-xs shadow-sm ${disk < 3 ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-300 opacity-20'}`}>
                          {disk < 3 ? 'Data Block A' : '未使用'}
                        </div>
                        <div className={`p-3 rounded-xl text-center font-bold text-xs shadow-sm ${disk < 3 ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-300 opacity-20'}`}>
                          {disk < 3 ? 'Data Block B' : '未使用'}
                        </div>
                     </>
                   )}
                   {raidType === 5 && (
                     <>
                        <div className={`p-3 rounded-xl text-center font-bold text-xs shadow-sm transition-all ${disk === 1 ? 'bg-blue-500 text-white' : disk === 2 ? 'bg-emerald-500 text-white' : 'bg-orange-400 text-white ring-4 ring-orange-100'}`}>
                          {disk === 1 ? 'Data A' : disk === 2 ? 'Data B' : 'Parity(A,B)'}
                        </div>
                        <div className={`p-3 rounded-xl text-center font-bold text-xs shadow-sm transition-all ${disk === 3 ? 'bg-blue-500 text-white' : disk === 1 ? 'bg-emerald-500 text-white' : 'bg-orange-400 text-white ring-4 ring-orange-100'}`}>
                          {disk === 3 ? 'Data C' : disk === 1 ? 'Data D' : 'Parity(C,D)'}
                        </div>
                     </>
                   )}
                </div>
             </div>
          ))}
       </div>

       <div className={`p-4 rounded-2xl border flex items-start gap-4 ${mode === 'cute' ? 'bg-pink-50 border-pink-100 text-pink-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
          <div className="mt-1"><Shield size={20} className="text-blue-500"/></div>
          <div className="text-xs space-y-2">
            {raidType === 0 && <p><strong>RAID 0 (条带化):</strong> 数据被打碎分布在所有磁盘。性能最高，但无任何容错。坏一块盘，全盘皆墨。</p>}
            {raidType === 1 && <p><strong>RAID 1 (镜像):</strong> 每一块数据都有完整备份。最安全，但空间利用率仅为 50%。</p>}
            {raidType === 5 && <p><strong>RAID 5 (分布式奇偶校验):</strong> 兼顾性能和容错。允许损坏任意一块磁盘而不丢失数据，坏盘时通过校验码重建数据。</p>}
          </div>
       </div>
    </div>
  );
};

// --- Sub-component: Journaling & Recovery ---
const JournalingDemo = () => {
  const { styles, mode } = useTheme();
  const [step, setStep] = useState(0);
  const [isCrashed, setIsCrashed] = useState(false);
  const [journal, setJournal] = useState<string[]>([]);
  const [diskState, setDiskState] = useState<string>("旧数据 (Old)");

  const steps = [
    "开始事务 (Tx Start)",
    "写入日志区 (Log Entry)",
    "提交标记 (Commit Mark)",
    "数据下刷 (Checkpoint)"
  ];

  const handleNext = () => {
    if (isCrashed) return;
    if (step === 0) setJournal(["Tx_ID: 99"]);
    if (step === 1) setJournal(["Tx_ID: 99", "Update Block #42: New"]);
    if (step === 2) setJournal(["Tx_ID: 99", "Update Block #42: New", "COMMITTED"]);
    if (step === 3) setDiskState("新数据 (New)");
    setStep(s => s + 1);
  };

  const handleCrash = () => {
    setIsCrashed(true);
    setStep(-1);
  };

  const handleRecovery = () => {
    const hasCommitted = journal.includes("COMMITTED");
    if (hasCommitted) {
      // REDO
      setDiskState("新数据 (REDO 成功)");
    } else {
      // UNDO / Rollback
      setJournal([]);
      setDiskState("旧数据 (UNDO 完成)");
    }
    setIsCrashed(false);
    setStep(0);
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
        {/* Journal Area */}
        <div className={`${styles.card} p-5 flex flex-col bg-slate-900 text-emerald-400 font-mono text-sm relative border-slate-800`}>
           <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/30"></div>
           <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-6 flex items-center gap-2">
             <FileCode size={14}/> 日志记录区 (Journal Space)
           </h4>
           <div className="flex-1 space-y-2 overflow-auto">
             {journal.map((line, i) => (
               <div key={i} className="animate-in slide-in-from-left-4 text-xs">
                 <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                 {'>'} {line}
               </div>
             ))}
             {isCrashed && <div className="text-red-500 font-bold animate-pulse mt-4">{'>'} !! 发生意外停电 / 系统崩溃 !!</div>}
           </div>
        </div>

        {/* Physical Disk */}
        <div className={`${styles.card} p-5 flex flex-col items-center justify-center relative`}>
           <h4 className="absolute top-4 left-4 text-[10px] uppercase font-bold text-slate-400 flex items-center gap-2">
             <Database size={14}/> 物理存储介质
           </h4>
           
           <div className={`w-40 h-40 rounded-[3rem] border-8 flex flex-col items-center justify-center transition-all duration-1000 shadow-2xl ${diskState.includes("新") ? 'border-emerald-400 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
              <div className="text-lg font-black text-slate-700">{diskState}</div>
              <div className="text-[9px] text-slate-400 mt-2 uppercase font-mono tracking-widest">Sector #2048</div>
           </div>

           <div className="mt-8 flex flex-col gap-2 w-full px-6">
              {steps.map((s, i) => (
                <div key={i} className={`text-[10px] p-2 rounded-xl border flex items-center gap-3 transition-all ${step > i ? 'bg-emerald-500 text-white border-emerald-400' : step === i ? 'bg-blue-50 border-blue-200 text-blue-600 font-bold ring-2 ring-blue-100' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                  {step > i ? <CheckCircle size={12}/> : <Activity size={12}/>} {s}
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className={`${styles.card} p-5 flex justify-center gap-4`}>
         {!isCrashed ? (
           <>
            <button onClick={handleNext} disabled={step >= steps.length} className={styles.button.primary + " px-10 py-3 flex items-center gap-2"}>
              <ArrowRight size={20}/> 执行写入流
            </button>
            <button onClick={handleCrash} className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl transition-all">
              <AlertTriangle size={20}/> 拔掉电源 (Crash)
            </button>
           </>
         ) : (
           <button onClick={handleRecovery} className="bg-emerald-500 hover:bg-emerald-600 text-white px-16 py-4 rounded-2xl font-black text-lg flex items-center gap-3 shadow-2xl animate-bounce">
             <RefreshCcw size={24}/> 执行崩溃恢复流程
           </button>
         )}
         <button onClick={() => { setStep(0); setJournal([]); setDiskState("旧数据 (Old)"); setIsCrashed(false); }} className={styles.button.icon + " p-3"}>
           <RotateCcw size={24}/>
         </button>
      </div>
    </div>
  );
};

// --- Main File View Export ---
export const FileView: React.FC = () => {
  const { styles, mode } = useTheme();
  const [tab, setTab] = useState<'fd' | 'links' | 'raid' | 'journal' | 'device'>('fd');

  return (
    <div className={`flex flex-col h-full p-6 gap-6 ${styles.bg}`}>
       <div className="flex justify-center shrink-0">
         <div className={`p-1.5 rounded-2xl flex gap-1.5 border shadow-sm ${mode === 'cute' ? 'bg-white border-pink-100' : 'bg-slate-200 border-slate-300'}`}>
           <TabButton active={tab === 'fd'} onClick={() => setTab('fd')} label="文件描述符 FD" mode={mode} icon={<Activity size={14}/>}/>
           <TabButton active={tab === 'links'} onClick={() => setTab('links')} label="软硬链接" mode={mode} icon={<LinkIcon size={14}/>}/>
           <TabButton active={tab === 'raid'} onClick={() => setTab('raid')} label="磁盘阵列 RAID" mode={mode} icon={<LayoutGrid size={14}/>}/>
           <TabButton active={tab === 'journal'} onClick={() => setTab('journal')} label="日志恢复" mode={mode} icon={<RefreshCcw size={14}/>}/>
           <TabButton active={tab === 'device'} onClick={() => setTab('device')} label="设备交互 I/O" mode={mode} icon={<Cpu size={14}/>}/>
         </div>
       </div>

       <div className="flex-1 overflow-hidden">
          {tab === 'fd' && <DescriptorEssence />}
          {tab === 'links' && <LinksVisual />}
          {tab === 'raid' && <RAIDVisualizer />}
          {tab === 'journal' && <JournalingDemo />}
          {tab === 'device' && <DeviceIOView />}
       </div>
    </div>
  );
};

const TabButton = ({ active, onClick, label, mode, icon }: any) => (
  <button 
    onClick={onClick} 
    className={`px-6 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
      active 
        ? (mode === 'cute' ? 'bg-pink-400 text-white shadow-md' : 'bg-white text-slate-800 shadow-sm') 
        : 'text-slate-400 hover:text-slate-600'
    }`}
  >
    {icon} {label}
  </button>
);
