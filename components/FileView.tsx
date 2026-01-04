
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { 
  HardDrive, FileText, Database, Info, Share2, Link as LinkIcon, 
  Layers, FileCode, Activity, AlertTriangle, RefreshCcw, ArrowRight,
  CheckCircle, RotateCcw, Shield, Box, LayoutGrid, Cpu, Zap, Radio, FastForward,
  Disc, Settings, Clock, Move, MousePointer2, List, Grid3X3, Trash2
} from 'lucide-react';

// --- Sub-component: Disk Structure (HDD vs SSD) ---
const DiskStructureView = () => {
  const { styles, mode } = useTheme();
  const [diskType, setDiskType] = useState<'hdd' | 'ssd'>('hdd');
  const [targetBlock, setTargetBlock] = useState<number | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'SEEK' | 'ROTATE' | 'READ'>('IDLE');
  const [armPos, setArmPos] = useState(0); // 0: Outer, 1: Middle, 2: Inner
  const [rotation, setRotation] = useState(0); // Cumulative rotation in degrees
  const [logs, setLogs] = useState<string[]>([]);
  
  // HDD Constants
  const TRACKS = 3;
  const SECTORS_PER_TRACK = 8;
  const SECTOR_ANGLE = 360 / SECTORS_PER_TRACK;
  
  // SSD Constants
  const SSD_GRID_SIZE = 64; // 8x8 blocks

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 3));

  // Simulation Logic
  const readSector = (blockId: number) => {
    if (status !== 'IDLE') return;
    setTargetBlock(blockId);
    setLogs([]);

    if (diskType === 'hdd') {
      // 1. Calculate Geometry
      const track = Math.floor(blockId / SECTORS_PER_TRACK); // 0, 1, 2
      const sectorIndex = blockId % SECTORS_PER_TRACK; 

      // --- Phase 1: Seek (Move Arm) ---
      setStatus('SEEK');
      addLog(`1. 寻道: 移动磁头到磁道 #${track}`);
      setArmPos(track); // CSS transition will handle movement

      // Wait for arm to move
      setTimeout(() => {
        
        // --- Phase 2: Rotational Latency ---
        setStatus('ROTATE');
        addLog(`2. 旋转延迟: 等待扇区 #${blockId} 转到磁头下`);
        
        // Calculate target rotation
        // We want the target sector to end up at the "East" position (0 degrees visually in our setup)
        // Current sector angle is sectorIndex * 45.
        // To align it to 0, we need to rotate the disk back by that amount.
        // We add extra spins (720 deg) for visual effect.
        const currentSectorAngle = sectorIndex * SECTOR_ANGLE;
        // We want (rotation - currentSectorAngle) % 360 === 0 effectively.
        // Let's just add full spins + the difference to align.
        
        // Ensure we always rotate clockwise (increase rotation value)
        // Find next multiple of 360 that allows us to subtract the sector offset
        // Target Rotation = (Current Rotation rounded up to next 360) + 360 (spin) + (360 - sectorAngle)
        const nextBase = Math.ceil(rotation / 360) * 360;
        const targetRotation = nextBase + 360 + (360 - currentSectorAngle); 
        
        setRotation(targetRotation);

        // Wait for rotation animation (needs to match CSS duration)
        setTimeout(() => {
           // --- Phase 3: Transfer ---
           setStatus('READ');
           addLog(`3. 数据传输: 读取数据...`);
           
           setTimeout(() => {
             setStatus('IDLE');
             addLog(`完成: 成功读取块 #${blockId}`);
             setTargetBlock(null);
           }, 800);
        }, 1500); 
      }, 800); // Wait for seek

    } else {
      // SSD: Instant Access
      addLog(`电子寻址: 直接激活 Page #${blockId}`);
      setStatus('READ');
      setTimeout(() => {
        setStatus('IDLE');
        setTargetBlock(null);
      }, 400); // Fast electrical access
    }
  };

  const getHddSectorPos = (trackIdx: number, sectorIdx: number) => {
    // Determine visuals based on static geometry, rotation handles the rest
    const angle = sectorIdx * SECTOR_ANGLE;
    // Track radii: Outer(0)=130, Middle(1)=90, Inner(2)=50
    // Visual tracks are roughly at 150, 110, 70 boundary lines
    const radius = 130 - (trackIdx * 40); 
    return {
      left: '50%',
      top: '50%',
      transform: `rotate(${angle}deg) translate(${radius}px) rotate(-${angle}deg)`
    };
  };

  return (
    <div className="flex flex-col gap-6 h-full">
       <div className={`${styles.card} p-4 flex flex-col md:flex-row gap-6 shrink-0 items-center justify-between`}>
          <div>
             <h3 className={`font-bold text-lg ${styles.text.primary}`}>磁盘物理结构 (Disk Physics)</h3>
             <p className={`text-xs ${styles.text.secondary}`}>对比机械硬盘 (HDD) 与 固态硬盘 (SSD) 的读写原理</p>
          </div>
          <div className={`flex p-1 rounded-xl border ${mode === 'cute' ? 'bg-white border-pink-100' : 'bg-slate-200 border-slate-300'}`}>
             <button onClick={() => { setDiskType('hdd'); setStatus('IDLE'); setLogs([]); }} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${diskType === 'hdd' ? (mode === 'cute' ? 'bg-pink-400 text-white' : 'bg-slate-800 text-white') : 'text-slate-500'}`}>
               <Disc size={16}/> HDD (机械)
             </button>
             <button onClick={() => { setDiskType('ssd'); setStatus('IDLE'); setLogs([]); }} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${diskType === 'ssd' ? (mode === 'cute' ? 'bg-pink-400 text-white' : 'bg-slate-800 text-white') : 'text-slate-500'}`}>
               <Zap size={16}/> SSD (固态)
             </button>
          </div>
       </div>

       <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-[400px]">
          
          {/* LEFT: Visualizer */}
          <div className={`${styles.card} flex-1 p-8 flex flex-col items-center justify-center bg-slate-50/50 relative overflow-hidden`}>
             
             {/* Status Indicator */}
             <div className="absolute top-4 left-4 flex flex-col gap-2 z-40">
                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 transition-colors ${
                  status === 'IDLE' ? 'bg-slate-100 text-slate-500' :
                  status === 'SEEK' ? 'bg-orange-100 text-orange-600 border-orange-200' :
                  status === 'ROTATE' ? 'bg-blue-100 text-blue-600 border-blue-200' :
                  'bg-green-100 text-green-600 border-green-200'
                }`}>
                   {status === 'IDLE' && <Box size={14}/>}
                   {status === 'SEEK' && <Move size={14}/>}
                   {status === 'ROTATE' && <RefreshCcw size={14} className="animate-spin"/>}
                   {status === 'READ' && <Zap size={14}/>}
                   
                   {status === 'IDLE' ? '空闲 (Idle)' :
                    status === 'SEEK' ? '1. 寻道 (Seek Time)' :
                    status === 'ROTATE' ? '2. 旋转延迟 (Latency)' :
                    '3. 数据传输 (Transfer)'}
                </div>
                
                {/* Real-time Logs */}
                <div className="flex flex-col gap-1 mt-2">
                   {logs.map((log, i) => (
                     <div key={i} className="text-[10px] text-slate-500 animate-in slide-in-from-left-2 bg-white/60 px-2 py-1 rounded border border-slate-100 shadow-sm w-fit backdrop-blur-sm">
                       {log}
                     </div>
                   ))}
                </div>
             </div>

             {diskType === 'hdd' ? (
               <div className="relative w-[320px] h-[320px] flex items-center justify-center">
                  {/* HDD Casing/Platter */}
                  <div className="absolute inset-0 rounded-full border-4 border-slate-300 bg-slate-200 shadow-2xl overflow-hidden">
                     {/* Spindle */}
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-slate-400 rounded-full border-2 border-slate-500 z-20 shadow-sm"></div>
                  </div>

                  {/* ROTATING PART: Platter Surface with Sectors */}
                  <div 
                    className="absolute inset-0 rounded-full transition-transform ease-out" 
                    style={{ 
                      transform: `rotate(${rotation}deg)`,
                      transitionDuration: status === 'ROTATE' ? '1.5s' : '0s' // Only animate when rotating
                    }}
                  >
                     {/* Draw Tracks (Circles) */}
                     {[0, 1, 2].map(t => {
                       const size = 300 - (t * 80); // 300(r150), 220(r110), 140(r70)
                       return (
                         <div key={t} className="absolute border border-slate-400/30 rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ width: size, height: size }}></div>
                       )
                     })}
                     {/* Inner boundary for innermost track */}
                     <div className="absolute border border-slate-400/30 rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ width: 60, height: 60 }}></div>

                     {/* Draw Sectors */}
                     {Array.from({ length: TRACKS * SECTORS_PER_TRACK }).map((_, i) => {
                        const track = Math.floor(i / SECTORS_PER_TRACK);
                        const isActive = targetBlock === i;
                        const isRead = isActive && status === 'READ';
                        const style = getHddSectorPos(track, i % SECTORS_PER_TRACK);
                        
                        return (
                          <button 
                            key={i}
                            onClick={() => readSector(i)}
                            disabled={status !== 'IDLE'}
                            className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full text-[10px] flex items-center justify-center font-mono font-bold transition-all duration-300 shadow-sm border z-10
                              ${isRead ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,1)] z-30 scale-125 border-green-400' : 
                                isActive ? 'bg-orange-500 text-white shadow-md scale-110 z-20 border-orange-400' : 
                                'bg-white/90 text-slate-600 border-slate-300 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-400 hover:scale-110 hover:z-20 cursor-pointer'}
                            `}
                            style={style}
                            title={`Sector #${i} (Track ${track})`}
                          >
                            {i}
                          </button>
                        )
                     })}
                  </div>

                  {/* FIXED PART: Actuator Arm */}
                  <div className="absolute top-1/2 left-1/2 w-[320px] h-10 pointer-events-none z-30" 
                       style={{ 
                         // Origin is the pivot point on the right side
                         transformOrigin: '280px 20px', 
                         // Base rotation brings it to the "East" side. 
                         // ArmPos 0 (Outer) -> Less angle
                         // ArmPos 2 (Inner) -> More angle to tilt inwards
                         transform: `translate(-120px, -20px) rotate(${ -15 + (armPos * 12) }deg)`,
                         transition: 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)'
                       }}>
                     
                     {/* Arm Body */}
                     <div className="absolute right-10 top-1/2 -translate-y-1/2 w-[200px] h-6 bg-gradient-to-r from-slate-400 to-slate-300 shadow-lg" style={{ clipPath: 'polygon(0 40%, 100% 20%, 100% 80%, 0 60%)' }}></div>
                     
                     {/* Pivot */}
                     <div className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-700 rounded-full border-4 border-slate-500 shadow-xl"></div>
                     
                     {/* Read Head (The Tip) */}
                     <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-8 flex items-center justify-center">
                        <div className={`w-4 h-6 rounded border border-slate-600 shadow-sm transition-colors ${status === 'READ' ? 'bg-green-400' : status === 'SEEK' ? 'bg-orange-400' : 'bg-slate-200'}`}></div>
                        {/* Laser/Read Point indicator */}
                        <div className="absolute bottom-0 w-0.5 h-3 bg-red-500 opacity-50"></div>
                     </div>
                  </div>

                  {/* Visual Guide: Read Line */}
                  <div className="absolute right-[20px] top-1/2 -translate-y-1/2 w-[140px] h-[1px] bg-red-500/20 pointer-events-none z-0 dashed"></div>

                  {/* Center Label if IDLE */}
                  {status === 'IDLE' && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none text-[10px] text-slate-500 font-bold bg-white/80 px-2 py-1 rounded shadow-sm backdrop-blur-sm animate-pulse whitespace-nowrap border border-slate-100">
                       点击扇区读取
                    </div>
                  )}

               </div>
             ) : (
               // SSD View
               <div className="w-full max-w-sm grid grid-cols-8 gap-2 p-4 bg-slate-800 rounded-xl shadow-inner border-2 border-slate-700">
                  {Array.from({ length: SSD_GRID_SIZE }).map((_, i) => (
                    <button 
                      key={i}
                      onClick={() => readSector(i)}
                      disabled={status !== 'IDLE'}
                      className={`aspect-square rounded border transition-all duration-100 flex items-center justify-center text-[8px] font-mono
                        ${targetBlock === i && status === 'READ' 
                          ? 'bg-green-400 border-green-200 text-white scale-110 shadow-[0_0_10px_rgba(74,222,128,0.8)]' 
                          : 'bg-slate-700 border-slate-600 text-slate-500 hover:bg-slate-600 hover:text-slate-300'}
                      `}
                    >
                      {i}
                    </button>
                  ))}
               </div>
             )}

          </div>

          {/* RIGHT: Explainer */}
          <div className="w-full lg:w-80 flex flex-col gap-6">
             {/* Request Info Box */}
             <div className={`${styles.card} p-5`}>
                <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
                   <Settings size={16}/> I/O 操作说明
                </h4>
                <div className="text-xs text-slate-600 leading-relaxed mb-4">
                   {diskType === 'hdd' ? '点击左侧磁盘上的扇区编号 (0-23) 来模拟读取过程。观察磁头寻道和盘片旋转。' : '点击左侧 Flash 颗粒 (0-63) 模拟电子寻址。'}
                </div>
                
                <div className={`p-3 rounded-lg border text-[10px] font-mono ${mode === 'cute' ? 'bg-slate-50 border-pink-100' : 'bg-slate-100 border-slate-200'}`}>
                   <div>Current: {targetBlock !== null ? `#${targetBlock}` : '-'}</div>
                   <div>Status: {status}</div>
                   <div>Type: {diskType.toUpperCase()}</div>
                </div>
             </div>

             {/* Knowledge */}
             <div className={`p-4 rounded-xl border text-xs leading-relaxed flex flex-col gap-3 ${mode === 'cute' ? 'bg-white border-pink-100 text-slate-600' : 'bg-white border-slate-200 text-slate-600'}`}>
                {diskType === 'hdd' ? (
                  <>
                    <h4 className="font-bold flex items-center gap-2 text-orange-600"><Clock size={14}/> 机械硬盘时间开销</h4>
                    <ul className="space-y-2">
                      <li className="flex gap-2">
                         <div className="min-w-[4px] bg-orange-400 rounded-full"></div>
                         <div>
                            <strong>寻道时间 (Seek Time):</strong>
                            <div className="opacity-70">机械臂移动到指定磁道的时间。最耗时 (5-10ms)。</div>
                         </div>
                      </li>
                      <li className="flex gap-2">
                         <div className="min-w-[4px] bg-blue-400 rounded-full"></div>
                         <div>
                            <strong>旋转延迟 (Latency):</strong>
                            <div className="opacity-70">等待目标扇区转到磁头下方。取决于转速 (RPM)。</div>
                         </div>
                      </li>
                      <li className="flex gap-2">
                         <div className="min-w-[4px] bg-green-400 rounded-full"></div>
                         <div>
                            <strong>传输时间 (Transfer):</strong>
                            <div className="opacity-70">磁头感应磁性并读取数据的时间。非常快。</div>
                         </div>
                      </li>
                    </ul>
                    <div className="mt-2 p-2 bg-slate-100 rounded text-slate-500 italic text-center">
                       随机 I/O 慢就是因为频繁寻道和旋转等待。
                    </div>
                  </>
                ) : (
                  <>
                    <h4 className="font-bold flex items-center gap-2 text-green-600"><Zap size={14}/> 为什么 SSD 快？</h4>
                    <p>SSD 使用闪存颗粒（NAND Flash），没有机械运动部件。</p>
                    <ul className="list-disc list-inside space-y-1 pl-1">
                      <li><strong>电信号寻址:</strong> 直接通过电路选中目标 Page，耗时几乎为 0。</li>
                      <li><strong>无寻道/旋转:</strong> 随机读写与顺序读写速度差异远小于 HDD。</li>
                    </ul>
                    <p className="mt-2 text-slate-400 italic">但 SSD 存在“写入放大”和寿命限制问题。</p>
                  </>
                )}
             </div>
          </div>

       </div>
    </div>
  );
};

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

