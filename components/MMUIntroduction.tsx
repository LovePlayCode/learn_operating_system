
import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { Cpu, Zap, Database, ArrowRight, ShieldAlert, X, Binary, Search, Settings, AlertTriangle, Layers } from 'lucide-react';

interface MMUIntroductionProps {
  onClose: () => void;
}

export const MMUIntroduction: React.FC<MMUIntroductionProps> = ({ onClose }) => {
  const { styles, mode } = useTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`relative w-full max-w-5xl max-h-[95vh] overflow-y-auto shadow-2xl ${mode === 'cute' ? 'bg-white rounded-[2rem] border-4 border-pink-200' : 'bg-white rounded-2xl border border-slate-200'}`}>
        
        {/* Header */}
        <div className={`p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10 ${mode === 'cute' ? 'border-pink-100' : 'border-slate-100'}`}>
           <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${mode === 'cute' ? 'bg-indigo-100 text-indigo-500' : 'bg-blue-600 text-white'}`}>
                <Cpu size={24}/>
              </div>
              <div>
                <h2 className={`text-xl font-bold ${styles.text.primary}`}>MMU 内部深度解析</h2>
                <p className="text-xs text-slate-400">Memory Management Unit Architecture</p>
              </div>
           </div>
           <button onClick={onClose} className={`p-2 rounded-full hover:bg-slate-100 transition-colors ${styles.text.secondary}`}>
             <X size={24}/>
           </button>
        </div>

        <div className="p-8 space-y-8">
           
           {/* Concept Introduction */}
           <div className={`p-5 rounded-xl border leading-relaxed text-sm ${mode === 'cute' ? 'bg-indigo-50 border-indigo-100 text-indigo-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
              <strong>不仅仅是查表：</strong><br/>
              MMU 内部除了大家熟知的 <strong>TLB (快表)</strong> 外，还包含控制寄存器（告诉 MMU 页表在哪里）、错误处理逻辑（告诉 OS 哪里出错了）以及复杂的缓存控制电路。现代高性能 CPU 通常采用 <strong>Split TLB</strong> 架构，即指令 TLB (iTLB) 和数据 TLB (dTLB) 分离。
           </div>

           {/* Interactive Diagram */}
           <div className="relative border-2 border-dashed border-slate-200 rounded-3xl p-8 bg-slate-50/50">
              <h3 className="absolute -top-3 left-8 px-4 bg-white text-xs font-bold text-slate-400 uppercase tracking-widest">MMU Internal Micro-Architecture</h3>
              
              <div className="flex flex-col xl:flex-row items-stretch justify-between gap-6">
                 
                 {/* 1. CPU Side */}
                 <div className="flex flex-col items-center justify-center gap-2 shrink-0">
                    <div className={`w-32 h-40 rounded-2xl border-4 flex flex-col items-center justify-center shadow-lg relative ${mode === 'cute' ? 'bg-pink-100 border-pink-300' : 'bg-slate-800 border-slate-700'}`}>
                       <Cpu size={48} className={mode === 'cute' ? 'text-pink-500' : 'text-white'}/>
                       <span className={`text-xs font-bold mt-2 ${mode === 'cute' ? 'text-pink-500' : 'text-slate-400'}`}>CPU Core</span>
                       
                       {/* Requests */}
                       <div className="absolute -right-16 top-8 flex items-center gap-1 animate-pulse">
                          <span className="text-[10px] font-mono bg-white border px-1 rounded">PC:0x0040</span>
                          <ArrowRight size={14} className="text-slate-400"/>
                       </div>
                       <div className="absolute -right-16 bottom-8 flex items-center gap-1 animate-pulse">
                          <span className="text-[10px] font-mono bg-white border px-1 rounded">LD:0x8000</span>
                          <ArrowRight size={14} className="text-slate-400"/>
                       </div>
                    </div>
                 </div>

                 {/* 2. MMU Box (Expanded) */}
                 <div className={`flex-1 p-6 rounded-3xl border-4 relative ${mode === 'cute' ? 'bg-indigo-50 border-indigo-200' : 'bg-blue-50 border-blue-200'}`}>
                    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white shadow-sm ${mode === 'cute' ? 'bg-indigo-400' : 'bg-blue-600'}`}>MMU 芯片</div>
                    
                    <div className="grid grid-cols-2 gap-4 h-full">
                       
                       {/* Control Registers */}
                       <div className="col-span-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><Settings size={18}/></div>
                             <div>
                               <div className="text-xs font-bold text-slate-700">CR3 / TTBR 寄存器</div>
                               <div className="text-[10px] text-slate-400">Root Page Table Pointer (页表基址)</div>
                             </div>
                          </div>
                          <span className="text-[9px] font-mono bg-slate-800 text-white px-2 py-1 rounded">0x10000</span>
                       </div>

                       {/* Split TLB */}
                       <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm flex flex-col gap-2 relative overflow-hidden">
                          <div className="text-[10px] font-bold text-indigo-500 uppercase flex items-center gap-1"><Zap size={12}/> i-TLB (指令)</div>
                          <div className="h-1 w-full bg-indigo-100 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-indigo-400"></div></div>
                          <div className="text-[9px] text-slate-400">加速指令预取</div>
                       </div>
                       
                       <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm flex flex-col gap-2 relative overflow-hidden">
                          <div className="text-[10px] font-bold text-indigo-500 uppercase flex items-center gap-1"><Zap size={12}/> d-TLB (数据)</div>
                          <div className="h-1 w-full bg-indigo-100 rounded-full overflow-hidden"><div className="w-1/3 h-full bg-indigo-400"></div></div>
                          <div className="text-[9px] text-slate-400">加速数据读写</div>
                       </div>

                       {/* Walker & Protection */}
                       <div className="col-span-1 bg-slate-100/50 p-3 rounded-xl border border-slate-200 border-dashed flex items-center gap-3 opacity-80">
                          <Search size={16} className="text-slate-400"/>
                          <div>
                            <div className="text-xs font-bold text-slate-600">Table Walker</div>
                            <div className="text-[10px] text-slate-400">硬件状态机遍历内存</div>
                          </div>
                       </div>

                       <div className="col-span-1 bg-red-50/50 p-3 rounded-xl border border-red-100 border-dashed flex items-center gap-3">
                          <ShieldAlert size={16} className="text-red-400"/>
                          <div>
                             <div className="text-xs font-bold text-slate-600">Perm Check</div>
                             <div className="text-[10px] text-slate-400">R/W/X 权限位检查</div>
                          </div>
                       </div>

                       {/* Fault Registers */}
                       <div className="col-span-2 bg-white p-3 rounded-xl border border-orange-200 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><AlertTriangle size={18}/></div>
                             <div>
                               <div className="text-xs font-bold text-slate-700">Fault Status Register (FSR)</div>
                               <div className="text-[10px] text-slate-400">记录缺页原因/地址供 OS 读取</div>
                             </div>
                          </div>
                       </div>

                    </div>
                 </div>

                 {/* 3. RAM Side */}
                 <div className="flex flex-col items-center justify-center gap-2 shrink-0">
                    <div className={`w-32 h-40 rounded-2xl border-4 flex flex-col items-center justify-center shadow-lg relative ${mode === 'cute' ? 'bg-emerald-100 border-emerald-300' : 'bg-slate-200 border-slate-300'}`}>
                       <Database size={48} className={mode === 'cute' ? 'text-emerald-500' : 'text-slate-400'}/>
                       <span className={`text-xs font-bold mt-2 ${mode === 'cute' ? 'text-emerald-600' : 'text-slate-500'}`}>DDR RAM</span>
                       
                       <div className="absolute -left-4 top-1/2 -translate-y-1/2 bg-white border px-2 py-1 text-[10px] font-mono rounded shadow-sm z-10 whitespace-nowrap">
                         Phys Addr
                       </div>
                    </div>
                 </div>

              </div>
           </div>

           {/* Detailed Explanation */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border bg-white hover:shadow-md transition-shadow">
                 <h4 className="flex items-center gap-2 font-bold text-sm mb-2 text-indigo-600"><Settings size={16}/> CR3 / PDBR 寄存器</h4>
                 <p className="text-xs text-slate-500 leading-relaxed text-justify">
                   这是 MMU 的“根”。每次进程切换（Context Switch）时，操作系统不仅要切换通用寄存器，最重要的就是更新 CR3 寄存器，使其指向新进程的页目录表。一旦 CR3 更新，整个虚拟地址空间的映射关系瞬间改变。
                 </p>
              </div>
              <div className="p-4 rounded-xl border bg-white hover:shadow-md transition-shadow">
                 <h4 className="flex items-center gap-2 font-bold text-sm mb-2 text-orange-600"><AlertTriangle size={16}/> 错误状态寄存器 (FSR/FAR)</h4>
                 <p className="text-xs text-slate-500 leading-relaxed text-justify">
                   当缺页异常发生时，CPU 会暂停执行。MMU 会将出错的虚拟地址存入 <strong>FAR (Fault Address Register)</strong>，并将错误类型（如：写只读页、页不存在）存入 <strong>FSR (Fault Status Register)</strong>。操作系统的缺页中断处理程序读取这些寄存器来决定如何修复。
                 </p>
              </div>
              <div className="p-4 rounded-xl border bg-white hover:shadow-md transition-shadow">
                 <h4 className="flex items-center gap-2 font-bold text-sm mb-2 text-yellow-600"><Layers size={16}/> 分离式 TLB (Split TLB)</h4>
                 <p className="text-xs text-slate-500 leading-relaxed text-justify">
                   为了配合 CPU 的流水线技术，现代 MMU 通常将 TLB 分为 <strong>iTLB</strong> (Instruction) 和 <strong>dTLB</strong> (Data)。这样 CPU 可以在取指令的同时（访问 iTLB），并行地读取内存数据（访问 dTLB），互不干扰，极大提升了性能。
                 </p>
              </div>
              <div className="p-4 rounded-xl border bg-white hover:shadow-md transition-shadow">
                 <h4 className="flex items-center gap-2 font-bold text-sm mb-2 text-slate-600"><Search size={16}/> 硬件遍历器 (Hardware Walker)</h4>
                 <p className="text-xs text-slate-500 leading-relaxed text-justify">
                   在 x86 等架构中，当 TLB 未命中时，是硬件电路自动去内存中查询页表，不需要操作系统介入。这叫做 Hardware Walk。而在 MIPS 等架构中，这可能由软件（OS）来完成（Software Managed TLB）。本模拟器主要展示 x86 风格的硬件遍历。
                 </p>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};
