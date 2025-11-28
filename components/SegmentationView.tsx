import React, { useState } from 'react';
import { Segment } from '../types';
import { ArrowRight, AlertTriangle, CheckCircle, GripVertical, Ban, Calculator, Info, Database, Cpu } from 'lucide-react';

const INITIAL_SEGMENTS: Segment[] = [
  { id: 0, name: '代码段 (Code)', base: 2000, limit: 1500, color: 'bg-emerald-500' },
  { id: 1, name: '数据段 (Data)', base: 6000, limit: 800, color: 'bg-blue-500' },
  { id: 2, name: '堆栈段 (Stack)', base: 8000, limit: 1200, color: 'bg-purple-500' },
  { id: 3, name: '附加段 (Extra)', base: 4500, limit: 500, color: 'bg-amber-500' },
];

const MEMORY_SIZE = 10000;

export const SegmentationView: React.FC = () => {
  const [segments] = useState<Segment[]>(INITIAL_SEGMENTS);
  const [selectedSegId, setSelectedSegId] = useState<number>(0);
  const [offset, setOffset] = useState<number>(500);

  const currentSegment = segments.find(s => s.id === selectedSegId) || segments[0];
  const isFault = offset >= currentSegment.limit;
  const physicalAddress = currentSegment.base + offset;

  return (
    <div className="flex h-full p-6 gap-6 overflow-hidden bg-slate-50/50">
      
      {/* Left Column: Input & Segment Table */}
      <div className="w-1/3 flex flex-col gap-6 overflow-y-auto pr-1">
        
        {/* Input Panel */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
             <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600"><GripVertical size={18}/></div>
             <h3 className="font-bold text-slate-800">1. 生成逻辑地址</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="flex justify-between text-xs font-semibold text-slate-500 uppercase mb-2">
                <span>选择段寄存器 (Segment Selector)</span>
                <span className="text-blue-500">s = {selectedSegId}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {segments.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedSegId(s.id); setOffset(0); }}
                    className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                      selectedSegId === s.id 
                      ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.color}`}></div>
                    <div className="text-xs font-bold text-slate-700 pl-2">{s.name}</div>
                    <div className="text-[10px] text-slate-400 mt-1 pl-2 font-mono">ID: {s.id}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase">段内偏移量 (Offset)</label>
                <span className={`font-mono text-lg font-bold ${isFault ? 'text-red-500' : 'text-blue-600'}`}>d = {offset}</span>
              </div>
              <div className="relative pt-1">
                <input 
                  type="range" 
                  min="0" 
                  max={currentSegment.limit + 500} 
                  value={offset}
                  onChange={(e) => setOffset(Number(e.target.value))}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition-colors ${isFault ? 'bg-red-200 accent-red-500' : 'bg-slate-200 accent-blue-600'}`}
                />
                {/* Limit Marker */}
                <div 
                  className="absolute top-0 w-0.5 h-4 bg-red-400 z-10 pointer-events-none"
                  style={{ left: `${(currentSegment.limit / (currentSegment.limit + 500)) * 100}%` }}
                ></div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>0</span>
                  <span className="text-red-400 font-medium absolute transform -translate-x-1/2" style={{ left: `${(currentSegment.limit / (currentSegment.limit + 500)) * 100}%` }}>
                    Limit: {currentSegment.limit}
                  </span>
                  <span>Max</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Segment Table */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col hover:shadow-md transition-shadow">
           <div className="flex items-center justify-between mb-4">
             <h3 className="font-bold text-slate-800 flex items-center gap-2">
               <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600"><Database size={18}/></div>
               2. 查段表 (Segment Table)
             </h3>
             <div className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500">系统数据结构</div>
           </div>
           
           <div className="overflow-hidden rounded-xl border border-slate-200 flex-1">
             <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                 <tr>
                   <th className="p-3 font-medium">段号 (Seg#)</th>
                   <th className="p-3 font-medium">基址 (Base)</th>
                   <th className="p-3 font-medium">界限 (Limit)</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 font-mono">
                 {segments.map(s => (
                   <tr 
                    key={s.id} 
                    className={`transition-colors ${selectedSegId === s.id ? 'bg-amber-50' : 'hover:bg-slate-50'}`}
                  >
                     <td className="p-3 font-bold text-slate-700 flex items-center gap-2">
                       {selectedSegId === s.id && <ArrowRight size={12} className="text-amber-500" />}
                       {s.id}
                     </td>
                     <td className={`p-3 ${selectedSegId === s.id ? 'text-blue-600 font-bold' : 'text-slate-600'}`}>{s.base}</td>
                     <td className={`p-3 ${selectedSegId === s.id ? 'text-red-500 font-bold' : 'text-slate-600'}`}>{s.limit}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           
           <div className="mt-4 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-500 flex gap-2">
             <Info size={14} className="shrink-0 mt-0.5 text-blue-400" />
             <p>基址寄存器保存段在内存中的起始位置，界限寄存器保存段的长度，用于保护内存不被越界访问。</p>
           </div>
        </div>
      </div>

      {/* Middle: MMU Logic */}
      <div className="w-1/3 flex flex-col justify-center">
        <div className="bg-white p-0 rounded-2xl shadow-xl border border-slate-200 relative overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 flex justify-between items-center text-white">
             <h4 className="font-bold flex items-center gap-2">
               <Cpu size={18} /> MMU 地址变换
             </h4>
             <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded border border-white/20">Hardware Logic</span>
          </div>
          
          <div className="p-6 relative">
            {/* Circuit Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-20" xmlns="http://www.w3.org/2000/svg">
              <path d="M 50 50 L 50 100 L 150 100" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>

            {/* Step 1: Limit Check */}
            <div className={`mb-8 p-4 rounded-xl border-2 transition-all duration-300 relative z-10 ${
              isFault ? 'bg-red-50 border-red-200 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-slate-50 border-slate-200'
            }`}>
               <div className="absolute -top-3 left-4 px-2 bg-white text-xs font-bold text-slate-400 uppercase">Step 1: 越界检查</div>
               
               <div className="flex items-center justify-between gap-2 font-mono text-sm mb-2">
                  <div className="text-center">
                    <div className="text-slate-400 text-[10px] mb-1">Offset</div>
                    <div className="font-bold text-slate-800 text-lg">{offset}</div>
                  </div>
                  <div className="text-slate-400 font-bold">&lt;</div>
                  <div className="text-center">
                    <div className="text-slate-400 text-[10px] mb-1">Limit</div>
                    <div className="font-bold text-slate-800 text-lg">{currentSegment.limit}</div>
                  </div>
               </div>

               <div className={`flex items-center justify-center gap-2 text-sm font-bold py-1.5 rounded-lg border ${
                 isFault ? 'bg-red-100 text-red-600 border-red-200' : 'bg-green-100 text-green-600 border-green-200'
               }`}>
                  {isFault ? <><Ban size={16}/> 越界异常 (Trap)</> : <><CheckCircle size={16}/> 检查通过 (OK)</>}
               </div>
            </div>

            {/* Connector Arrow */}
            <div className="flex justify-center -my-4 relative z-0">
               <div className={`h-8 w-0.5 ${isFault ? 'bg-slate-200' : 'bg-green-400'}`}></div>
            </div>

            {/* Step 2: Addition */}
            <div className={`mt-4 p-4 rounded-xl border-2 transition-all duration-300 relative z-10 ${
              isFault ? 'opacity-40 grayscale border-slate-100 bg-slate-50' : 'bg-blue-50 border-blue-200 shadow-md'
            }`}>
               <div className="absolute -top-3 left-4 px-2 bg-white text-xs font-bold text-blue-400 uppercase">Step 2: 重定位</div>
               
               <div className="font-mono flex flex-col gap-2">
                  <div className="flex justify-between items-center text-slate-600 bg-white/50 p-2 rounded">
                    <span className="text-xs">基址 (Base)</span> 
                    <span className="font-bold">{currentSegment.base}</span>
                  </div>
                  <div className="flex justify-center text-slate-400 text-xs">+</div>
                  <div className="flex justify-between items-center text-slate-600 bg-white/50 p-2 rounded">
                    <span className="text-xs">偏移 (Offset)</span> 
                    <span className="font-bold">{offset}</span>
                  </div>
                  <div className="h-px bg-blue-200 my-1"></div>
                  <div className="flex justify-between items-center text-blue-700">
                    <span className="text-xs font-bold uppercase">物理地址</span> 
                    <span className="font-bold text-xl">{physicalAddress}</span>
                  </div>
               </div>
            </div>

            {!isFault && (
               <div className="absolute -right-4 top-1/2 transform translate-x-full">
                  <ArrowRight className="text-blue-500 animate-pulse drop-shadow-sm" size={32} />
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Physical Memory Map */}
      <div className="w-1/3 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col hover:shadow-md transition-shadow">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600"><Database size={18}/></div>
          3. 物理内存 (RAM)
        </h3>
        
        <div className="flex-1 relative bg-slate-100 rounded-xl overflow-hidden border border-slate-200 w-full shadow-inner">
           {/* Grid Background */}
           <div className="absolute inset-0 opacity-10" 
                style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px)', backgroundSize: '100% 10%' }}></div>

           {/* Memory Scale Labels */}
           <div className="absolute right-2 top-2 text-[10px] text-slate-400 font-mono">0x0000</div>
           <div className="absolute right-2 bottom-2 text-[10px] text-slate-400 font-mono">{MEMORY_SIZE}</div>
           
           {/* Render Segments */}
           {segments.map(s => {
             const topPct = (s.base / MEMORY_SIZE) * 100;
             const heightPct = (s.limit / MEMORY_SIZE) * 100;
             const isSelected = selectedSegId === s.id;
             return (
               <div
                 key={s.id}
                 className={`absolute left-8 right-8 rounded-md shadow-sm border transition-all duration-300 flex items-center justify-center group cursor-default
                   ${s.color} 
                   ${isSelected ? 'bg-opacity-100 border-white/20 z-10 scale-[1.02] shadow-lg' : 'bg-opacity-20 border-black/5 opacity-60 grayscale-[0.3]'}
                 `}
                 style={{ top: `${topPct}%`, height: `${heightPct}%` }}
               >
                 <span className={`text-xs font-bold truncate px-2 ${isSelected ? 'text-white drop-shadow-md' : 'text-slate-700'}`}>
                   {s.name}
                 </span>
                 
                 {/* Tooltip on Hover */}
                 <div className="absolute left-full ml-2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                   Range: {s.base} - {s.base + s.limit}
                 </div>
                 
                 {/* Base Address Label */}
                 <div className="absolute -left-7 top-0 text-[9px] font-mono text-slate-400 bg-white/80 px-0.5 rounded border border-slate-200">
                   {s.base}
                 </div>
               </div>
             )
           })}

           {/* Current Access Pointer */}
           {!isFault && (
             <div 
               className="absolute left-0 right-0 h-[2px] bg-red-500 z-30 flex items-center transition-all duration-300 shadow-[0_0_10px_rgba(239,68,68,0.6)]"
               style={{ top: `${(physicalAddress / MEMORY_SIZE) * 100}%` }}
             >
               <div className="w-full flex justify-between px-2 -mt-6">
                  <div className="bg-red-500 text-white text-[10px] px-2 py-1 rounded font-mono shadow-sm flex items-center gap-1">
                    <ArrowRight size={10} />
                    Addr: {physicalAddress}
                  </div>
               </div>
               <div className="absolute w-full h-[2px] bg-red-400 animate-pulse"></div>
             </div>
           )}
        </div>
        
        <div className="mt-4 flex gap-4 text-[10px] text-slate-500 justify-center">
           <div className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-200 border border-slate-300 rounded"></div> 空闲 (Free)</div>
           <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded"></div> 占用 (Used)</div>
        </div>
      </div>

    </div>
  );
};