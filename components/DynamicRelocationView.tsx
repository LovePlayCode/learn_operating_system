
import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Cpu, Database, Ban, CheckCircle, ArrowRight, Calculator, Sliders, Box, ShieldAlert } from 'lucide-react';

const MEMORY_SIZE = 10000;

export const DynamicRelocationView: React.FC = () => {
  const { styles, mode } = useTheme();
  
  // State for Base and Limit registers
  const [base, setBase] = useState(3000);
  const [limit, setLimit] = useState(1500);
  const [logicalAddr, setLogicalAddr] = useState(500);

  // Logic
  const isFault = logicalAddr >= limit || logicalAddr < 0;
  const physicalAddr = base + logicalAddr;

  // Percentage calculations for visualization
  const basePercent = (base / MEMORY_SIZE) * 100;
  const limitPercent = (limit / MEMORY_SIZE) * 100;
  const ptrPercent = ((base + logicalAddr) / MEMORY_SIZE) * 100;

  return (
    <div className={`flex flex-col h-full p-6 gap-6 overflow-y-auto ${styles.bg}`}>
      
      {/* Introduction Card */}
      <div className={`${styles.card} p-5 shrink-0`}>
        <div className="flex items-start gap-4">
           <div className={`p-3 rounded-full ${mode === 'cute' ? 'bg-indigo-100 text-indigo-500' : 'bg-slate-100 text-slate-600'}`}>
             <Calculator size={24}/>
           </div>
           <div>
             <h3 className={`font-bold text-lg ${styles.text.primary}`}>动态重定位 (Base & Limit)</h3>
             <p className={`text-sm mt-1 max-w-3xl ${styles.text.secondary}`}>
               这是最简单的硬件虚拟化技术。CPU 中有两个专用寄存器：<strong>基址寄存器 (Base)</strong> 和 <strong>界限寄存器 (Limit)</strong>。
               <br/>
               每次内存访问时，MMU 会自动将虚拟地址加上基址，并检查是否超过界限。这使得操作系统可以轻松地将进程在物理内存中“搬家”，而进程本身无需感知。
             </p>
           </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-[500px]">
         
         {/* LEFT: PCB & Logical View */}
         <div className="w-full lg:w-1/3 flex flex-col gap-6">
            
            {/* Registers Control */}
            <div className={`${styles.card} p-6`}>
               <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                  <Sliders size={18} className={styles.text.accent}/>
                  <h3 className={`font-bold ${styles.text.primary}`}>PCB / 硬件寄存器设置</h3>
               </div>
               
               <div className="space-y-6">
                  <div>
                     <div className="flex justify-between mb-2">
                        <label className="text-xs font-bold uppercase text-slate-500">基址寄存器 (Base)</label>
                        <span className="font-mono font-bold text-blue-600">{base}</span>
                     </div>
                     <input 
                       type="range" min="0" max="8000" step="100"
                       value={base} onChange={(e) => setBase(Number(e.target.value))}
                       className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                     />
                  </div>
                  <div>
                     <div className="flex justify-between mb-2">
                        <label className="text-xs font-bold uppercase text-slate-500">界限寄存器 (Limit)</label>
                        <span className="font-mono font-bold text-orange-600">{limit}</span>
                     </div>
                     <input 
                       type="range" min="100" max="3000" step="50"
                       value={limit} onChange={(e) => setLimit(Number(e.target.value))}
                       className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                     />
                  </div>
               </div>
            </div>

            {/* Logical Address Input */}
            <div className={`${styles.card} p-6 flex-1`}>
               <div className="flex items-center gap-2 mb-4">
                  <Cpu size={18} className={styles.text.accent}/>
                  <h3 className={`font-bold ${styles.text.primary}`}>CPU 发出的逻辑地址</h3>
               </div>
               
               <div className="flex flex-col items-center justify-center py-4">
                  <div className={`text-4xl font-mono font-bold mb-4 ${isFault ? 'text-red-500' : styles.text.primary}`}>
                    {logicalAddr}
                  </div>
                  <input 
                    type="range" min="0" max={limit + 500} 
                    value={logicalAddr} onChange={(e) => setLogicalAddr(Number(e.target.value))}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isFault ? 'bg-red-200 accent-red-500' : 'bg-slate-200 accent-slate-600'}`}
                  />
                  <div className="flex justify-between w-full mt-2 text-[10px] text-slate-400 font-mono">
                     <span>0</span>
                     <span>Limit ({limit})</span>
                     <span>Max</span>
                  </div>
               </div>

               <div className={`mt-4 p-4 rounded-xl border flex items-center gap-3 ${isFault ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-700'}`}>
                  {isFault ? <ShieldAlert size={20}/> : <CheckCircle size={20}/>}
                  <div className="text-xs font-bold">
                     {isFault ? '越界错误 (Segmentation Fault)' : '地址有效 (Valid Address)'}
                  </div>
               </div>
            </div>
         </div>

         {/* CENTER: MMU Logic */}
         <div className="w-full lg:w-1/3 flex flex-col justify-center">
            <div className={`${styles.card} p-0 overflow-hidden flex flex-col h-full max-h-[600px] border-2 border-slate-200`}>
               <div className={`p-4 text-white font-bold flex justify-between items-center ${mode === 'cute' ? 'bg-indigo-400' : 'bg-slate-800'}`}>
                  <span className="flex items-center gap-2"><Box size={18}/> MMU 硬件逻辑</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">Hardware Path</span>
               </div>

               <div className="flex-1 p-8 flex flex-col items-center justify-center relative bg-slate-50/50">
                  
                  {/* Step 1: Limit Check */}
                  <div className={`w-full p-4 rounded-xl border-2 mb-8 relative transition-all ${isFault ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200'}`}>
                     <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 text-xs font-bold text-slate-400">1. Bounds Check</div>
                     <div className="flex items-center justify-around font-mono text-lg">
                        <div className="text-center">
                           <div className="text-[10px] text-slate-400">Logical</div>
                           <div className="font-bold">{logicalAddr}</div>
                        </div>
                        <div className="font-bold text-slate-300">&lt;</div>
                        <div className="text-center">
                           <div className="text-[10px] text-slate-400">Limit</div>
                           <div className="font-bold text-orange-500">{limit}</div>
                        </div>
                     </div>
                     {isFault && (
                        <div className="absolute inset-0 bg-red-100/90 flex items-center justify-center text-red-600 font-bold rounded-lg animate-in fade-in">
                           <Ban size={18} className="mr-2"/> TRAP TO OS
                        </div>
                     )}
                  </div>

                  <ArrowRight className="rotate-90 text-slate-300 mb-8" size={32}/>

                  {/* Step 2: Relocation */}
                  <div className={`w-full p-4 rounded-xl border-2 relative transition-all ${isFault ? 'opacity-30 grayscale' : 'bg-white border-blue-200'}`}>
                     <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 text-xs font-bold text-slate-400">2. Relocation</div>
                     <div className="flex items-center justify-around font-mono text-lg">
                        <div className="text-center">
                           <div className="text-[10px] text-slate-400">Logical</div>
                           <div className="font-bold">{logicalAddr}</div>
                        </div>
                        <div className="font-bold text-slate-300">+</div>
                        <div className="text-center">
                           <div className="text-[10px] text-slate-400">Base</div>
                           <div className="font-bold text-blue-500">{base}</div>
                        </div>
                     </div>
                     <div className={`mt-3 pt-3 border-t border-dashed border-slate-200 text-center font-mono font-black text-2xl ${mode === 'cute' ? 'text-indigo-500' : 'text-blue-600'}`}>
                        {physicalAddr}
                     </div>
                     <div className="text-center text-[10px] text-slate-400 mt-1 uppercase">Physical Address</div>
                  </div>

               </div>
            </div>
         </div>

         {/* RIGHT: Physical Memory */}
         <div className="w-full lg:w-1/3 flex flex-col">
            <div className={`${styles.card} h-full p-6 flex flex-col`}>
               <h3 className={`font-bold flex items-center gap-2 mb-4 ${styles.text.primary}`}>
                 <Database size={18} className={mode === 'cute' ? 'text-pink-400' : 'text-blue-500'}/>
                 物理内存视图
               </h3>
               
               <div className={`flex-1 w-full rounded-2xl border relative overflow-hidden ${mode === 'cute' ? 'bg-pink-50/30 border-pink-100' : 'bg-slate-100 border-slate-200'}`}>
                  
                  {/* OS Area */}
                  <div className="absolute top-0 w-full bg-slate-300 border-b border-white/50 flex items-center justify-center text-xs font-bold text-slate-500" style={{ height: '10%' }}>
                     OS Kernel
                  </div>

                  {/* Process Block */}
                  <div 
                    className={`absolute w-full transition-all duration-300 border-y-2 flex flex-col items-center justify-center ${mode === 'cute' ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-blue-200 border-blue-400 text-blue-800'}`}
                    style={{ top: `${basePercent}%`, height: `${limitPercent}%` }}
                  >
                     <span className="font-bold text-sm">当前进程</span>
                     <span className="text-[10px] opacity-70 font-mono">{base} - {base + limit}</span>
                  </div>

                  {/* Access Pointer */}
                  {!isFault && (
                     <div 
                       className="absolute w-full h-0.5 bg-red-500 z-10 transition-all duration-300 flex items-center"
                       style={{ top: `${ptrPercent}%` }}
                     >
                        <div className="w-full flex justify-end pr-2">
                           <div className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-l-full font-mono shadow-md">
                              PA: {physicalAddr}
                           </div>
                        </div>
                     </div>
                  )}

               </div>
            </div>
         </div>

      </div>
    </div>
  );
};
