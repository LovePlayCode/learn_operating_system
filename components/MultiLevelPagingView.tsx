import React, { useState, useMemo } from 'react';
import { ArrowRight, Spline, LayoutGrid, MapPin, Ban, Layers, ListTree, Grid3X3 } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

// 2-Level Constants
// Addr (10 bits): Dir(3) | Table(3) | Offset(4)
const L1_SIZE_2 = 8;
const L2_SIZE_2 = 8;

// 3-Level Constants
// Addr (12 bits): L1(2) | L2(3) | L3(3) | Offset(4)
const L1_SIZE_3 = 4;
const L2_SIZE_3 = 8;
const L3_SIZE_3 = 8;

interface TableEntry {
  nextId: number | null; // For intermediate levels
  frame: number | null;  // For leaf levels
  valid: boolean;
}

interface TableData {
  id: number;
  entries: TableEntry[];
}

export const MultiLevelPagingView: React.FC = () => {
  const { styles, mode } = useTheme();
  const [levelMode, setLevelMode] = useState<2 | 3>(2);
  const [addrInput, setAddrInput] = useState<string>("1A5");

  // Generate Data based on Mode
  const { l1Table, intermediateTables, leafTables } = useMemo(() => {
    // Helper to create random tables
    const createTable = (size: number, isLeaf: boolean): TableData => ({
      id: Math.floor(Math.random() * 1000),
      entries: Array.from({ length: size }, (_, i) => ({
        nextId: isLeaf ? null : (Math.random() > 0.4 ? i * 10 : null),
        frame: isLeaf ? (Math.random() > 0.3 ? Math.floor(Math.random() * 256) : null) : null,
        valid: Math.random() > 0.3
      }))
    });

    if (levelMode === 2) {
      // 2-Level: L1(Dir) -> L2(Leaf)
      const l1 = createTable(L1_SIZE_2, false);
      // Ensure some valid paths
      l1.entries.forEach((e, i) => { 
        if(i % 2 === 0) e.nextId = 100 + i; 
        else e.nextId = null;
      });

      const leaves: Record<number, TableData> = {};
      l1.entries.forEach(e => {
        if (e.nextId !== null) {
          leaves[e.nextId] = createTable(L2_SIZE_2, true);
        }
      });

      return { l1Table: l1, intermediateTables: {}, leafTables: leaves };
    } else {
      // 3-Level: L1 -> L2 -> L3(Leaf)
      const l1 = createTable(L1_SIZE_3, false);
      const inter: Record<number, TableData> = {};
      const leaves: Record<number, TableData> = {};

      // Build tree
      l1.entries.forEach((e1, i) => {
        if (Math.random() > 0.2) {
          e1.nextId = 100 + i;
          const l2 = createTable(L2_SIZE_3, false);
          inter[e1.nextId] = l2;
          
          l2.entries.forEach((e2, j) => {
            if (Math.random() > 0.3) {
              e2.nextId = e1.nextId! * 10 + j;
              leaves[e2.nextId] = createTable(L3_SIZE_3, true);
            } else {
              e2.nextId = null;
            }
          });
        } else {
          e1.nextId = null;
        }
      });

      return { l1Table: l1, intermediateTables: inter, leafTables: leaves };
    }
  }, [levelMode]);

  // Parse Address
  const parsed = parseInt(addrInput, 16);
  const isValid = !isNaN(parsed) && /^[0-9a-fA-F]*$/.test(addrInput);
  
  let idx1 = 0, idx2 = 0, idx3 = 0, offset = 0;
  let maxAddr = 0;

  if (levelMode === 2) {
    // 10 bits: 3 | 3 | 4
    maxAddr = 0x3FF;
    offset = parsed & 0xF;
    idx2 = (parsed >> 4) & 0x7;
    idx1 = (parsed >> 7) & 0x7;
  } else {
    // 12 bits: 2 | 3 | 3 | 4
    maxAddr = 0xFFF;
    offset = parsed & 0xF;
    idx3 = (parsed >> 4) & 0x7;
    idx2 = (parsed >> 7) & 0x7;
    idx1 = (parsed >> 10) & 0x3;
  }

  const isInputInRange = isValid && parsed <= maxAddr;

  // Traversal
  const entry1 = isInputInRange ? l1Table.entries[idx1] : null;
  
  const table2 = entry1?.nextId != null 
    ? (levelMode === 2 ? leafTables[entry1.nextId] : intermediateTables[entry1.nextId]) 
    : null;
  const entry2 = table2 ? table2.entries[idx2] : null;

  const table3 = (levelMode === 3 && entry2?.nextId != null) ? leafTables[entry2.nextId] : null;
  const entry3 = table3 ? table3.entries[idx3] : null;

  const finalEntry = levelMode === 2 ? entry2 : entry3;
  const isFinalValid = finalEntry?.frame != null && finalEntry?.valid;

  // Colors
  const c1 = 'purple';
  const c2 = 'indigo';
  const c3 = 'sky';
  const cOff = 'slate';

  return (
    <div className={`flex flex-col h-full p-6 gap-6 overflow-y-auto ${styles.bg}`}>
      
      {/* Controls & Input */}
      <div className="flex flex-col items-center gap-6">
        
        {/* Mode Toggle */}
        <div className={`flex p-1 rounded-xl border ${mode === 'cute' ? 'bg-white border-pink-100' : 'bg-slate-200 border-slate-300'}`}>
          <button 
            onClick={() => setLevelMode(2)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              levelMode === 2 
                ? (mode === 'cute' ? 'bg-pink-400 text-white shadow-md' : 'bg-white text-slate-800 shadow-sm') 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Layers size={16}/> 2级页表
          </button>
          <button 
            onClick={() => setLevelMode(3)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              levelMode === 3
                ? (mode === 'cute' ? 'bg-pink-400 text-white shadow-md' : 'bg-white text-slate-800 shadow-sm') 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ListTree size={16}/> 3级页表
          </button>
        </div>

        <div className={`${styles.card} p-4 flex items-center gap-6`}>
          <div className="text-right">
             <div className={`text-xs font-bold uppercase tracking-wide ${styles.text.secondary}`}>Virtual Address</div>
             <div className="text-[10px] text-slate-400">Max 0x{maxAddr.toString(16).toUpperCase()} ({levelMode === 2 ? '10-bit' : '12-bit'})</div>
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
              className={`w-36 pl-9 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 text-2xl font-bold font-mono outline-none uppercase text-center transition-all ${
                mode === 'cute' ? 'rounded-full focus:border-purple-300' : 'rounded-xl focus:border-purple-500'
              } ${styles.text.primary} ${!isInputInRange ? 'text-red-400 line-through' : ''}`}
              placeholder="000"
            />
          </div>
        </div>

        {/* Bit Breakdown */}
        {isInputInRange && (
          <div className="flex justify-center gap-2 font-mono text-center">
             {/* L1 */}
             <AddressBlock 
                val={idx1} bits={levelMode === 2 ? 3 : 2} label={levelMode === 2 ? "页目录" : "L1 指针"} 
                color={c1} mode={mode} 
             />
             
             {/* L2 */}
             <AddressBlock 
                val={idx2} bits={3} label={levelMode === 2 ? "页表" : "L2 页目录"} 
                color={c2} mode={mode} 
             />

             {/* L3 (Only in 3-level) */}
             {levelMode === 3 && (
               <AddressBlock 
                  val={idx3} bits={3} label="L3 页表" 
                  color={c3} mode={mode} 
               />
             )}

             {/* Offset */}
             <AddressBlock 
                val={offset} bits={4} label="页内偏移" 
                color={cOff} mode={mode} 
             />
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className={`flex-1 grid grid-cols-1 md:grid-cols-${levelMode === 2 ? '3' : '4'} gap-4 min-h-0 items-start`}>
        
        {/* L1 Table */}
        <TableColumn 
           title={levelMode === 2 ? "1级: 页目录" : "1级: PDPT"}
           icon={<Spline size={16}/>}
           entries={l1Table.entries}
           highlightIdx={isInputInRange ? idx1 : -1}
           color={c1}
           mode={mode}
           isLeaf={false}
        />

        {/* L2 Table */}
        <TableColumn 
           title={levelMode === 2 ? "2级: 页表" : "2级: 页目录"}
           icon={<LayoutGrid size={16}/>}
           entries={table2?.entries}
           highlightIdx={isInputInRange && table2 ? idx2 : -1}
           parentId={entry1?.nextId}
           color={c2}
           mode={mode}
           isLeaf={levelMode === 2}
        />

        {/* L3 Table (Conditional) */}
        {levelMode === 3 && (
          <TableColumn 
             title="3级: 页表"
             icon={<Grid3X3 size={16}/>}
             entries={table3?.entries}
             highlightIdx={isInputInRange && table3 ? idx3 : -1}
             parentId={entry2?.nextId}
             color={c3}
             mode={mode}
             isLeaf={true}
          />
        )}

        {/* Result Column */}
        <div className="flex flex-col justify-center h-full">
           <div className={`${styles.card} p-6 relative overflow-hidden flex flex-col items-center justify-center h-full max-h-[500px]`}>
              <div className={`absolute top-0 left-0 w-full h-1 ${mode === 'cute' ? 'bg-gradient-to-r from-purple-300 via-sky-300 to-teal-300' : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600'}`}></div>
              
              <div className="bg-slate-50 p-3 rounded-full mb-6 text-slate-400 border border-slate-100 animate-in zoom-in duration-300">
                <MapPin size={24} />
              </div>
              
              <h3 className="text-center text-slate-500 font-bold mb-6 text-sm uppercase tracking-widest">
                物理地址
              </h3>

              {isInputInRange && isFinalValid ? (
                <div className="text-center w-full animate-in slide-in-from-bottom-4 duration-500">
                    <div className={`flex items-stretch text-2xl font-mono font-bold text-slate-800 border-2 overflow-hidden shadow-sm mb-6 max-w-[240px] mx-auto ${mode === 'cute' ? 'rounded-2xl border-indigo-100' : 'rounded-xl border-slate-200'}`}>
                      <div className={`px-4 py-3 flex flex-col items-center border-r ${mode === 'cute' ? 'bg-indigo-50 text-indigo-500 border-indigo-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                         <span>0x{finalEntry!.frame!.toString(16).toUpperCase().padStart(2,'0')}</span>
                         <span className="text-[9px] font-sans font-normal mt-1 uppercase opacity-50">Frame</span>
                      </div>
                      <div className="bg-white px-4 py-3 text-slate-600 flex flex-col items-center">
                         <span>0x{offset.toString(16).toUpperCase()}</span>
                         <span className="text-[9px] font-sans font-normal mt-1 uppercase opacity-50">Offset</span>
                      </div>
                    </div>
                    
                    <div className={`px-6 py-4 shadow-xl mx-auto w-full max-w-[240px] transition-transform hover:scale-105 ${mode === 'cute' ? 'bg-indigo-400 rounded-3xl shadow-indigo-200' : 'bg-slate-800 rounded-2xl shadow-slate-900/20'}`}>
                      <div className="text-[10px] text-white/60 uppercase tracking-widest mb-1">Physical Address</div>
                      <div className="text-3xl font-black tracking-wider font-mono text-white">
                        0x{((finalEntry!.frame! << 4) | offset).toString(16).toUpperCase()}
                      </div>
                    </div>
                </div>
              ) : (
                <div className="text-center py-4 opacity-50">
                   {isInputInRange ? (
                     <>
                        <div className="w-16 h-16 bg-red-50 text-red-300 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Ban size={32}/>
                        </div>
                        <p className="font-bold text-red-400 text-sm">无效映射 / 缺页</p>
                     </>
                   ) : (
                     <>
                       <div className="text-6xl mb-4 font-thin text-slate-200">...</div>
                       <p className="font-medium text-slate-400 text-sm">等待输入...</p>
                     </>
                   )}
                </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
};

// Sub-components for cleaner render
const AddressBlock = ({ val, bits, label, color, mode }: any) => (
  <div className="flex flex-col items-center group">
    <div className={`border-2 px-2 py-2 font-bold text-lg shadow-sm w-20 group-hover:-translate-y-1 transition-transform bg-${color}-50 border-${color}-200 text-${color}-700 ${mode === 'cute' ? 'rounded-2xl' : 'rounded-xl'}`}>
      {val.toString(2).padStart(bits,'0')}
    </div>
    <div className={`h-3 w-0.5 bg-${color}-300`}></div>
    <div className={`bg-${color}-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap`}>{label}</div>
  </div>
);

const TableColumn = ({ title, icon, entries, highlightIdx, parentId, color, mode, isLeaf }: any) => {
  const { styles } = useTheme();
  
  return (
    <div className={`${styles.card} flex flex-col overflow-hidden h-full max-h-[500px] relative transition-all`}>
      <div className={`p-4 border-b z-10 sticky top-0 flex justify-between items-start ${mode === 'cute' ? `bg-${color}-50 border-${color}-100` : `bg-${color}-50/80 border-${color}-100`}`}>
        <h3 className={`font-bold flex items-center gap-2 ${mode === 'cute' ? `text-${color}-600` : `text-${color}-900`}`}>
          <div className={`p-1.5 rounded-lg bg-${color}-200 text-${color}-700`}>{icon}</div>
          {title}
        </h3>
        {parentId != null && (
          <span className={`text-[10px] text-white px-2 py-1 rounded-full font-bold shadow-sm ${mode === 'cute' ? `bg-${color}-400` : `bg-${color}-600`}`}>
            ID: {parentId}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {entries ? (
          entries.map((entry: TableEntry, idx: number) => {
            const isActive = idx === highlightIdx;
            // Style logic
            let bgClass = 'hover:bg-slate-50 text-slate-500 border border-transparent';
            if (isActive) {
              bgClass = mode === 'cute' 
                ? `bg-${color}-400 text-white shadow-md border-${color}-300`
                : `bg-${color}-600 text-white shadow-lg border-l-4 border-${color}-300`;
            }

            return (
              <div key={idx} className={`flex items-center justify-between p-2.5 text-sm font-mono transition-all duration-200 ${mode === 'cute' ? 'rounded-xl' : 'rounded-lg'} ${bgClass}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] w-5 h-5 flex items-center justify-center rounded-full ${isActive ? 'bg-white/30 text-white' : 'bg-slate-100'}`}>
                    {idx}
                  </span>
                  {isLeaf ? (
                    <span className="font-bold text-xs">
                      {entry.valid && entry.frame != null ? `PFN:${entry.frame.toString(16).toUpperCase()}` : 'INVALID'}
                    </span>
                  ) : (
                    <span className="font-semibold text-xs">
                       {entry.nextId != null ? `TBL#${entry.nextId}` : 'NULL'}
                    </span>
                  )}
                </div>
                {isActive && <ArrowRight size={14} className="animate-pulse" />}
                {isLeaf && (
                   <div className={`w-2 h-2 rounded-full ${entry.valid && entry.frame != null ? 'bg-emerald-400' : 'bg-red-300'}`}></div>
                )}
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 p-8 text-center space-y-3">
            <Ban size={24} className="text-slate-300"/>
            <p className="text-xs font-medium">无索引 / 空表</p>
          </div>
        )}
      </div>
    </div>
  );
};
