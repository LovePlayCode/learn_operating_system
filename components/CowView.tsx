
import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Copy, Edit3, Lock, Unlock, GitFork, ArrowRight, Layers } from 'lucide-react';

export const CowView: React.FC = () => {
  const { styles, mode } = useTheme();
  const [hasForked, setHasForked] = useState(false);
  const [hasWritten, setHasWritten] = useState(false);

  const reset = () => {
    setHasForked(false);
    setHasWritten(false);
  };

  return (
    <div className={`flex flex-col h-full p-6 gap-6 overflow-y-auto ${styles.bg}`}>
       
       {/* Explainer Header */}
       <div className={`${styles.card} p-6 shrink-0`}>
          <div className="flex items-start gap-4">
             <div className={`p-3 rounded-full ${mode === 'cute' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-600'}`}>
               <Copy size={24}/>
             </div>
             <div>
               <h3 className={`font-bold text-lg ${styles.text.primary}`}>写时复制 (Copy-on-Write, COW)</h3>
               <p className={`text-sm mt-1 max-w-2xl ${styles.text.secondary}`}>
                 当父进程调用 <code>fork()</code> 创建子进程时，操作系统并不会立即复制物理内存。
                 相反，它将页表项设为只读 (Read-Only)。只有当任意一方尝试写入时，才会触发缺页异常并执行真正的物理拷贝。这极大地加速了进程创建。
               </p>
             </div>
          </div>
       </div>

       {/* Control Buttons */}
       <div className="flex justify-center gap-6">
          {!hasForked ? (
            <button 
              onClick={() => setHasForked(true)} 
              className={`px-8 py-3 rounded-xl font-bold text-lg flex items-center gap-2 shadow-lg transition-all hover:scale-105 ${styles.button.primary}`}
            >
              <GitFork size={20}/> 执行 fork()
            </button>
          ) : (
            <>
               <button 
                 onClick={() => setHasWritten(true)} 
                 disabled={hasWritten}
                 className={`px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
                   hasWritten 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:scale-105'
                 }`}
               >
                 <Edit3 size={18}/> 子进程写入数据 (Write)
               </button>
               <button onClick={reset} className={styles.button.secondary + " px-6 py-2"}>
                 重置 (Reset)
               </button>
            </>
          )}
       </div>

       {/* Visualization Area */}
       <div className="flex-1 flex gap-12 items-center justify-center min-h-[400px]">
          
          {/* Parent Process Page Table */}
          <div className="flex flex-col items-center gap-4">
             <h4 className="font-bold text-slate-500 uppercase text-xs">父进程 (PID 100)</h4>
             <div className={`${styles.card} p-4 w-48 border-2 ${mode === 'cute' ? 'border-blue-200' : 'border-slate-300'}`}>
                <div className="text-center text-sm font-bold border-b pb-2 mb-2">页表 (Page Table)</div>
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded mb-1">
                   <span className="text-xs font-mono text-slate-500">VPN 1</span>
                   <ArrowRight size={14} className="text-slate-300"/>
                   <span className="text-xs font-mono font-bold">PFN 50</span>
                </div>
                {/* Parent Permission Bit */}
                <div className={`text-[10px] text-center font-bold px-2 py-1 rounded transition-colors ${
                   hasForked ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                }`}>
                   {hasForked ? '只读 (COW)' : '读写 (RW)'}
                </div>
             </div>
          </div>

          {/* Physical Memory */}
          <div className="flex flex-col gap-8 relative">
             <h4 className="absolute -top-10 left-1/2 -translate-x-1/2 font-bold text-slate-400 uppercase text-xs flex items-center gap-2">
               <Layers size={14}/> 物理内存 (RAM)
             </h4>

             {/* Frame 50 (Original) */}
             <div className={`w-40 h-32 rounded-2xl border-4 flex flex-col items-center justify-center relative transition-all duration-500 ${
               hasForked ? 'border-orange-300 bg-orange-50' : 'border-blue-300 bg-blue-50'
             }`}>
                <div className="text-2xl font-black text-slate-700">数据 A</div>
                <div className="text-[10px] font-mono text-slate-400 mt-1">PFN 50</div>
                {hasForked && <Lock size={16} className="absolute top-2 right-2 text-orange-500" />}
             </div>

             {/* Frame 51 (New Copy) */}
             {hasWritten && (
                <div className="w-40 h-32 rounded-2xl border-4 border-green-400 bg-green-50 flex flex-col items-center justify-center relative animate-in zoom-in duration-500">
                   <div className="text-2xl font-black text-slate-700">数据 A'</div>
                   <div className="text-[10px] font-mono text-slate-400 mt-1">PFN 51</div>
                   <div className="absolute -left-20 top-1/2 -translate-y-1/2 text-[10px] text-green-600 font-bold bg-green-100 px-2 py-1 rounded-full whitespace-nowrap">
                      已复制 (Copied)
                   </div>
                </div>
             )}
          </div>

          {/* Child Process Page Table */}
          <div className={`flex flex-col items-center gap-4 transition-opacity duration-500 ${hasForked ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
             <h4 className="font-bold text-slate-500 uppercase text-xs">子进程 (PID 101)</h4>
             <div className={`${styles.card} p-4 w-48 border-2 ${mode === 'cute' ? 'border-pink-200' : 'border-slate-300'}`}>
                <div className="text-center text-sm font-bold border-b pb-2 mb-2">页表 (Page Table)</div>
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded mb-1">
                   <span className="text-xs font-mono text-slate-500">VPN 1</span>
                   <ArrowRight size={14} className="text-slate-300"/>
                   <span className="text-xs font-mono font-bold transition-all text-blue-600">
                     {hasWritten ? 'PFN 51' : 'PFN 50'}
                   </span>
                </div>
                {/* Child Permission Bit */}
                <div className={`text-[10px] text-center font-bold px-2 py-1 rounded transition-colors ${
                   hasWritten ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                }`}>
                   {hasWritten ? '读写 (RW)' : '只读 (COW)'}
                </div>
             </div>
          </div>

       </div>
       
       {/* Lines Drawing (SVG Overlay) */}
       <svg className="absolute inset-0 pointer-events-none w-full h-full" style={{zIndex: 0}}>
          {/* Logic to draw lines would be complex here due to responsive layout, omitting for simplicity in this text response, assuming visual proximity implies connection */}
       </svg>

    </div>
  );
};
