import React, { useState, useMemo } from 'react';
import { Segment } from '../types';
import { MemoryBlock } from './MemoryBlock';
import { ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';

const INITIAL_SEGMENTS: Segment[] = [
  { id: 0, name: 'Code (代码段)', base: 2000, limit: 500, color: 'bg-emerald-100' },
  { id: 1, name: 'Data (数据段)', base: 5000, limit: 200, color: 'bg-amber-100' },
  { id: 2, name: 'Stack (栈段)', base: 8000, limit: 1000, color: 'bg-purple-100' },
  { id: 3, name: 'Extra (附加段)', base: 3500, limit: 100, color: 'bg-cyan-100' },
];

export const SegmentationView: React.FC = () => {
  const [segments] = useState<Segment[]>(INITIAL_SEGMENTS);
  const [selectedSegId, setSelectedSegId] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);

  const currentSegment = segments.find(s => s.id === selectedSegId) || segments[0];
  const isFault = offset >= currentSegment.limit;
  const physicalAddress = currentSegment.base + offset;

  // Generate visualization memory map (simplified)
  const memoryMap = useMemo(() => {
    // Just showing relevant chunks
    return segments.map(seg => ({
        ...seg,
        displayBase: seg.base,
        displayEnd: seg.base + seg.limit
    })).sort((a, b) => a.base - b.base);
  }, [segments]);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 gap-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-2">段式存储 (Segmentation)</h2>
        <p className="text-slate-600 text-sm">
          逻辑地址由 <strong>段号 (Segment Selector)</strong> 和 <strong>段内偏移 (Offset)</strong> 组成。
          物理地址 = 基址 (Base) + 偏移 (Offset)。若偏移量 >= 段界限 (Limit)，则触发段错误。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              1. 生成逻辑地址
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">段选择 (Segment)</label>
                <select 
                  value={selectedSegId}
                  onChange={(e) => {
                    setSelectedSegId(Number(e.target.value));
                    setOffset(0);
                  }}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {segments.map(s => (
                    <option key={s.id} value={s.id}>段 {s.id}: {s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  段内偏移 (Offset): <span className="font-mono text-blue-600">{offset}</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max={currentSegment.limit + 200} // Allow going over limit to show fault
                  value={offset}
                  onChange={(e) => setOffset(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>0</span>
                  <span>Limit: {currentSegment.limit}</span>
                  <span>Max</span>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200 font-mono text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-slate-500">逻辑地址:</span>
                <span className="font-bold text-slate-800">
                  {selectedSegId} : {offset}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
             <h3 className="font-semibold text-slate-700 mb-4">段表 (Segment Table)</h3>
             <div className="overflow-hidden rounded-lg border border-slate-200">
               <table className="w-full text-sm text-left">
                 <thead className="bg-slate-100 text-slate-600">
                   <tr>
                     <th className="p-2">段号</th>
                     <th className="p-2">基址 (Base)</th>
                     <th className="p-2">界限 (Limit)</th>
                   </tr>
                 </thead>
                 <tbody>
                   {segments.map(s => (
                     <tr 
                      key={s.id} 
                      className={`border-t border-slate-100 ${selectedSegId === s.id ? 'bg-blue-50' : ''}`}
                    >
                       <td className="p-2 font-mono">{s.id}</td>
                       <td className="p-2 font-mono">{s.base}</td>
                       <td className="p-2 font-mono">{s.limit}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>

        {/* Translation Logic */}
        <div className="lg:col-span-4 flex flex-col justify-center items-center space-y-4">
          <div className="p-6 bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-sm relative">
             <h4 className="text-center font-bold text-slate-700 mb-4 border-b pb-2">地址转换单元 (MMU)</h4>
             
             <div className="space-y-3 font-mono text-sm">
                <div className="flex justify-between items-center">
                  <span>Offset ({offset})</span>
                  <span className="text-slate-400">&lt;</span>
                  <span>Limit ({currentSegment.limit})</span>
                </div>
                
                <div className={`flex items-center justify-center p-2 rounded ${isFault ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {isFault ? (
                    <><AlertTriangle size={16} className="mr-2"/> 段越界错误 (Trap)</>
                  ) : (
                    <><CheckCircle size={16} className="mr-2"/> 合法访问</>
                  )}
                </div>

                {!isFault && (
                  <div className="pt-2 border-t border-slate-100 mt-2">
                    <div className="flex justify-between">
                       <span>Base:</span>
                       <span>{currentSegment.base}</span>
                    </div>
                    <div className="flex justify-between">
                       <span>+ Offset:</span>
                       <span>{offset}</span>
                    </div>
                    <div className="flex justify-between font-bold text-blue-600 border-t border-dashed border-slate-300 pt-1 mt-1">
                       <span>物理地址:</span>
                       <span>{physicalAddress}</span>
                    </div>
                  </div>
                )}
             </div>
             
             <div className="absolute top-1/2 -right-3 transform -translate-y-1/2 hidden lg:block">
                <ArrowRight className="text-slate-300" size={32} />
             </div>
          </div>
        </div>

        {/* Physical Memory */}
        <div className="lg:col-span-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 h-[600px] flex flex-col">
            <h3 className="font-semibold text-slate-700 mb-4">物理内存 (Physical Memory)</h3>
            <div className="flex-1 overflow-y-auto pr-2 relative border border-slate-100 rounded-lg bg-slate-50 p-2">
              {/* Visualizing "chunks" of memory to represent the sparse nature effectively */}
              {memoryMap.map((block) => (
                <div key={block.id} className="mb-4">
                  <div className="text-xs text-slate-400 font-mono mb-1">Address: {block.base}</div>
                  <div 
                    className={`w-full rounded-md border shadow-sm p-2 transition-all relative
                      ${block.color} 
                      ${block.id === selectedSegId ? 'ring-2 ring-blue-500 ring-offset-2' : 'opacity-60'}
                    `}
                    style={{ height: '80px' }} // Fixed height for visualization simplicity
                  >
                    <div className="font-bold text-slate-800 text-sm">{block.name}</div>
                    <div className="text-xs text-slate-600 mt-1">
                      Range: {block.base} - {block.base + block.limit}
                    </div>

                    {/* The specific address pointer */}
                    {!isFault && block.id === selectedSegId && (
                      <div 
                        className="absolute left-0 right-0 h-1 bg-red-500 z-10"
                        style={{ top: `${(offset / block.limit) * 100}%` }} // Approximate position
                      >
                        <div className="absolute right-0 -top-6 bg-red-600 text-white text-[10px] px-1 rounded shadow">
                          PTR: {physicalAddress}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="mt-8 text-center text-xs text-slate-400">
                ... 其他内存空间 ...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};