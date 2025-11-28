import React, { useState } from 'react';
import { Network } from 'lucide-react';

// Simulate a 10-bit address space for understandability
// 3 bits Directory (8 entries) | 3 bits Page Table (8 entries) | 4 bits Offset (16 bytes)
// Virtual Addr max: 0x3FF

const DIR_SIZE = 8;
const TABLE_SIZE = 8;

interface Level2Table {
  id: number;
  entries: { frame: number; valid: boolean }[];
}

export const MultiLevelPagingView: React.FC = () => {
  const [addrInput, setAddrInput] = useState<string>("0x1A5");
  
  // Seed data
  const [dirTable] = useState<{tableId: number | null}[]>(
    Array.from({ length: DIR_SIZE }, (_, i) => ({
      tableId: i % 2 === 0 ? i : null // Every other directory entry is valid and points to a table with ID = index
    }))
  );

  const [level2Tables] = useState<Record<number, Level2Table>>(() => {
    const tables: Record<number, Level2Table> = {};
    for (let i = 0; i < DIR_SIZE; i+=2) {
      tables[i] = {
        id: i,
        entries: Array.from({ length: TABLE_SIZE }, () => ({
          frame: Math.floor(Math.random() * 64),
          valid: Math.random() > 0.2
        }))
      };
    }
    return tables;
  });

  const parsed = parseInt(addrInput, 16);
  const isValid = !isNaN(parsed) && addrInput.startsWith("0x") && parsed <= 0x3FF;

  // 10 bits: [9-7 Dir] [6-4 Table] [3-0 Offset]
  const dirIndex = isValid ? (parsed >> 7) & 0x7 : 0;
  const tableIndex = isValid ? (parsed >> 4) & 0x7 : 0;
  const offset = isValid ? parsed & 0xF : 0;

  const dirEntry = dirTable[dirIndex];
  const l2Table = dirEntry && dirEntry.tableId !== null ? level2Tables[dirEntry.tableId] : null;
  const pageEntry = l2Table ? l2Table.entries[tableIndex] : null;

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 gap-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-2">二级页表 (Two-Level Paging)</h2>
        <p className="text-slate-600 text-sm">
          为了节省页表占用的连续内存，我们将页表分级。
          本例使用 10位地址空间演示：<strong>页目录号(3bit)</strong> -&gt; <strong>二级页表号(3bit)</strong> -&gt; <strong>偏移(4bit)</strong>。
        </p>
      </div>

      <div className="flex justify-center mb-4">
        <div className="bg-slate-800 p-4 rounded-xl shadow-lg flex items-center gap-4">
          <label className="text-white font-semibold">虚拟地址 (Max 0x3FF):</label>
          <input 
            type="text" 
            value={addrInput}
            onChange={(e) => setAddrInput(e.target.value)}
            className="bg-slate-700 text-white font-mono p-2 rounded border border-slate-600 focus:border-blue-500 outline-none uppercase w-24 text-center"
            maxLength={5}
          />
        </div>
      </div>

      {isValid && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 text-center font-mono text-sm mb-6">
           <div className="md:col-start-3 md:col-span-2 bg-purple-100 p-2 rounded border border-purple-200">
             <div className="text-[10px] text-purple-500">页目录索引 (Dir)</div>
             <div className="font-bold text-lg text-purple-800">{dirIndex}</div>
             <div className="text-[10px] text-purple-400">Binary: {dirIndex.toString(2).padStart(3,'0')}</div>
           </div>
           <div className="md:col-span-1 flex items-center justify-center text-slate-300">→</div>
           <div className="md:col-span-2 bg-indigo-100 p-2 rounded border border-indigo-200">
             <div className="text-[10px] text-indigo-500">页表索引 (Page)</div>
             <div className="font-bold text-lg text-indigo-800">{tableIndex}</div>
             <div className="text-[10px] text-indigo-400">Binary: {tableIndex.toString(2).padStart(3,'0')}</div>
           </div>
           <div className="md:col-span-1 flex items-center justify-center text-slate-300">→</div>
           <div className="md:col-span-2 bg-slate-100 p-2 rounded border border-slate-200">
             <div className="text-[10px] text-slate-500">偏移 (Offset)</div>
             <div className="font-bold text-lg text-slate-800">0x{offset.toString(16).toUpperCase()}</div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Level 1: Page Directory */}
        <div className="flex flex-col gap-2">
           <h3 className="font-semibold text-center text-purple-700">1. 页目录 (Page Directory)</h3>
           <div className="bg-white rounded-lg border border-purple-100 shadow-sm overflow-hidden">
             {dirTable.map((entry, idx) => (
               <div 
                key={idx} 
                className={`flex justify-between p-2 text-xs font-mono border-b border-slate-50 
                  ${isValid && dirIndex === idx ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
               >
                 <span>Idx: {idx}</span>
                 <span>{entry.tableId !== null ? `Table #${entry.tableId}` : 'NULL'}</span>
               </div>
             ))}
           </div>
        </div>

        {/* Level 2: Page Table */}
        <div className="flex flex-col gap-2">
           <h3 className="font-semibold text-center text-indigo-700">2. 二级页表 (Page Table)</h3>
           {dirEntry && dirEntry.tableId !== null && l2Table ? (
             <div className="bg-white rounded-lg border border-indigo-100 shadow-sm overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="bg-indigo-50 p-1 text-center text-xs font-bold text-indigo-400 uppercase">
                  Table ID: {l2Table.id}
                </div>
                {l2Table.entries.map((entry, idx) => (
                  <div 
                    key={idx} 
                    className={`flex justify-between p-2 text-xs font-mono border-b border-slate-50
                      ${isValid && tableIndex === idx ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span>Idx: {idx}</span>
                    <span className="flex items-center gap-2">
                      Frame: {entry.frame}
                      <span className={`w-2 h-2 rounded-full ${entry.valid ? 'bg-green-400' : 'bg-red-400'}`}></span>
                    </span>
                  </div>
                ))}
             </div>
           ) : (
             <div className="h-full border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-sm p-8 text-center">
               {isValid ? "页目录项无效 (Page Fault)" : "等待地址解析..."}
             </div>
           )}
        </div>

        {/* Level 3: Result */}
        <div className="flex flex-col gap-2">
           <h3 className="font-semibold text-center text-slate-700">3. 物理地址 (Result)</h3>
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center h-full">
             {pageEntry && pageEntry.valid ? (
               <>
                 <div className="text-4xl font-bold text-green-600 mb-2 font-mono">
                    0x{((pageEntry.frame << 4) | offset).toString(16).toUpperCase()}
                 </div>
                 <div className="text-sm text-slate-500">Frame: {pageEntry.frame} | Offset: {offset}</div>
                 <div className="mt-4 flex items-center text-green-700 bg-green-50 px-3 py-1 rounded-full text-xs font-medium">
                   <Network size={14} className="mr-1"/> 转换成功
                 </div>
               </>
             ) : (
                <div className="text-center text-red-500">
                  <div className="text-xl font-bold mb-1">无法转换</div>
                  <div className="text-sm opacity-75">
                    {!dirEntry || dirEntry.tableId === null ? "无效的目录项" : "无效的页表项 (Page Fault)"}
                  </div>
                </div>
             )}
           </div>
        </div>

      </div>
    </div>
  );
};