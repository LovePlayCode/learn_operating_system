
import React, { useState } from 'react';
import { Segment } from '../types';
import { ArrowRight, GripVertical, Database, Cpu, Ban, CheckCircle, Info, BookOpen, Layers, Shield, AlertTriangle } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const INITIAL_SEGMENTS: Segment[] = [
  { id: 0, name: '代码段 (Code)', base: 2000, limit: 1500, color: 'bg-emerald-500' },
  { id: 1, name: '数据段 (Data)', base: 6000, limit: 800, color: 'bg-blue-500' },
  { id: 2, name: '堆栈段 (Stack)', base: 8000, limit: 1200, color: 'bg-purple-500' },
  { id: 3, name: '附加段 (Extra)', base: 4500, limit: 500, color: 'bg-amber-500' },
];

const MEMORY_SIZE = 10000;

export const SegmentationView: React.FC = () => {
  const { styles, mode } = useTheme();
  const [segments] = useState<Segment[]>(INITIAL_SEGMENTS);
  const [selectedSegId, setSelectedSegId] = useState<number>(0);
  const [offset, setOffset] = useState<number>(500);

  const currentSegment = segments.find(s => s.id === selectedSegId) || segments[0];
  const isFault = offset >= currentSegment.limit;
  const physicalAddress = currentSegment.base + offset;

  // Dynamic colors helper
  const getSegmentColor = (segId: number) => {
    if (mode === 'cute') {
      const colors = ['bg-emerald-400', 'bg-sky-400', 'bg-violet-400', 'bg-amber-400'];
      return colors[segId % colors.length];
    }
    return segments.find(s => s.id === segId)?.color || 'bg-slate-400';
  };

  return (
    <div className={`flex h-full p-6 gap-6 overflow-hidden ${styles.bg}`}>
      
      {/* Left Column: Controls & Knowledge */}
      <div className="w-1/3 flex flex-col gap-6 overflow-y-auto pr-1 scrollbar-thin">
        
        {/* Input Panel */}
        <div className={`${styles.card} p-5 shrink-0`}>
          <div className={`flex items-center gap-2 mb-4 pb-2 ${styles.cardHeader} rounded-t-xl -mx-5 -mt-5 px-5 pt-4`}>
             <div className={`p-1.5 rounded-lg ${mode === 'cute' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-600'}`}><GripVertical size={18}/></div>
             <h3 className={`font-bold ${styles.text.primary}`}>1. 生成逻辑地址</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className={`flex justify-between text-xs font-bold uppercase mb-2 ${styles.text.secondary}`}>
                <span>选择段寄存器</span>
                <span className={styles.text.accent}>s = {selectedSegId}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {segments.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedSegId(s.id); setOffset(0); }}
                    className={`p-3 text-left transition-all relative overflow-hidden group ${mode === 'cute' ? 'rounded-2xl' : 'rounded-xl'} border ${
                      selectedSegId === s.id 
                      ? `${mode === 'cute' ? 'border-pink-400 bg-pink-50' : 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'}` 
                      : 'border-transparent bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getSegmentColor(s.id)}`}></div>
                    <div className={`text-xs font-bold pl-3 ${styles.text.primary}`}>{s.name}</div>
                    <div className="text-[10px] text-slate-400 mt-1 pl-3 font-mono">ID: {s.id}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <label className={`text-xs font-bold uppercase ${styles.text.secondary}`}>段内偏移量 (Offset)</label>
                <span className={`font-mono text-lg font-bold ${isFault ? styles.text.danger : styles.text.accent}`}>d = {offset}</span>
              </div>
              <div className="relative pt-1">
                <input 
                  type="range" 
                  min="0" 
                  max={currentSegment.limit + 500} 
                  value={offset}
                  onChange={(e) => setOffset(Number(e.target.value))}
                  className={`w-full h-2 rounded-full appearance-none cursor-pointer transition-colors ${
                    isFault 
                      ? 'bg-red-200 accent-red-500' 
                      : mode === 'cute' ? 'bg-pink-100 accent-pink-400' : 'bg-slate-200 accent-blue-600'
                  }`}
                />
                {/* Limit Marker */}
                <div 
                  className="absolute top-0 w-0.5 h-4 bg-red-400 z-10 pointer-events-none"
                  style={{ left: `${(currentSegment.limit / (currentSegment.limit + 500)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Segment Table */}
        <div className={`${styles.card} p-5 shrink-0 flex flex-col`}>
           <div className="flex items-center justify-between mb-4">
             <h3 className={`font-bold flex items-center gap-2 ${styles.text.primary}`}>
               <div className={`p-1.5 rounded-lg ${mode === 'cute' ? 'bg-amber-100 text-amber-500' : 'bg-amber-100 text-amber-600'}`}><Database size={18}/></div>
               2. 查段表 (Segment Table)
             </h3>
           </div>
           
           <div className={`overflow-hidden border ${mode === 'cute' ? 'rounded-2xl border-pink-100' : 'rounded-xl border-slate-200'}`}>
             <table className="w-full text-sm text-left">
               <thead className={`${mode === 'cute' ? 'bg-pink-50 text-pink-400' : 'bg-slate-50 text-slate-500'} text-xs uppercase`}>
                 <tr>
                   <th className="p-3 font-medium">Seg#</th>
                   <th className="p-3 font-medium">Base</th>
                   <th className="p-3 font-medium">Limit</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 font-mono">
                 {segments.map(s => (
                   <tr 
                    key={s.id} 
                    className={`transition-colors ${selectedSegId === s.id ? (mode === 'cute' ? 'bg-pink-50' : 'bg-amber-50') : 'hover:bg-slate-50/50'}`}
                  >
                     <td className={`p-3 font-bold flex items-center gap-2 ${styles.text.primary}`}>
                       {selectedSegId === s.id && <ArrowRight size={12} className={styles.text.accent} />}
                       {s.id}
                     </td>
                     <td className={`p-3 ${selectedSegId === s.id ? styles.text.accent + ' font-bold' : styles.text.secondary}`}>{s.base}</td>
                     <td className={`p-3 ${selectedSegId === s.id ? styles.text.danger + ' font-bold' : styles.text.secondary}`}>{s.limit}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>

        {/* Knowledge Panel */}
        <div className={`${styles.card} p-5 bg-opacity-50`}>
           <div className="flex items-center gap-2 mb-4">
              <BookOpen size={18} className={mode === 'cute' ? 'text-pink-500' : 'text-blue-600'}/>
              <h3 className={`font-bold ${styles.text.primary}`}>段式存储核心概念</h3>
           </div>
           
           <div className="space-y-4 text-xs leading-relaxed text-slate-600">
              <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                 <h4 className="font-bold mb-1 flex items-center gap-1.5 text-slate-800">
                    <Layers size={14} className="text-purple-500"/> 什么是“段”?
                 </h4>
                 <p>
                    分段是将用户程序的逻辑地址空间划分为若干个<strong>逻辑单位</strong>（如代码段、数据段、堆栈段）。
                    与分页不同，段的大小不固定，取决于程序自身的逻辑结构。这更符合程序员的视角。
                 </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                 <h4 className="font-bold mb-1 flex items-center gap-1.5 text-slate-800">
                    <Shield size={14} className="text-emerald-500"/> 保护与共享
                 </h4>
                 <p>
                    每个段都可以独立设置权限（如代码段只读/可执行，数据段读写）。
                    因为段是逻辑单位，两个进程可以通过指向同一个物理段来实现<strong>内存共享</strong>（例如共享动态链接库）。
                 </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                 <h4 className="font-bold mb-1 flex items-center gap-1.5 text-slate-800">
                    <AlertTriangle size={14} className="text-orange-500"/> 外部碎片问题
                 </h4>
                 <p>
                    由于段长不固定，物理内存会被分割成不同大小的块。随着时间推移，会产生许多小的、无法利用的空闲区，称为<strong>外部碎片</strong>。需要通过“内存紧凑”技术来解决，但开销较大。
                 </p>
              </div>
           </div>
        </div>

      </div>

      {/* Middle: MMU Logic */}
      <div className="w-1/3 flex flex-col justify-center">
        <div className={`${styles.card} p-0 overflow-hidden relative flex flex-col`}>
          <div className={`${mode === 'cute' ? 'bg-gradient-to-r from-pink-400 to-rose-400' : 'bg-gradient-to-r from-slate-800 to-slate-900'} p-4 flex justify-between items-center text-white`}>
             <h4 className="font-bold flex items-center gap-2">
               <Cpu size={18} /> MMU 地址变换
             </h4>
             <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Hardware</span>
          </div>
          
          <div className="p-6 relative">
            {/* Limit Check */}
            <div className={`mb-8 p-4 border-2 transition-all duration-300 relative z-10 ${mode === 'cute' ? 'rounded-2xl' : 'rounded-xl'} ${
              isFault ? 'bg-red-50 border-red-200' : (mode === 'cute' ? 'bg-white border-pink-200' : 'bg-slate-50 border-slate-200')
            }`}>
               <div className={`absolute -top-3 left-4 px-2 bg-white text-xs font-bold uppercase ${styles.text.secondary}`}>Step 1: 越界检查</div>
               
               <div className="flex items-center justify-between gap-2 font-mono text-sm mb-2">
                  <div className="text-center">
                    <div className={`text-[10px] mb-1 ${styles.text.secondary}`}>Offset</div>
                    <div className={`font-bold text-lg ${styles.text.primary}`}>{offset}</div>
                  </div>
                  <div className={`${styles.text.secondary} font-bold`}>&lt;</div>
                  <div className="text-center">
                    <div className={`text-[10px] mb-1 ${styles.text.secondary}`}>Limit</div>
                    <div className={`font-bold text-lg ${styles.text.primary}`}>{currentSegment.limit}</div>
                  </div>
               </div>

               <div className={`flex items-center justify-center gap-2 text-sm font-bold py-1.5 rounded-lg border ${
                 isFault ? 'bg-red-100 text-red-600 border-red-200' : (mode === 'cute' ? 'bg-teal-100 text-teal-600 border-teal-200' : 'bg-green-100 text-green-600 border-green-200')
               }`}>
                  {isFault ? <><Ban size={16}/> 越界 (Trap)</> : <><CheckCircle size={16}/> 正常 (OK)</>}
               </div>
            </div>

            {/* Connector */}
            <div className="flex justify-center -my-4 relative z-0">
               <div className={`h-8 w-1 ${isFault ? 'bg-slate-200' : (mode === 'cute' ? 'bg-teal-300' : 'bg-green-400')}`}></div>
            </div>

            {/* Addition */}
            <div className={`mt-4 p-4 border-2 transition-all duration-300 relative z-10 ${mode === 'cute' ? 'rounded-2xl' : 'rounded-xl'} ${
              isFault ? 'opacity-40 grayscale border-slate-100' : (mode === 'cute' ? 'bg-sky-50 border-sky-200' : 'bg-blue-50 border-blue-200')
            }`}>
               <div className={`absolute -top-3 left-4 px-2 bg-white text-xs font-bold uppercase ${mode === 'cute' ? 'text-sky-400' : 'text-blue-400'}`}>Step 2: 重定位</div>
               
               <div className="font-mono flex flex-col gap-2">
                  <div className="flex justify-between items-center bg-white/60 p-2 rounded-lg">
                    <span className={`text-xs ${styles.text.secondary}`}>基址 (Base)</span> 
                    <span className={`font-bold ${styles.text.primary}`}>{currentSegment.base}</span>
                  </div>
                  <div className="flex justify-center text-slate-300 text-xs">+</div>
                  <div className="flex justify-between items-center bg-white/60 p-2 rounded-lg">
                    <span className={`text-xs ${styles.text.secondary}`}>偏移 (Offset)</span> 
                    <span className={`font-bold ${styles.text.primary}`}>{offset}</span>
                  </div>
                  <div className={`h-0.5 my-1 ${mode === 'cute' ? 'bg-sky-200' : 'bg-blue-200'}`}></div>
                  <div className={`flex justify-between items-center ${mode === 'cute' ? 'text-sky-600' : 'text-blue-700'}`}>
                    <span className="text-xs font-bold uppercase">物理地址</span> 
                    <span className="font-bold text-xl">{physicalAddress}</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Physical Memory Map */}
      <div className="w-1/3 flex flex-col">
        <div className={`${styles.card} p-5 flex flex-col h-full`}>
          <h3 className={`font-bold mb-4 flex items-center gap-2 ${styles.text.primary}`}>
            <div className={`p-1.5 rounded-lg ${mode === 'cute' ? 'bg-emerald-100 text-emerald-500' : 'bg-emerald-100 text-emerald-600'}`}><Database size={18}/></div>
            3. 物理内存 (RAM)
          </h3>
          
          <div className={`flex-1 relative rounded-xl overflow-hidden border w-full shadow-inner ${mode === 'cute' ? 'bg-slate-50 border-pink-100' : 'bg-slate-100 border-slate-200'}`}>
             {/* Memory Segments */}
             {segments.map(s => {
               const topPct = (s.base / MEMORY_SIZE) * 100;
               const heightPct = (s.limit / MEMORY_SIZE) * 100;
               const isSelected = selectedSegId === s.id;
               const cuteColor = getSegmentColor(s.id);
               
               return (
                 <div
                   key={s.id}
                   className={`absolute left-8 right-8 rounded-md shadow-sm border transition-all duration-300 flex items-center justify-center group cursor-default
                     ${mode === 'cute' ? cuteColor : s.color} 
                     ${isSelected ? 'bg-opacity-100 border-white/20 z-10 scale-[1.05] shadow-lg' : 'bg-opacity-20 border-black/5 opacity-60 grayscale-[0.3]'}
                   `}
                   style={{ top: `${topPct}%`, height: `${heightPct}%` }}
                 >
                   <span className={`text-xs font-bold truncate px-2 ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                     {s.name}
                   </span>
                   {/* Tooltip */}
                   <div className="absolute left-full ml-2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                     {s.base} - {s.base + s.limit}
                   </div>
                 </div>
               )
             })}

             {/* Pointer */}
             {!isFault && (
               <div 
                 className="absolute left-0 right-0 h-[2px] bg-red-500 z-30 flex items-center transition-all duration-300"
                 style={{ top: `${(physicalAddress / MEMORY_SIZE) * 100}%` }}
               >
                 <div className="w-full flex justify-between px-2 -mt-6">
                    <div className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-full font-mono shadow-sm flex items-center gap-1">
                      <ArrowRight size={10} />
                      Addr: {physicalAddress}
                    </div>
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>

    </div>
  );
};
