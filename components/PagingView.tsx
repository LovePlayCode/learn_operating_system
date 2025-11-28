import React, { useState, useEffect } from 'react';
import { PageTableEntry } from '../types';
import { ArrowDown, Database, Cpu } from 'lucide-react';

const PAGE_SIZE = 4096; // 4KB
const PAGE_COUNT = 16;  // Small for visualization

export const PagingView: React.FC = () => {
  // Virtual Address is 16 bit: 4 bit VPN, 12 bit Offset for demo simplicity (though UI shows Hex)
  const [virtualAddrInput, setVirtualAddrInput] = useState<string>("0x3050");
  const [pageTable, setPageTable] = useState<PageTableEntry[]>([]);
  
  // Initialize Page Table on mount
  useEffect(() => {
    const pt: PageTableEntry[] = [];
    for (let i = 0; i < PAGE_COUNT; i++) {
      pt.push({
        pageNumber: i,
        frameNumber: Math.floor(Math.random() * 256), // Random frame
        valid: Math.random() > 0.3 // 70% valid chance
      });
    }
    setPageTable(pt);
  }, []);

  // Parse input
  const parsedAddr = parseInt(virtualAddrInput, 16);
  const isValidHex = !isNaN(parsedAddr) && virtualAddrInput.startsWith("0x");
  
  // Calculate VPN and Offset
  // Assuming 16-bit address space for visualization: [VPN: 4 bits][Offset: 12 bits]
  // VPN = Addr >> 12
  // Offset = Addr & 0xFFF
  const vpn = isValidHex ? (parsedAddr >> 12) & 0xF : 0;
  const offset = isValidHex ? parsedAddr & 0xFFF : 0;
  
  const pte = pageTable[vpn];
  const physicalAddr = pte && pte.valid ? (pte.frameNumber << 12) | offset : null;

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 gap-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-2">页式存储 (Paging)</h2>
        <p className="text-slate-600 text-sm">
          虚拟地址被分为 <strong>虚拟页号 (VPN)</strong> 和 <strong>页内偏移 (Offset)</strong>。
          系统通过查页表将 VPN 映射为物理页框号 (PFN)。物理地址 = PFN * 页大小 + Offset。
          本示例假设页大小为 4KB (0x1000)，虚拟地址空间为 16位。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Step 1: Virtual Address */}
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
             <div className="flex items-center gap-2 mb-2 text-blue-800 font-semibold">
               <Cpu size={18} /> 1. CPU 发出虚拟地址
             </div>
             <input 
               type="text" 
               value={virtualAddrInput}
               onChange={(e) => setVirtualAddrInput(e.target.value)}
               className="w-full font-mono text-lg p-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none uppercase"
               placeholder="0x3050"
               maxLength={6}
             />
             {!isValidHex && <div className="text-red-500 text-xs mt-1">请输入有效的16进制 (例如 0x3050)</div>}
          </div>

          {isValidHex && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-500 mb-3">地址拆分 (Address Split)</h4>
              <div className="flex border rounded overflow-hidden text-center font-mono text-sm">
                <div className="w-1/3 bg-indigo-100 p-2 border-r border-indigo-200">
                  <div className="text-xs text-indigo-500 mb-1">VPN (4 bits)</div>
                  <div className="font-bold text-indigo-700">0x{vpn.toString(16).toUpperCase()}</div>
                  <div className="text-[10px] text-slate-400">({vpn})</div>
                </div>
                <div className="w-2/3 bg-teal-100 p-2">
                   <div className="text-xs text-teal-600 mb-1">Offset (12 bits)</div>
                   <div className="font-bold text-teal-800">0x{offset.toString(16).toUpperCase().padStart(3, '0')}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Page Table Lookup */}
        <div className="space-y-4">
           <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 h-[400px] flex flex-col">
              <div className="flex items-center gap-2 mb-2 text-indigo-800 font-semibold">
                <Database size={18} /> 2. 查页表 (Page Table)
              </div>
              <div className="flex-1 overflow-y-auto bg-white rounded border border-indigo-100 text-sm">
                 <table className="w-full text-center">
                    <thead className="bg-indigo-50 text-indigo-600 sticky top-0">
                      <tr>
                        <th className="p-2">VPN</th>
                        <th className="p-2">Frame (PFN)</th>
                        <th className="p-2">Valid</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {pageTable.map((entry) => (
                        <tr 
                          key={entry.pageNumber}
                          className={`
                            border-b border-slate-50 
                            ${vpn === entry.pageNumber ? 'bg-yellow-100 font-bold' : ''}
                          `}
                        >
                          <td className="p-1 text-slate-500">0x{entry.pageNumber.toString(16).toUpperCase()}</td>
                          <td className="p-1">{entry.frameNumber.toString(16).toUpperCase().padStart(2, '0')}</td>
                          <td className="p-1">
                            {entry.valid ? 
                              <span className="text-green-500">1</span> : 
                              <span className="text-red-400">0</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

        {/* Step 3: Physical Address */}
        <div className="space-y-4">
          <div className="bg-teal-50 p-4 rounded-xl border border-teal-200">
             <div className="flex items-center gap-2 mb-2 text-teal-800 font-semibold">
               <ArrowDown size={18} /> 3. 生成物理地址
             </div>
             
             {isValidHex && pte ? (
                pte.valid ? (
                  <div className="space-y-4">
                    <div className="flex border rounded overflow-hidden text-center font-mono text-sm bg-white shadow-sm">
                      <div className="w-1/3 bg-indigo-600 text-white p-2">
                        <div className="text-[10px] opacity-75 mb-1">PFN</div>
                        <div className="font-bold">0x{pte.frameNumber.toString(16).toUpperCase().padStart(2, '0')}</div>
                      </div>
                      <div className="w-2/3 bg-teal-500 text-white p-2">
                        <div className="text-[10px] opacity-75 mb-1">Offset</div>
                        <div className="font-bold">0x{offset.toString(16).toUpperCase().padStart(3, '0')}</div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-xs text-slate-500 mb-1">最终物理地址 (Physical Address)</div>
                      <div className="text-3xl font-mono font-bold text-slate-800">
                        0x{physicalAddr!.toString(16).toUpperCase().padStart(5, '0')}
                      </div>
                    </div>

                    <div className="bg-green-100 text-green-800 text-xs p-2 rounded text-center">
                       映射成功 (Hit)
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 bg-red-50 rounded border border-red-200 text-red-600">
                    <span className="font-bold text-lg">缺页异常 (Page Fault)</span>
                    <span className="text-xs mt-1">Valid 位为 0</span>
                  </div>
                )
             ) : (
               <div className="text-slate-400 text-center text-sm py-4">等待输入...</div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};