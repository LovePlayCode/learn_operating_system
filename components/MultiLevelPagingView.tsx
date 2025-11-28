import React, { useState } from 'react';
import { ArrowRight, CornerDownRight, Layers, MapPin, Ban, Spline, LayoutGrid } from 'lucide-react';

const DIR_SIZE = 8;
const TABLE_SIZE = 8;

interface Level2Table {
  id: number;
  entries: { frame: number; valid: boolean }[];
}

export const MultiLevelPagingView: React.FC = () => {
  const [addrInput, setAddrInput] = useState<string>("1A5");
  
  // Seed data
  const [dirTable] = useState<{tableId: number | null}[]>(
    Array.from({ length: DIR_SIZE }, (_, i) => ({
      tableId: i % 2 === 0 ? i : null 
    }))
  );

  const [level2Tables] = useState<Record<number, Level2Table>>(() => {
    const tables: Record<number, Level2Table> = {};
    for (let i = 0; i < DIR_SIZE; i+=2) {
      tables[i] = {
        id: i,
        entries: Array.from({ length: TABLE_SIZE }, () => ({
          frame: Math.floor(Math.random() * 64),
          valid: Math.random() > 0.3
        }))
      };
    }
    return tables;
  });

  const parsed = parseInt(addrInput, 16);
  const isValid = !isNaN(parsed) && addrInput.length <= 3 && /^[0-9a-fA-F]*$/.test(addrInput);

  // 10 bits simulation for demo clarity: [3 bits Dir] [3 bits Table] [4 bits Offset]
  const dirIndex = isValid ? (parsed >> 7) & 0x7 : 0;
  const tableIndex = isValid ? (parsed >> 4) & 0x7 : 0;
  const offset = isValid ? parsed & 0xF : 0;

  const dirEntry = dirTable[dirIndex];
  const l2Table = dirEntry && dirEntry.tableId !== null ? level2Tables[dirEntry.tableId] : null;
  const pageEntry = l2Table ? l2Table.entries[tableIndex] : null;

  return (
    <div className="flex flex-col h-full p-6 gap-6 overflow-y-auto bg-slate-50/50">
      
      {/* Input Section */}
      <div className="flex flex-col items-center gap-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-6">
          <div className="text-right">
             <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Virtual Address</div>
             <div className="text-[10px] text-slate-400">Max 0x3FF (10-bit)</div>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">0x</span>
            <input 
              type="text" 
              value={addrInput}
              onChange={(e) => {
                 if (e.target.value.length <= 3 && /^[0-9a-fA-F]*$/.test(e.target.value)) {
                    setAddrInput(e.target.value.toUpperCase());
                 }
              }}
              className="w-36 pl-9 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-mono text-2xl font-bold text-slate-700 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none uppercase text-center transition-all"
              placeholder="000"
            />
          </div>
        </div>

        {/* Bit Breakdown */}
        {isValid && (
          <div className="flex justify-center gap-3 font-mono text-center">
             {/* Dir */}
             <div className="flex flex-col items-center group">
               <div className="bg-purple-50 border-2 border-purple-200 text-purple-700 px-4 py-2 rounded-xl font-bold text-lg shadow-sm w-24 group-hover:-translate-y-1 transition-transform">
                 {dirIndex.toString(2).padStart(3,'0')}
               </div>
               <div className="h-3 w-0.5 bg-purple-300"></div>
               <div className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">页目录号</div>
               <span className="text-[10px] text-purple-400 mt-1">Index: {dirIndex}</span>
             </div>
             
             {/* Table */}
             <div className="flex flex-col items-center group">
               <div className="bg-indigo-50 border-2 border-indigo-200 text-indigo-700 px-4 py-2 rounded-xl font-bold text-lg shadow-sm w-24 group-hover:-translate-y-1 transition-transform">
                 {tableIndex.toString(2).padStart(3,'0')}
               </div>
               <div className="h-3 w-0.5 bg-indigo-300"></div>
               <div className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">页表索引</div>
               <span className="text-[10px] text-indigo-400 mt-1">Index: {tableIndex}</span>
             </div>

             {/* Offset */}
             <div className="flex flex-col items-center group">
               <div className="bg-slate-50 border-2 border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-lg shadow-sm w-28 group-hover:-translate-y-1 transition-transform">
                 {offset.toString(2).padStart(4,'0')}
               </div>
               <div className="h-3 w-0.5 bg-slate-300"></div>
               <div className="bg-slate-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">页内偏移</div>
               <span className="text-[10px] text-slate-400 mt-1">HEX: {offset.toString(16).toUpperCase()}</span>
             </div>
          </div>
        )}
      </div>

      {/* Main Hierarchical View */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0 items-start">
        
        {/* Level 1: Directory */}
        <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden h-full max-h-[500px]">
           <div className="bg-purple-50/80 p-4 border-b border-purple-100 backdrop-blur-sm sticky top-0 z-10">
             <h3 className="font-bold text-purple-900 flex items-center gap-2">
               <div className="bg-purple-200 p-1.5 rounded-lg text-purple-700"><Spline size={16} /></div>
               1级: 页目录 (PDBR)
             </h3>
             <p className="text-[10px] text-purple-600 mt-1 ml-9">由于页表太大，我们先查“目录”找到对应的页表。</p>
           </div>
           <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-purple-100">
             {dirTable.map((entry, idx) => {
               const isActive = isValid && dirIndex === idx;
               return (
                 <div key={idx} className={`flex items-center justify-between p-3 rounded-xl text-sm font-mono transition-all duration-200
                   ${isActive ? 'bg-purple-600 text-white shadow-lg scale-[1.02] border-l-4 border-purple-300' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}
                 `}>
                   <div className="flex items-center gap-3">
                     <span className={`text-[10px] w-6 h-6 flex items-center justify-center rounded-full ${isActive ? 'bg-purple-500 text-purple-100' : 'bg-slate-100'}`}>
                       {idx}
                     </span>
                     <span className="font-semibold">{entry.tableId !== null ? `Table #${entry.tableId}` : 'NULL'}</span>
                   </div>
                   {isActive && <ArrowRight size={16} className="animate-pulse" />}
                 </div>
               )
             })}
           </div>
        </div>

        {/* Level 2: Page Table */}
        <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden h-full max-h-[500px] relative">
           <div className="bg-indigo-50/80 p-4 border-b border-indigo-100 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-start">
             <div>
               <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                 <div className="bg-indigo-200 p-1.5 rounded-lg text-indigo-700"><LayoutGrid size={16} /></div>
                 2级: 页表 (Page Table)
               </h3>
             </div>
             {dirEntry && dirEntry.tableId !== null && (
               <span className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded-md font-bold shadow-sm">
                 Table ID: {dirEntry.tableId}
               </span>
             )}
           </div>

           <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-indigo-100">
             {dirEntry && dirEntry.tableId !== null && l2Table ? (
               l2Table.entries.map((entry, idx) => {
                 const isActive = isValid && tableIndex === idx;
                 return (
                   <div key={idx} className={`flex items-center justify-between p-3 rounded-xl text-sm font-mono transition-all duration-200
                     ${isActive ? 'bg-indigo-600 text-white shadow-lg scale-[1.02] border-l-4 border-indigo-300' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}
                   `}>
                     <div className="flex items-center gap-3">
                       <span className={`text-[10px] w-6 h-6 flex items-center justify-center rounded-full ${isActive ? 'bg-indigo-500 text-indigo-100' : 'bg-slate-100'}`}>
                         {idx}
                       </span>
                       <div className="flex flex-col">
                         <span className="font-bold text-xs">PFN: {entry.frame.toString(16).toUpperCase().padStart(2,'0')}</span>
                       </div>
                     </div>
                     <div className="flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${entry.valid ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                       {isActive && <ArrowRight size={16} className="animate-pulse" />}
                     </div>
                   </div>
                 )
               })
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-300 p-8 text-center space-y-3">
                 <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                   <Ban size={32} className="text-slate-400"/>
                 </div>
                 <p className="text-sm font-medium">一级目录指向空<br/>(Page Fault)</p>
               </div>
             )}
           </div>
        </div>

        {/* Result: Physical Address */}
        <div className="flex flex-col justify-center h-full">
           <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>
              
              <div className="bg-slate-50 p-3 rounded-full mb-6 text-slate-400 border border-slate-100">
                <MapPin size={24} />
              </div>
              
              <h3 className="text-center text-slate-500 font-bold mb-6 text-sm uppercase tracking-widest">
                最终物理地址
              </h3>

              {isValid && pageEntry && pageEntry.valid ? (
                <div className="text-center animate-in zoom-in duration-300 w-full">
                  <div className="inline-flex flex-col items-center w-full">
                    
                    <div className="flex items-stretch text-3xl font-mono font-bold text-slate-800 border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-6 max-w-[240px]">
                      <div className="bg-indigo-50 px-4 py-3 text-indigo-700 border-r border-indigo-100 flex flex-col items-center">
                         <span>0x{pageEntry.frame.toString(16).toUpperCase().padStart(2,'0')}</span>
                         <span className="text-[9px] text-indigo-400 font-sans font-normal mt-1 uppercase">Frame</span>
                      </div>
                      <div className="bg-slate-50 px-4 py-3 text-slate-600 flex flex-col items-center">
                         <span>0x{offset.toString(16).toUpperCase()}</span>
                         <span className="text-[9px] text-slate-400 font-sans font-normal mt-1 uppercase">Offset</span>
                      </div>
                    </div>
                    
                    <div className="bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl shadow-blue-900/20 w-full max-w-[240px]">
                      <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Physical Address</div>
                      <div className="text-3xl font-black tracking-wider font-mono bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-indigo-200">
                        0x{((pageEntry.frame << 4) | offset).toString(16).toUpperCase()}
                      </div>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="text-center py-4 opacity-50">
                   <div className="text-6xl mb-4 font-thin text-slate-200">...</div>
                   <p className="font-medium text-slate-400 text-sm">
                     {!isValid ? "输入无效" : "等待地址解析..."}
                   </p>
                </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
};