// --- New Component: DescriptorEssence ---
const DescriptorEssence = () => {
  const { styles, mode } = useTheme();
  const [hoverFd, setHoverFd] = useState<number | null>(null);

  const fdTable = [
    { fd: 0, name: 'stdin', tableIdx: 0 },
    { fd: 1, name: 'stdout', tableIdx: 0 },
    { fd: 2, name: 'stderr', tableIdx: 0 },
    { fd: 3, name: 'user_file.txt', tableIdx: 1 },
  ];

  const openFileTable = [
    { idx: 0, mode: 'rw', offset: 0, refCount: 3, inode: 10 }, // Shared by 0,1,2
    { idx: 1, mode: 'r', offset: 1024, refCount: 1, inode: 42 },
  ];

  const inodeTable = [
    { inode: 10, type: 'CHR', size: 0, perms: 'crw--' },
    { inode: 42, type: 'REG', size: 4096, perms: 'rw-r--' },
  ];

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className={`${styles.card} p-6`}>
         <h3 className={`font-bold text-lg ${styles.text.primary} mb-2`}>文件描述符 (File Descriptors)</h3>
         <p className={`text-sm ${styles.text.secondary}`}>
           Unix/Linux 系统中“一切皆文件”。进程通过文件描述符 (FD) 来访问文件。
           FD 只是一个整数索引，指向内核维护的打开文件表，进而指向 Inode。
         </p>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 items-stretch justify-center min-h-[400px]">
        
        {/* 1. Process FD Table */}
        <div className="flex-1 flex flex-col">
          <h4 className="text-center font-bold text-xs uppercase text-slate-400 mb-2">进程级: FD Table</h4>
          <div className={`${styles.card} flex-1 p-4 flex flex-col gap-2`}>
             {fdTable.map((entry) => (
               <div 
                 key={entry.fd}
                 onMouseEnter={() => setHoverFd(entry.fd)}
                 onMouseLeave={() => setHoverFd(null)}
                 className={`p-3 rounded-lg border flex justify-between items-center cursor-pointer transition-all ${
                   hoverFd === entry.fd 
                     ? (mode === 'cute' ? 'bg-pink-100 border-pink-300' : 'bg-blue-100 border-blue-400') 
                     : 'bg-white border-slate-200'
                 }`}
               >
                 <div className="flex items-center gap-2">
                   <div className="w-6 h-6 bg-slate-800 text-white rounded flex items-center justify-center font-mono text-xs">{entry.fd}</div>
                   <span className="text-xs font-bold">{entry.name}</span>
                 </div>
                 <ArrowRight size={14} className="text-slate-300"/>
               </div>
             ))}
          </div>
        </div>

        {/* 2. System Open File Table */}
        <div className="flex-1 flex flex-col">
          <h4 className="text-center font-bold text-xs uppercase text-slate-400 mb-2">系统级: Open File Table</h4>
          <div className={`${styles.card} flex-1 p-4 flex flex-col gap-2 justify-center bg-slate-50/50`}>
             {openFileTable.map((entry) => {
               const isHighlighted = hoverFd !== null && fdTable.find(f => f.fd === hoverFd)?.tableIdx === entry.idx;
               return (
                 <div 
                   key={entry.idx}
                   className={`p-4 rounded-xl border-2 flex flex-col gap-1 transition-all ${
                     isHighlighted 
                       ? (mode === 'cute' ? 'bg-purple-100 border-purple-300 scale-105' : 'bg-indigo-100 border-indigo-400 scale-105')
                       : 'bg-white border-slate-200'
                   }`}
                 >
                   <div className="text-[10px] font-bold uppercase text-slate-400">Entry #{entry.idx}</div>
                   <div className="flex justify-between text-xs">
                      <span>Offset: {entry.offset}</span>
                      <span className="font-mono bg-slate-200 px-1 rounded">Ref: {entry.refCount}</span>
                   </div>
                   <div className="flex justify-between text-xs items-center mt-1">
                      <span className="font-bold text-slate-600">Inode: {entry.inode}</span>
                      <ArrowRight size={14} className="text-slate-400"/>
                   </div>
                 </div>
               );
             })}
          </div>
        </div>

        {/* 3. Inode Table */}
        <div className="flex-1 flex flex-col">
           <h4 className="text-center font-bold text-xs uppercase text-slate-400 mb-2">磁盘级: Inode Table</h4>
           <div className={`${styles.card} flex-1 p-4 flex flex-col gap-2 justify-center bg-slate-100/50`}>
              {inodeTable.map((node) => {
                 const relatedOpenFile = openFileTable.find(o => o.inode === node.inode);
                 const isHighlighted = hoverFd !== null && fdTable.find(f => f.fd === hoverFd)?.tableIdx === relatedOpenFile?.idx;
                 
                 return (
                   <div 
                     key={node.inode}
                     className={`p-4 rounded-xl border-2 flex flex-col gap-1 transition-all ${
                       isHighlighted 
                         ? (mode === 'cute' ? 'bg-orange-100 border-orange-300 scale-105' : 'bg-emerald-100 border-emerald-400 scale-105')
                         : 'bg-white border-slate-200'
                     }`}
                   >
                     <div className="flex items-center gap-2 mb-1">
                        <Database size={16} className="text-slate-400"/>
                        <span className="font-bold text-sm">Inode {node.inode}</span>
                     </div>
                     <div className="text-[10px] grid grid-cols-2 gap-x-2 text-slate-500">
                        <span>Type: {node.type}</span>
                        <span>Size: {node.size}</span>
                        <span>Perms: {node.perms}</span>
                     </div>
                   </div>
                 );
              })}
           </div>
        </div>

      </div>
    </div>
  );
};

