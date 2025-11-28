
import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Layers, ArrowRight, LayoutList, Ban, CheckCircle } from 'lucide-react';

// Configuration
const SEGMENT_COUNT = 4;

// Data Structures
interface SegmentEntry {
  id: number;
  basePageTable: number; // Index of the page table array
  length: number; // Max pages
  name: string;
  color: string;
}

interface PageEntry {
  pfn: number;
  valid: boolean;
}

export const SegmentedPagingView: React.FC = () => {
  const { styles, mode } = useTheme();
  
  const [segInput, setSegInput] = useState<number>(0);
  const [offsetInput, setOffsetInput] = useState<string>("00405"); // Representing Page # + Offset

  // Mock Data
  const segments: SegmentEntry[] = [
    { id: 0, name: "Code", basePageTable: 0, length: 5, color: "blue" },
    { id: 1, name: "Data", basePageTable: 1, length: 8, color: "green" },
    { id: 2, name: "Stack", basePageTable: 2, length: 4, color: "purple" },
    { id: 3, name: "Extra", basePageTable: 3, length: 2, color: "amber" },
  ];

  // Mock Page Tables (Array of Arrays)
  // Just generate deterministic random data based on seed
  const getPageTable = (ptIndex: number, size: number): PageEntry[] => {
    const pt: PageEntry[] = [];
    for(let i=0; i<size; i++) {
      pt.push({
        pfn: (ptIndex * 10 + i + 5) % 256,
        valid: true
      });
    }
    return pt;
  };

  // Logic
  const parsedOffset = parseInt(offsetInput, 16);
  const isValidHex = !isNaN(parsedOffset);
  
  // Split Offset into Page Number (VPN) and Page Offset
  // Assuming 12-bit page size (4096), so bottom 3 hex digits are offset
  const vpn = isValidHex ? (parsedOffset >> 12) : 0;
  const pageOffset = isValidHex ? (parsedOffset & 0xFFF) : 0;

  const activeSegment = segments.find(s => s.id === segInput) || segments[0];
  
  // Steps
  const isSegValid = true; // Selector is from fixed list
  const isPageWithinLimit = vpn < activeSegment.length;
  
  const pageTable = getPageTable(activeSegment.basePageTable, activeSegment.length);
  const targetPageEntry = isPageWithinLimit ? pageTable[vpn] : null;
  
  const physicalAddr = targetPageEntry ? ((targetPageEntry.pfn << 12) | pageOffset) : null;

  // Colors
  const segColor = mode === 'cute' ? 'bg-pink-100 text-pink-600 border-pink-200' : 'bg-blue-100 text-blue-700 border-blue-200';
  const pageColor = mode === 'cute' ? 'bg-violet-100 text-violet-600 border-violet-200' : 'bg-indigo-100 text-indigo-700 border-indigo-200';

  return (
    <div className={`flex flex-col h-full p-6 gap-6 overflow-y-auto ${styles.bg}`}>
      
      {/* Address Breakdown */}
      <div className={`${styles.card} p-6`}>
        <h3 className={`font-bold flex items-center gap-2 mb-6 ${styles.text.primary}`}>
          <div className={`p-1.5 rounded-lg ${mode === 'cute' ? 'bg-slate-100' : 'bg-slate-800 text-white'}`}><LayoutList size={18}/></div>
          逻辑地址结构 (Segment + Page + Offset)
        </h3>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
           {/* Segment Selector */}
           <div className="flex flex-col items-center">
             <label className={`text-xs font-bold uppercase mb-2 ${styles.text.secondary}`}>Segment #</label>
             <div className="flex gap-2">
               {segments.map(s => (
                 <button
                   key={s.id}
                   onClick={() => setSegInput(s.id)}
                   className={`w-10 h-10 rounded-xl font-bold transition-all ${
                     segInput === s.id 
                       ? (mode === 'cute' ? 'bg-pink-400 text-white shadow-lg scale-110' : 'bg-slate-800 text-white shadow-lg') 
                       : 'bg-white border hover:bg-slate-50 text-slate-500'
                   }`}
                 >
                   {s.id}
                 </button>
               ))}
             </div>
           </div>
           
           <div className="text-slate-300 text-2xl font-light hidden md:block">|</div>

           {/* Inner Offset Input */}
           <div className="flex flex-col items-center w-full max-w-xs">
              <label className={`text-xs font-bold uppercase mb-2 ${styles.text.secondary}`}>Segment Offset (Hex)</label>
              <div className="relative w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">0x</span>
                <input 
                  type="text"
                  value={offsetInput}
                  onChange={(e) => {
                     if(e.target.value.length <= 5 && /^[0-9a-fA-F]*$/.test(e.target.value)) {
                       setOffsetInput(e.target.value.toUpperCase());
                     }
                  }}
                  className={`w-full pl-8 pr-4 py-3 text-center text-xl font-mono font-bold outline-none ${styles.input} ${styles.text.primary}`}
                />
              </div>
              <div className="flex w-full mt-2 gap-1">
                 <div className={`flex-1 text-center py-1 rounded text-xs font-bold ${pageColor}`}>
                    VPN: {vpn.toString(16).toUpperCase()}
                 </div>
                 <div className={`flex-[2] text-center py-1 rounded text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200`}>
                    Offset: {pageOffset.toString(16).toUpperCase()}
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Main Flow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
         
         {/* Step 1: Segment Table */}
         <div className={`${styles.card} flex flex-col relative`}>
            <div className={`absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm z-20 ${mode === 'cute' ? 'bg-pink-400' : 'bg-slate-800'}`}>
              Step 1: 查段表
            </div>
            <div className="p-6 pt-8 flex-1 overflow-auto">
               <div className="space-y-3">
                 {segments.map(s => {
                   const isActive = s.id === segInput;
                   return (
                     <div key={s.id} className={`p-3 rounded-xl border-2 transition-all ${
                       isActive 
                        ? (mode === 'cute' ? 'bg-pink-50 border-pink-300' : 'bg-blue-50 border-blue-400 shadow-md transform scale-105') 
                        : 'bg-white border-transparent opacity-60'
                     }`}>
                        <div className="flex justify-between items-center mb-2">
                           <span className="font-bold flex items-center gap-2">
                             <Layers size={14}/> {s.name}
                           </span>
                           <span className="text-xs font-mono bg-slate-200 px-1.5 rounded">ID:{s.id}</span>
                        </div>
                        <div className="text-xs space-y-1 text-slate-500">
                          <div className="flex justify-between">
                            <span>Limit (Pages):</span>
                            <span className="font-mono font-bold text-slate-700">{s.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>PT Base:</span>
                            <span className="font-mono font-bold text-slate-700">0x{s.basePageTable}000</span>
                          </div>
                        </div>
                     </div>
                   )
                 })}
               </div>
            </div>
            {/* Connector */}
            <div className="hidden md:flex absolute top-1/2 -right-3 z-10 text-slate-300">
               <ArrowRight size={24} />
            </div>
         </div>

         {/* Step 2: Page Table */}
         <div className={`${styles.card} flex flex-col relative`}>
            <div className={`absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm z-20 ${mode === 'cute' ? 'bg-violet-400' : 'bg-indigo-600'}`}>
              Step 2: 查页表
            </div>
            <div className="p-6 pt-8 flex-1 flex flex-col">
               <div className="mb-4 text-center">
                  <h4 className={`text-sm font-bold ${styles.text.primary}`}>{activeSegment.name} Segment Page Table</h4>
                  <div className="text-[10px] text-slate-400">Located at 0x{activeSegment.basePageTable}000</div>
               </div>
               
               <div className={`flex-1 border rounded-xl overflow-hidden ${mode === 'cute' ? 'border-pink-100 bg-pink-50/30' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="overflow-y-auto h-full p-2 space-y-1">
                     {pageTable.map((pt, idx) => {
                       const isTarget = idx === vpn;
                       return (
                         <div key={idx} className={`flex justify-between items-center p-2 rounded-lg text-sm font-mono ${
                           isTarget 
                             ? (mode === 'cute' ? 'bg-violet-400 text-white shadow-md' : 'bg-indigo-600 text-white') 
                             : 'hover:bg-white text-slate-500'
                         }`}>
                            <span className="w-6 text-center opacity-70">{idx.toString(16).toUpperCase()}</span>
                            <span className="font-bold">PFN: {pt.pfn.toString(16).toUpperCase()}</span>
                         </div>
                       )
                     })}
                     {/* Overflow items viz */}
                     {vpn >= pageTable.length && (
                       <div className="p-2 text-center text-xs text-red-400 font-bold border border-red-200 bg-red-50 rounded-lg mt-2">
                         Segment Limit Exceeded! (Seg Length: {activeSegment.length})
                       </div>
                     )}
                  </div>
               </div>
            </div>
             {/* Connector */}
             <div className="hidden md:flex absolute top-1/2 -right-3 z-10 text-slate-300">
               <ArrowRight size={24} />
            </div>
         </div>

         {/* Step 3: Result */}
         <div className={`${styles.card} flex flex-col justify-center items-center relative overflow-hidden`}>
             <div className={`absolute top-0 left-0 w-full h-1 ${mode === 'cute' ? 'bg-gradient-to-r from-pink-400 to-violet-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}></div>
             
             <h3 className={`font-bold mb-6 flex items-center gap-2 ${styles.text.primary}`}>
               <CheckCircle size={18} /> 物理地址计算
             </h3>

             {isPageWithinLimit && physicalAddr !== null ? (
               <div className="text-center animate-in zoom-in duration-300">
                  <div className={`text-4xl font-mono font-black tracking-wider mb-2 ${mode === 'cute' ? 'text-teal-500' : 'text-emerald-600'}`}>
                    0x{physicalAddr.toString(16).toUpperCase().padStart(5, '0')}
                  </div>
                  <div className="flex justify-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-slate-100 rounded text-slate-500">
                      PFN: {targetPageEntry!.pfn.toString(16).toUpperCase()}
                    </span>
                    <span className="px-2 py-1 bg-slate-100 rounded text-slate-500">
                      Offset: {pageOffset.toString(16).toUpperCase()}
                    </span>
                  </div>
               </div>
             ) : (
               <div className="text-center">
                 <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                   <Ban size={32} className="text-red-400"/>
                 </div>
                 <div className="text-red-500 font-bold">Segmentation Fault</div>
                 <div className="text-xs text-red-400 mt-1">Access beyond segment limit</div>
               </div>
             )}
         </div>

      </div>
    </div>
  );
};
