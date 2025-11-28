import React, { useState, useEffect } from 'react';
import { PageTableEntry } from '../types';
import { ArrowRight, Search, Server, Cpu, Zap, Binary, AlertOctagon, CheckCircle } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const PAGE_COUNT = 16;

export const PagingView: React.FC = () => {
  const { styles, mode } = useTheme();
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

  const cleanInput = virtualAddrInput.replace(/^0x/, '');
  const parsedAddr = parseInt(cleanInput, 16);
  const isValidHex = !isNaN(parsedAddr) && cleanInput.length <= 4 && cleanInput.length > 0;
  
  const vpn = isValidHex ? (parsedAddr >> 12) & 0xF : 0;
  const offset = isValidHex ? parsedAddr & 0xFFF : 0;
  const pte = pageTable[vpn];
  const physicalAddr = pte && pte.valid ? (pte.frameNumber << 12) | offset : null;

  // Theme Helpers
  const accentColor = mode === 'cute' ? 'pink' : 'blue';
  const vpnColor = mode === 'cute' ? 'violet' : 'indigo';
  const offsetColor = mode === 'cute' ? 'sky' : 'teal';

  return (
    <div className={`flex flex-col h-full p-6 gap-6 overflow-y-auto ${styles.bg}`}>
      
      {/* Top: CPU & Address */}
      <div className="flex gap-6 items-stretch">
         <div className={`${styles.card} p-6 w-full md:w-1/3 flex flex-col`}>
            <h3 className={`flex items-center gap-2 font-bold ${styles.text.primary} mb-4`}>
              <div className={`p-1.5 rounded-lg ${mode === 'cute' ? 'bg-blue-100 text-blue-500' : 'bg-blue-100 text-blue-600'}`}><Cpu size={18}/></div>
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
                className={`w-full pl-10 pr-4 py-3 text-xl font-bold font-mono tracking-widest outline-none transition-all ${styles.input} ${styles.text.primary}`}
                placeholder="FFFF"
              />
            </div>
            <div className={`mt-auto p-3 rounded-xl border ${mode === 'cute' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
               <div className="flex items-center gap-2 font-bold text-xs mb-1">
                 <Zap size={14} fill="currentColor" /> 快表 (TLB) 模拟
               </div>
               <p className="text-[10px] opacity-80 leading-tight">
                 先查 TLB，未命中则查页表。
               </p>
            </div>
         </div>

         {/* Bit Visualization */}
         {isValidHex && (
           <div className={`${styles.card} p-6 flex-1 flex flex-col justify-center`}>
              <h4 className={`text-xs font-bold uppercase mb-6 flex items-center gap-2 ${styles.text.secondary}`}>
                 <Binary size={14}/> 地址结构拆解 (16-bit)
              </h4>
              
              <div className="flex justify-center items-stretch gap-1 h-24">
                {/* VPN */}
                <div 
                  className={`flex flex-col items-center group cursor-help transition-all duration-300 rounded-2xl p-2 ${hoveredSection === 'vpn' ? `bg-${vpnColor}-50 scale-105` : ''}`}
                  onMouseEnter={() => setHoveredSection('vpn')}
                  onMouseLeave={() => setHoveredSection(null)}
                >
                   <div className="flex-1 flex items-end mb-2">
                     <span className="text-[10px] text-slate-400 font-mono mb-1 mr-1">4-bit</span>
                     <div className={`border-2 font-mono font-bold text-3xl px-5 py-2 shadow-sm ${mode === 'cute' ? 'rounded-2xl' : 'rounded-lg'} bg-${vpnColor}-100 border-${vpnColor}-500 text-${vpnColor}-800`}>
                        {cleanInput.padStart(4,'0')[0]}
                     </div>
                   </div>
                   <div className="flex flex-col items-center">
                     <div className={`h-4 w-0.5 bg-${vpnColor}-300 mb-1`}></div>
                     <span className={`text-xs font-bold text-${vpnColor}-600`}>页号 (VPN)</span>
                   </div>
                </div>

                <div className="flex items-center text-slate-300 pb-12 text-2xl font-light mx-4">+</div>

                {/* Offset */}
                <div 
                  className={`flex flex-col items-center group cursor-help transition-all duration-300 rounded-2xl p-2 ${hoveredSection === 'offset' ? `bg-${offsetColor}-50 scale-105` : ''}`}
                  onMouseEnter={() => setHoveredSection('offset')}
                  onMouseLeave={() => setHoveredSection(null)}
                >
                   <div className="flex-1 flex items-end mb-2">
                     <span className="text-[10px] text-slate-400 font-mono mb-1 mr-1">12-bit</span>
                     <div className={`border-2 font-mono font-bold text-3xl px-8 py-2 shadow-sm tracking-widest ${mode === 'cute' ? 'rounded-2xl' : 'rounded-lg'} bg-${offsetColor}-100 border-${offsetColor}-500 text-${offsetColor}-800`}>
                        {cleanInput.padStart(4,'0').substring(1)}
                     </div>
                   </div>
                   <div className="flex flex-col items-center">
                     <div className={`h-4 w-0.5 bg-${offsetColor}-300 mb-1`}></div>
                     <span className={`text-xs font-bold text-${offsetColor}-600`}>页内偏移 (Offset)</span>
                   </div>
                </div>
              </div>
           </div>
         )}
      </div>

      {/* Bottom: Flow */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0">
         
         {/* Page Table */}
         <div className={`md:col-span-5 ${styles.card} flex flex-col overflow-hidden transition-all duration-300 ${hoveredSection === 'vpn' ? `ring-2 ring-${vpnColor}-400 shadow-md` : ''}`}>
            <div className={`p-4 flex justify-between items-center ${styles.cardHeader}`}>
               <h3 className={`font-bold flex items-center gap-2 ${styles.text.primary}`}>
                 <div className={`p-1 rounded ${mode === 'cute' ? `bg-${vpnColor}-100 text-${vpnColor}-500` : `bg-${vpnColor}-100 text-${vpnColor}-600`}`}><Search size={14} /></div>
                 页表查找
               </h3>
               <span className="text-xs font-mono bg-white/50 border border-slate-200 px-2 py-1 rounded-md text-slate-500">VPN: {vpn}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-0 scrollbar-thin">
               <table className="w-full text-sm text-center">
                 <thead className={`sticky top-0 text-xs font-bold uppercase shadow-sm z-10 ${mode === 'cute' ? 'bg-pink-50 text-pink-400' : 'bg-slate-100 text-slate-500'}`}>
                   <tr>
                     <th className="py-2.5">VPN</th>
                     <th className="py-2.5">PFN</th>
                     <th className="py-2.5">Valid</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50 font-mono">
                   {pageTable.map((entry) => {
                     const isActive = isValidHex && entry.pageNumber === vpn;
                     const activeClass = mode === 'cute' ? 'bg-violet-500 text-white' : 'bg-indigo-600 text-white';
                     return (
                       <tr 
                         key={entry.pageNumber} 
                         className={`transition-colors duration-200 ${
                           isActive ? activeClass : 'hover:bg-slate-50 text-slate-600'
                         }`}
                       >
                         <td className="py-2 font-medium">{entry.pageNumber.toString(16).toUpperCase()}</td>
                         <td className={`py-2 font-bold ${isActive ? 'text-white' : styles.text.primary}`}>{entry.frameNumber.toString(16).toUpperCase().padStart(2, '0')}</td>
                         <td className="py-2">
                           {entry.valid 
                             ? <span className={`inline-block px-2 rounded-full text-[10px] ${isActive ? 'bg-white/20' : 'bg-green-100 text-green-600'}`}>1</span> 
                             : <span className={`inline-block px-2 rounded-full text-[10px] ${isActive ? 'bg-white/20' : 'bg-red-100 text-red-500'}`}>0</span>}
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
            </div>
         </div>

         {/* Arrow */}
         <div className="md:col-span-2 flex flex-col items-center justify-center text-slate-300 relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10"></div>
            {isValidHex && pte && pte.valid ? (
               <div className="bg-white p-2 rounded-full shadow-sm border border-slate-100 z-10">
                 <div className="flex flex-col items-center animate-pulse text-green-500">
                   <div className="bg-green-100 rounded-full p-2 mb-1"><ArrowRight size={24} /></div>
                 </div>
               </div>
            ) : (
               <div className="bg-white p-2 rounded-full shadow-sm border border-slate-100 z-10">
                 <div className="flex flex-col items-center text-red-400 opacity-80">
                   <div className="bg-red-50 rounded-full p-2 mb-1"><AlertOctagon size={24} /></div>
                 </div>
               </div>
            )}
         </div>

         {/* Result */}
         <div className="md:col-span-5 flex flex-col gap-4">
            <div className={`${styles.card} p-6 flex-1 flex flex-col justify-center items-center relative overflow-hidden transition-all duration-300 ${hoveredSection === 'offset' ? `ring-2 ring-${offsetColor}-400 shadow-md` : ''}`}>
               <h3 className={`absolute top-4 left-4 font-bold flex items-center gap-2 ${styles.text.primary}`}>
                 <div className={`p-1 rounded ${mode === 'cute' ? 'bg-emerald-100 text-emerald-500' : 'bg-emerald-100 text-emerald-600'}`}><Server size={14} /></div>
                 物理地址 (PA)
               </h3>

               {isValidHex && pte ? (
                 pte.valid ? (
                   <div className="text-center z-10 w-full">
                      <div className="flex items-center justify-center gap-1 mb-8">
                         {/* PFN part */}
                         <div className="flex flex-col">
                            <div className={`text-white font-mono text-2xl font-bold px-4 py-3 shadow-lg border-r border-white/20 ${mode === 'cute' ? 'rounded-l-2xl bg-violet-500' : 'rounded-l-lg bg-indigo-600'}`}>
                               0x{pte.frameNumber.toString(16).toUpperCase().padStart(2,'0')}
                            </div>
                            <span className={`text-xs font-bold mt-2 ${mode === 'cute' ? 'text-violet-500' : 'text-indigo-600'}`}>PFN</span>
                         </div>
                         {/* Offset part */}
                         <div className="flex flex-col">
                            <div className={`text-white font-mono text-2xl font-bold px-4 py-3 shadow-lg ${mode === 'cute' ? 'rounded-r-2xl bg-sky-500' : 'rounded-r-lg bg-teal-500'}`}>
                               {cleanInput.padStart(4,'0').substring(1)}
                            </div>
                            <span className={`text-xs font-bold mt-2 ${mode === 'cute' ? 'text-sky-500' : 'text-teal-600'}`}>Offset</span>
                         </div>
                      </div>

                      <div className={`text-5xl font-mono font-bold tracking-wider drop-shadow-sm ${styles.text.primary}`}>
                         0x{physicalAddr!.toString(16).toUpperCase().padStart(5, '0')}
                      </div>
                      <div className={`mt-4 text-xs font-medium px-4 py-1.5 rounded-full inline-flex items-center gap-1 border ${mode === 'cute' ? 'bg-green-100 text-green-600 border-green-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                        <CheckCircle size={12}/> 地址转换成功
                      </div>
                   </div>
                 ) : (
                   <div className="text-center z-10">
                      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-100 animate-pulse">
                         <AlertOctagon size={32} className="text-red-500"/>
                      </div>
                      <h4 className="text-xl font-bold text-red-600">缺页异常 (Page Fault)</h4>
                   </div>
                 )
               ) : (
                 <div className={`flex flex-col items-center text-sm ${styles.text.secondary}`}>
                   <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2"><Search size={20}/></div>
                   请输入有效的虚拟地址...
                 </div>
               )}
            </div>
         </div>

      </div>
    </div>
  );
};