// --- New Component: RAIDVisualizer ---
const RAIDVisualizer = () => {
  const { styles, mode } = useTheme();
  const [level, setLevel] = useState<0 | 1 | 5>(0);
  
  // Example data blocks
  const blocks = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  const renderDisks = () => {
    // Logic to distribute blocks based on RAID level
    let disks: (string | null)[][] = [];
    
    if (level === 0) {
      disks = [[], []];
      blocks.forEach((b, i) => disks[i % 2].push(b));
    } else if (level === 1) {
      disks = [[], []];
      blocks.forEach(b => { disks[0].push(b); disks[1].push(b); });
    } else if (level === 5) {
      disks = [[], [], []];
      // Simple RAID 5 pattern for 6 blocks
      const pattern = [
        ['A', 'B', 'P'],
        ['C', 'P', 'D'],
        ['P', 'E', 'F']
      ];
      pattern.forEach(row => {
        disks[0].push(row[0]);
        disks[1].push(row[1]);
        disks[2].push(row[2]);
      });
    }

    return (
      <div className="flex justify-center gap-6 mt-8">
        {disks.map((diskContent, dIdx) => (
          <div key={dIdx} className="flex flex-col items-center">
             <div className="w-32 h-40 bg-slate-800 rounded-lg p-2 flex flex-col gap-2 border-b-4 border-slate-600 shadow-xl relative">
                <div className="absolute -top-6 text-xs font-bold text-slate-500 uppercase">Disk {dIdx}</div>
                {diskContent.map((block, bIdx) => (
                  <div key={bIdx} className={`h-8 rounded flex items-center justify-center font-bold text-sm shadow-sm transition-all animate-in zoom-in duration-500 delay-${bIdx * 100} ${
                    block?.startsWith('P') 
                      ? 'bg-purple-500 text-white border border-purple-400' 
                      : (mode === 'cute' ? 'bg-pink-100 text-pink-600 border border-pink-200' : 'bg-blue-100 text-blue-700 border border-blue-200')
                  }`}>
                    {block}
                  </div>
                ))}
             </div>
             {/* Spinner */}
             <div className="mt-2 w-24 h-2 rounded-full bg-slate-200 overflow-hidden">
               <div className="h-full bg-green-500 w-1/3 animate-ping" style={{ animationDuration: '2s' }}></div>
             </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-6">
       <div className={`${styles.card} p-6 flex flex-col items-center`}>
          <h3 className={`font-bold text-lg ${styles.text.primary} mb-6`}>RAID 磁盘阵列模拟</h3>
          
          <div className="flex gap-4 mb-6">
            <button onClick={() => setLevel(0)} className={`px-6 py-3 rounded-xl border-2 font-bold transition-all ${level === 0 ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:bg-slate-50'}`}>
              RAID 0 (Striping)
            </button>
            <button onClick={() => setLevel(1)} className={`px-6 py-3 rounded-xl border-2 font-bold transition-all ${level === 1 ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 hover:bg-slate-50'}`}>
              RAID 1 (Mirroring)
            </button>
            <button onClick={() => setLevel(5)} className={`px-6 py-3 rounded-xl border-2 font-bold transition-all ${level === 5 ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 hover:bg-slate-50'}`}>
              RAID 5 (Parity)
            </button>
          </div>

          <div className="max-w-2xl text-center text-sm text-slate-500 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
             {level === 0 && "RAID 0: 数据分条带（Striping）存储在不同磁盘。读写速度最快，但无冗余，任一磁盘损坏则数据全丢。"}
             {level === 1 && "RAID 1: 数据镜像（Mirroring）。数据同时写入两块盘。读取快（并行），写入稍慢，冗余度高（允许坏一块），但利用率只有 50%。"}
             {level === 5 && "RAID 5: 分布式奇偶校验。数据和校验位（Parity）分散存储。允许坏一块盘。读取快，写入因为要计算 Parity 较慢 (Write Penalty)。利用率 (N-1)/N。"}
          </div>
       </div>

       <div className="flex-1 overflow-y-auto">
          {renderDisks()}
       </div>
    </div>
  );
};

// --- New Component: JournalingDemo ---
const JournalingDemo = () => {
  const { styles, mode } = useTheme();
  const [step, setStep] = useState(0);
  const [crashed, setCrashed] = useState(false);

  const steps = [
    { title: "Idle", desc: "系统空闲。" },
    { title: "Tx Begin", desc: "开始事务 (Transaction Begin)。记录到日志区。" },
    { title: "Journal Write", desc: "将元数据和数据写入日志区域。" },
    { title: "Tx End (Commit)", desc: "写入事务结束标记 (Commit Block)。此时事务被视为“已提交”。" },
    { title: "Checkpoint", desc: "将数据写入实际文件系统位置 (Checkpointing)。" },
    { title: "Free", desc: "释放日志空间。" }
  ];

  const nextStep = () => {
    if (crashed) {
      // Recovery logic
      if (step >= 3) { // Committed
        alert("检测到已提交的事务！重放日志 (Replay)... 恢复数据！");
        setStep(5); // Jump to finished
      } else {
        alert("检测到未提交的事务。丢弃日志... 数据未损坏（保持旧状态）。");
        setStep(0);
      }
      setCrashed(false);
      return;
    }
    setStep((prev) => (prev + 1) % steps.length);
  };

  const simulateCrash = () => {
    setCrashed(true);
  };

  return (
    <div className="flex flex-col h-full gap-6 p-4">
       <div className={`${styles.card} p-6`}>
         <div className="flex justify-between items-center">
            <div>
              <h3 className={`font-bold text-lg ${styles.text.primary}`}>日志文件系统 (Journaling)</h3>
              <p className="text-sm text-slate-500">模拟写入过程及崩溃恢复 (Crash Consistency)</p>
            </div>
            <div className="flex gap-2">
               <button 
                 onClick={simulateCrash} 
                 disabled={crashed || step === 0 || step === 5}
                 className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold shadow-sm disabled:opacity-50 transition-colors"
               >
                 <Zap size={16} className="inline mr-1"/> 模拟断电崩溃
               </button>
               <button 
                 onClick={nextStep} 
                 className={`${styles.button.primary} px-6 py-2 flex items-center gap-2`}
               >
                 {crashed ? <RotateCcw size={16}/> : <ArrowRight size={16}/>}
                 {crashed ? "重启并恢复 (Recovery)" : "下一步"}
               </button>
            </div>
         </div>
       </div>

       <div className="flex-1 flex flex-col items-center justify-center gap-12 relative">
          
          {/* Progress Bar */}
          <div className="w-full max-w-3xl flex items-center justify-between relative px-4">
             <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10"></div>
             {steps.map((s, i) => (
               <div key={i} className={`flex flex-col items-center gap-2 transition-all ${i === step ? 'scale-110' : 'opacity-60'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 z-10 transition-colors ${
                    i <= step 
                      ? (crashed && i === step ? 'bg-red-500 border-red-600 text-white animate-pulse' : 'bg-green-500 border-green-600 text-white') 
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="text-[10px] font-bold uppercase bg-white px-1">{s.title}</div>
               </div>
             ))}
          </div>
          
          {/* Visualization Stage */}
          <div className="flex gap-12 items-stretch h-64">
             
             {/* Journal Area */}
             <div className={`w-64 rounded-xl border-4 p-4 flex flex-col gap-2 transition-all ${step > 0 && step < 5 ? 'border-orange-400 bg-orange-50 shadow-lg' : 'border-slate-300 bg-slate-50 opacity-50'}`}>
                <h4 className="font-bold text-center text-orange-700 flex items-center justify-center gap-2"><FileText size={16}/> Journal (Log)</h4>
                
                {step >= 1 && <div className="bg-orange-200 p-2 rounded text-xs font-mono text-orange-800 border border-orange-300">Tx Begin (ID: 101)</div>}
                {step >= 2 && <div className="bg-white p-2 rounded text-xs border border-orange-200 shadow-sm">
                   <div>Metadata: Inode #42</div>
                   <div>Data: Block #99</div>
                </div>}
                {step >= 3 && <div className="bg-orange-200 p-2 rounded text-xs font-mono text-orange-800 border border-orange-300">Tx End (Commit)</div>}
                
                {step === 0 && <div className="flex-1 flex items-center justify-center text-slate-400 text-xs italic">Empty</div>}
             </div>

             {/* Arrow */}
             <div className="flex items-center justify-center text-slate-300">
               <ArrowRight size={32} className={step === 4 ? 'text-green-500 animate-pulse' : ''}/>
             </div>

             {/* Main FS */}
             <div className={`w-64 rounded-xl border-4 p-4 flex flex-col gap-2 transition-all ${step === 4 ? 'border-green-400 bg-green-50 shadow-lg' : 'border-slate-300 bg-slate-50'}`}>
                <h4 className="font-bold text-center text-green-700 flex items-center justify-center gap-2"><Database size={16}/> Main FS</h4>
                
                {step >= 4 ? (
                   <div className="flex-1 flex flex-col justify-center gap-2 animate-in zoom-in">
                      <div className="bg-white p-2 rounded text-xs border border-green-200 shadow-sm">Updated Inode #42</div>
                      <div className="bg-white p-2 rounded text-xs border border-green-200 shadow-sm">Updated Block #99</div>
                      <div className="text-center text-xs text-green-600 font-bold mt-2"><CheckCircle size={14} className="inline"/> Checkpoint Done</div>
                   </div>
                ) : (
                   <div className="flex-1 flex items-center justify-center text-slate-400 text-xs italic">
                      Old State
                   </div>
                )}
             </div>
          </div>

          <div className="max-w-xl text-center p-4 bg-slate-100 rounded-xl text-sm text-slate-600">
             {crashed 
               ? "⚡ 系统崩溃！电源中断..." 
               : steps[step].desc}
          </div>

       </div>
    </div>
  );
};

// --- Main File View Export ---
export const FileView: React.FC = () => {
  const { styles, mode } = useTheme();
  const [tab, setTab] = useState<'fd' | 'links' | 'raid' | 'journal' | 'device' | 'disk'>('fd');

  return (
    <div className={`flex flex-col h-full p-6 gap-6 ${styles.bg}`}>
       <div className="flex justify-center shrink-0">
         <div className={`p-1.5 rounded-2xl flex gap-1.5 border shadow-sm ${mode === 'cute' ? 'bg-white border-pink-100' : 'bg-slate-200 border-slate-300'}`}>
           <TabButton active={tab === 'fd'} onClick={() => setTab('fd')} label="文件描述符 FD" mode={mode} icon={<Activity size={14}/>}/>
           <TabButton active={tab === 'links'} onClick={() => setTab('links')} label="软硬链接" mode={mode} icon={<LinkIcon size={14}/>}/>
           <TabButton active={tab === 'raid'} onClick={() => setTab('raid')} label="磁盘阵列 RAID" mode={mode} icon={<LayoutGrid size={14}/>}/>
           <TabButton active={tab === 'journal'} onClick={() => setTab('journal')} label="日志恢复" mode={mode} icon={<RefreshCcw size={14}/>}/>
           <TabButton active={tab === 'device'} onClick={() => setTab('device')} label="设备交互 I/O" mode={mode} icon={<Cpu size={14}/>}/>
           <TabButton active={tab === 'disk'} onClick={() => setTab('disk')} label="磁盘结构 Disk" mode={mode} icon={<Disc size={14}/>}/>
         </div>
       </div>

       <div className="flex-1 overflow-hidden">
          {tab === 'fd' && <DescriptorEssence />}
          {tab === 'links' && <LinksVisual />}
          {tab === 'raid' && <RAIDVisualizer />}
          {tab === 'journal' && <JournalingDemo />}
          {tab === 'device' && <DeviceIOView />}
          {tab === 'disk' && <DiskStructureView />}
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
