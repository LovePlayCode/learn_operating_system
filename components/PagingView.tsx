import React, { useState, useEffect } from 'react';
import { PageTableEntry } from '../types';
import { ArrowDown, ArrowRight, Search, Server, Cpu, Zap, Binary, AlertOctagon } from 'lucide-react';

const PAGE_COUNT = 16;  // Total Pages

export const PagingView: React.FC = () => {
  const [virtualAddrInput, setVirtualAddrInput] = useState<string>("3050");
  const [pageTable, setPageTable] = useState<PageTableEntry[]>([]);
  const [hoveredSection, setHoveredSection] = useState<'vpn' | 'offset' | null>(null);
  
  useEffect(() => {
    const pt: PageTableEntry[] = [];
    for (let i = 0; i < PAGE_COUNT; i++) {
      pt.push({
        pageNumber: i,
        frameNumber: Math.floor(Math.random() * 256),
        valid: Math.random() > 0.2
      });
    }
    setPageTable(pt);
  }, []);

  // Parse Hex Input
  const cleanInput = virtualAddrInput.replace(/^0x/, '');
  const parsedAddr = parseInt(cleanInput, 16);
  const isValidHex = !isNaN(parsedAddr) && cleanInput.length <= 4 && cleanInput.length > 0;
  
  const vpn = isValidHex ? (parsedAddr >> 12) & 0xF : 0;
  const offset = isValidHex ? parsedAddr & 0xFFF : 0;
  
  const pte = pageTable[vpn];
  const physicalAddr = pte && pte.valid ? (pte.frameNumber << 12) | offset : null;

  return (
    <div className="flex flex-col h-full p-6 gap-6 overflow-y-auto bg-slate-50/50">
      
      {/* Top Section: CPU & Address Breakdown */}
      <div className="flex gap-6 items-stretch">
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 w-full md:w-1/3 flex flex-col">
            <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
              <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600"><Cpu size={18}/></div>
              CPU 虚拟地址 (VA)
            </h3>
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">0x</span>
              <input 
                type="text" 
                value={virtualAddrInput}
                onChange={(e) => {
                   if (e.target.value.length <= 4 && /^[0-9a-fA-F]*$/.test(e.target.value)) {
                     setVirtualAddrInput(e.target.value.toUpperCase());
                   }
                }}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none tracking-widest transition-all"
                placeholder="FFFF"
              />
            </div>
            <div className="mt-auto bg-blue-50 p-3 rounded-lg border border-blue-100">
               <div className="flex items-center gap-2 text-blue-800 font-bold text-xs mb-1">
                 <Zap size={14} fill="currentColor" /> 快表 (TLB) 模拟
               </div>
               <p className="text-[10px] text-blue-600 leading-tight">
                 现代 CPU 会先查找 TLB 缓存。如果 TLB Miss (未命中)，则需访问内存中的页表 (Page Table)。
               </p>
            </div>
         </div>

         {/* Address Bit Visualization */}
         {isValidHex && (
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col justify-center relative overflow-hidden">
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-6 flex items-center gap-2">
                 <Binary size={14}/> 地址结构拆解 (16-bit)
              </h4>
              
              <div className="flex justify-center items-stretch gap-1 h-24">
                
                {/* VPN Part */}
                <div 
                  className={`flex flex-col items-center group cursor-help transition-all duration-300 rounded-xl p-2 ${hoveredSection === 'vpn' ? 'bg-indigo-50 scale-105' : ''}`}
                  onMouseEnter={() => setHoveredSection('vpn')}
                  onMouseLeave={() => setHoveredSection(null)}
                >
                   <div className="flex-1 flex items-end mb-2">
                     <span className="text-[10px] text-slate-400 font-mono mb-1 mr-1">4-bit</span>
                     <div className="bg-indigo-100 border-2 border-indigo-500 text-indigo-800 font-mono font-bold text-3xl px-5 py-2 rounded-lg shadow-sm">
                        {cleanInput.padStart(4,'0')[0]}
                     </div>
                   </div>
                   <div className="flex flex-col items-center">
                     <div className="h-4 w-0.5 bg-indigo-300 mb-1"></div>
                     <span className="text-xs font-bold text-indigo-600">页号 (VPN)</span>
                     <span className="text-[10px] text-indigo-400 font-mono">Index: {vpn}</span>
                   </div>
                </div>

                <div className="flex items-center text-slate-300 pb-12 text-2xl font-light mx-4">+</div>

                {/* Offset Part */}
                <div 
                  className={`flex flex-col items-center group cursor-help transition-all duration-300 rounded-xl p-2 ${hoveredSection === 'offset' ? 'bg-teal-50 scale-105' : ''}`}
                  onMouseEnter={() => setHoveredSection('offset')}
                  onMouseLeave={() => setHoveredSection(null)}
                >
                   <div className="flex-1 flex items-end mb-2">
                     <span className="text-[10px] text-slate-400 font-mono mb-1 mr-1">12-bit</span>
                     <div className="bg-teal-100 border-2 border-teal-500 text-teal-800 font-mono font-bold text-3xl px-8 py-2 rounded-lg shadow-sm tracking-widest">
                        {cleanInput.padStart(4,'0').substring(1)}
                     </div>
                   </div>
                   <div className="flex flex-col items-center">
                     <div className="h-4 w-0.5 bg-teal-300 mb-1"></div>
                     <span className="text-xs font-bold text-teal-600">页内偏移 (Offset)</span>
                     <span className="text-[10px] text-teal-400">Page Size: 4KB</span>
                   </div>
                </div>

              </div>
           </div>
         )}
      </div>

      {/* Bottom: Flow Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0">
         
         {/* Step 1: Page Table Lookup */}
         <div className={`md:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 ${hoveredSection === 'vpn' ? 'ring-2 ring-indigo-400 shadow-md' : ''}`}>
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
               <h3 className="font-bold text-slate-700 flex items-center gap-2">
                 <div className="bg-indigo-100 p-1 rounded text-indigo-600"><Search size={14} /></div>
                 页表查找 (Lookup)
               </h3>
               <span className="text-xs font-mono bg-white border border-slate-200 px-2 py-1 rounded text-slate-500">VPN: {vpn}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-slate-200">
               <table className="w-full text-sm text-center">
                 <thead className="sticky top-0 bg-slate-100 text-slate-500 text-xs font-bold uppercase shadow-sm z-10">
                   <tr>
                     <th className="py-2.5">VPN (页号)</th>
                     <th className="py-2.5">PFN (物理页框)</th>
                     <th className="py-2.5">Valid (有效位)</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50 font-mono">
                   {pageTable.map((entry) => {
                     const isActive = isValidHex && entry.pageNumber === vpn;
                     return (
                       <tr 
                         key={entry.pageNumber} 
                         id={`row-${entry.pageNumber}`}
                         className={`transition-colors duration-300 ${
                           isActive 
                             ? 'bg-indigo-600 text-white shadow-inner' 
                             : 'hover:bg-slate-50 text-slate-600'
                         }`}
                       >
                         <td className="py-2 font-medium">0x{entry.pageNumber.toString(16).toUpperCase()}</td>
                         <td className={`py-2 font-bold ${isActive ? 'text-white' : 'text-slate-800'}`}>{entry.frameNumber.toString(16).toUpperCase().padStart(2, '0')}</td>
                         <td className="py-2">
                           {entry.valid 
                             ? <span className={`inline-block px-2 rounded-full text-[10px] ${isActive ? 'bg-green-400/30 text-white' : 'bg-green-100 text-green-700'}`}>1 (OK)</span> 
                             : <span className={`inline-block px-2 rounded-full text-[10px] ${isActive ? 'bg-red-400/30 text-white' : 'bg-red-100 text-red-500'}`}>0 (Fault)</span>}
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
            </div>
         </div>

         {/* Arrow Connector */}
         <div className="md:col-span-2 flex flex-col items-center justify-center text-slate-300 relative">
            {/* Animated line behind */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10"></div>
            
            {isValidHex && pte && pte.valid ? (
               <div className="bg-white p-2 rounded-full shadow-sm border border-slate-100 z-10">
                 <div className="flex flex-col items-center animate-pulse text-green-500">
                   <div className="bg-green-100 rounded-full p-2 mb-1"><ArrowRight size={24} /></div>
                   <span className="text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-600 px-2 rounded-full border border-green-100">映射命中</span>
                 </div>
               </div>
            ) : (
               <div className="bg-white p-2 rounded-full shadow-sm border border-slate-100 z-10">
                 <div className="flex flex-col items-center text-red-400 opacity-80">
                   <div className="bg-red-50 rounded-full p-2 mb-1"><AlertOctagon size={24} /></div>
                   <span className="text-[10px] font-bold uppercase">异常中断</span>
                 </div>
               </div>
            )}
         </div>

         {/* Step 2: Physical Address Construction */}
         <div className="md:col-span-5 flex flex-col gap-4">
            <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col justify-center items-center relative overflow-hidden transition-all duration-300 ${hoveredSection === 'offset' ? 'ring-2 ring-teal-400 shadow-md' : ''}`}>
               <h3 className="absolute top-4 left-4 font-bold text-slate-700 flex items-center gap-2">
                 <div className="bg-emerald-100 p-1 rounded text-emerald-600"><Server size={14} /></div>
                 物理地址 (PA)
               </h3>

               {isValidHex && pte ? (
                 pte.valid ? (
                   <div className="text-center z-10 w-full">
                      <div className="flex items-center justify-center gap-1 mb-8">
                         {/* PFN */}
                         <div className="flex flex-col relative group">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-indigo-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                               来自页表
                            </div>
                            <div className="bg-indigo-600 text-white font-mono text-2xl font-bold px-4 py-3 rounded-l-lg shadow-lg border-r border-indigo-400">
                               0x{pte.frameNumber.toString(16).toUpperCase().padStart(2,'0')}
                            </div>
                            <span className="text-xs font-bold text-indigo-600 mt-2">PFN</span>
                         </div>
                         {/* Offset */}
                         <div className="flex flex-col relative group">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-teal-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                               直接复制
                            </div>
                            <div className="bg-teal-500 text-white font-mono text-2xl font-bold px-4 py-3 rounded-r-lg shadow-lg">
                               {cleanInput.padStart(4,'0').substring(1)}
                            </div>
                            <span className="text-xs font-bold text-teal-600 mt-2">Offset</span>
                         </div>
                      </div>

                      <div className="text-5xl font-mono font-bold text-slate-800 tracking-wider drop-shadow-sm">
                         0x{physicalAddr!.toString(16).toUpperCase().padStart(5, '0')}
                      </div>
                      <div className="mt-4 text-xs text-green-700 font-medium bg-green-100 px-4 py-1.5 rounded-full inline-flex items-center gap-1 border border-green-200">
                        <CheckCircle size={12}/> 地址转换成功
                      </div>
                   </div>
                 ) : (
                   <div className="text-center z-10">
                      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-100 animate-pulse">
                         <AlertOctagon size={32} className="text-red-500"/>
                      </div>
                      <h4 className="text-xl font-bold text-red-600">缺页异常 (Page Fault)</h4>
                      <div className="mt-4 bg-red-50 p-3 rounded-xl border border-red-100 text-left">
                        <p className="text-slate-600 text-xs leading-relaxed">
                          <span className="font-bold">原因：</span> 有效位 (Valid Bit) 为 0，表示该页不在物理内存中。
                        </p>
                        <p className="text-slate-600 text-xs leading-relaxed mt-1">
                          <span className="font-bold">处理：</span> OS 暂停进程 -> 启动磁盘 I/O 加载页 -> 更新页表 -> 重新执行指令。
                        </p>
                      </div>
                   </div>
                 )
               ) : (
                 <div className="flex flex-col items-center text-slate-400 text-sm">
                   <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2"><Search size={20}/></div>
                   请输入有效的虚拟地址以开始...
                 </div>
               )}
               
               {/* Background Pattern */}
               <div className="absolute right-[-20px] bottom-[-20px] opacity-5 text-slate-900 pointer-events-none">
                  <Server size={140} />
               </div>
            </div>
         </div>

      </div>
    </div>
  );
};

function CheckCircle({size}: {size: number}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  )
}