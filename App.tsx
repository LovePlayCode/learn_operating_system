
import React from 'react';
import { HashRouter as Router, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Layers, FileDigit, Cpu, BookOpen, ToggleLeft, ToggleRight, Palette, Sparkles, Fingerprint, LayoutList, Activity, GitMerge, HardDrive, Box, Network } from 'lucide-react';
import { MemoryVirtualizationView } from './components/MemoryVirtualizationView';
import { ProcessView } from './components/ProcessView';
import { ConcurrencyView } from './components/ConcurrencyView';
import { FileView } from './components/FileView';
import { DistributedView } from './components/DistributedView';
import { AITutor } from './components/AITutor';
import { MemoryMode } from './types';
import { ThemeProvider, useTheme } from './hooks/useTheme';

const NavItem = ({ to, icon: Icon, label, isActiveCheck }: { to: string, icon: any, label: string, isActiveCheck?: boolean }) => {
  const { styles } = useTheme();
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm mb-1 ${
          (isActiveCheck || isActive) 
            ? styles.sidebarItem.active
            : styles.sidebarItem.inactive
        }`
      }
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
};

const Header = ({ title, subtitle }: { title: string, subtitle: string }) => {
  const { styles, mode, toggleTheme } = useTheme();
  
  return (
    <header className={`px-8 py-5 flex items-center justify-between shrink-0 z-10 ${mode === 'modern' ? 'bg-white border-b border-slate-200' : 'bg-white/80 border-b-2 border-pink-100 backdrop-blur-sm'}`}>
      <div>
        <h2 className={`text-xl font-bold ${styles.text.primary}`}>{title}</h2>
        <p className={`text-sm mt-1 ${styles.text.secondary}`}>{subtitle}</p>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTheme}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            mode === 'modern' 
              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
              : 'bg-pink-100 text-pink-500 hover:bg-pink-200 shadow-sm'
          }`}
        >
          <Palette size={14} />
          {mode === 'modern' ? '严肃模式' : '可爱模式'}
          {mode === 'modern' ? <ToggleLeft size={20}/> : <ToggleRight size={20}/>}
        </button>
        
        <div className={`flex items-center gap-2 text-sm ${styles.text.secondary}`}>
          <Cpu size={16} />
          <span className="font-mono">OS Kernel v2.2</span>
        </div>
      </div>
    </header>
  );
};

const ContentWrapper = () => {
  const location = useLocation();
  const { styles, mode } = useTheme();

  // Determine state based on path
  let currentMode = MemoryMode.SEGMENTATION;
  let title = "内存虚拟化";
  let subtitle = "Memory Virtualization";
  let contextDesc = "用户正在查看内存虚拟化模块。";
  
  if (location.pathname.includes('/memory/paging')) {
    currentMode = MemoryMode.PAGING;
    title = "页式存储管理";
    subtitle = "Paging Mechanism";
    contextDesc = "用户正在查看页式存储模拟。包含页表、VPN到PFN转换。";
  } else if (location.pathname.includes('/memory/multi-level')) {
    currentMode = MemoryMode.MULTI_LEVEL;
    title = "多级页表";
    subtitle = "Multi-Level Page Tables";
    contextDesc = "用户正在查看多级页表模拟。演示了页目录和二级页表结构。";
  } else if (location.pathname.includes('/memory/inverted')) {
    currentMode = MemoryMode.INVERTED;
    title = "反转页表";
    subtitle = "Inverted Page Table (Hash)";
    contextDesc = "用户正在查看反转页表模拟。演示了基于哈希的全局页表和冲突链查找。";
  } else if (location.pathname.includes('/memory/segmented-paging')) {
    currentMode = MemoryMode.SEGMENTED_PAGING;
    title = "段页式存储";
    subtitle = "Segmented Paging";
    contextDesc = "用户正在查看段页式存储模拟。演示了先分段再分页的二级查找过程。";
  } else if (location.pathname.includes('/memory/swapping')) {
    currentMode = MemoryMode.SWAPPING;
    title = "交换与置换算法";
    subtitle = "Swapping & Page Replacement";
    contextDesc = "用户正在查看页面置换模拟。包含 FIFO, LRU, Clock 算法的动态演示以及缺页中断逻辑。";
  } else if (location.pathname.includes('/memory/cow')) {
    currentMode = MemoryMode.COW;
    title = "写时复制";
    subtitle = "Copy-on-Write (COW)";
    contextDesc = "用户正在查看写时复制模拟。演示 fork() 后父子进程共享物理页，直到写入时才复制的过程。";
  } else if (location.pathname.includes('/memory/relocation')) {
    currentMode = MemoryMode.RELOCATION;
    title = "动态重定位";
    subtitle = "Base & Bound Registers";
    contextDesc = "用户正在查看动态重定位（基址-界限）模拟。演示了 MMU 如何利用两个寄存器实现最基础的地址转换和保护。";
  } else if (location.pathname.includes('/memory/segmentation')) {
    currentMode = MemoryMode.SEGMENTATION;
    title = "段式存储管理";
    subtitle = "Segmentation Logic";
    contextDesc = "用户正在查看段式存储模拟。包含段表、基址、界限寄存器逻辑。";
  } else if (location.pathname === '/process') {
    currentMode = MemoryMode.PROCESS;
    title = "进程管理";
    subtitle = "Process Scheduling & States";
    contextDesc = "用户正在查看进程管理模拟。包含进程状态流转（生命周期）和调度算法（FIFO/RR/MLFQ）。";
  } else if (location.pathname === '/concurrency') {
    currentMode = MemoryMode.CONCURRENCY;
    title = "并发与同步";
    subtitle = "Concurrency & Synchronization";
    contextDesc = "用户正在查看并发模拟。演示了竞态条件、互斥锁、信号量（生产者消费者）以及死锁（哲学家就餐）。";
  } else if (location.pathname === '/file-system') {
    currentMode = MemoryMode.FILE_SYSTEM;
    title = "文件系统管理";
    subtitle = "Files & Disk Allocation";
    contextDesc = "用户正在查看文件系统模拟。包含 Inode 结构和磁盘块分配策略（连续、链接、索引）。";
  } else if (location.pathname === '/distributed') {
    currentMode = MemoryMode.DISTRIBUTED;
    title = "分布式系统";
    subtitle = "Distributed Architecture";
    contextDesc = "用户正在查看分布式系统模拟。包含 CAP 定理一致性模型、一致性哈希负载均衡以及两阶段提交 (2PC)。";
  }

  const isMemoryActive = location.pathname.startsWith('/memory');

  return (
    <div className={`flex h-screen ${styles.font} ${styles.bg}`}>
      {/* Sidebar */}
      <aside className={`w-72 flex flex-col shrink-0 z-20 transition-colors duration-300 ${styles.sidebar}`}>
        <div className={`p-6 ${mode === 'modern' ? 'border-b border-slate-800' : 'border-b-2 border-pink-100'}`}>
          <div className={`flex items-center gap-3 ${mode === 'modern' ? 'text-white' : 'text-slate-800'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
              mode === 'modern' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-pink-400 text-white'
            }`}>
              {mode === 'modern' ? <Cpu size={24} /> : <Sparkles size={24} />}
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">OS Explorer</h1>
              <div className={`text-xs font-medium ${mode === 'modern' ? 'text-slate-400' : 'text-pink-400'}`}>OS Labs</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className={`text-xs font-bold px-4 mb-3 uppercase tracking-wider mt-4 ${styles.text.secondary}`}>
            Core Modules
          </div>
          
          <NavItem 
            to="/memory/segmentation" 
            isActiveCheck={isMemoryActive}
            icon={Box} 
            label="内存虚拟化 (Memory)" 
          />
          
          <NavItem to="/process" icon={Activity} label="进程调度 (Process)" />
          <NavItem to="/concurrency" icon={GitMerge} label="并发与同步 (Sync)" />
          <NavItem to="/file-system" icon={HardDrive} label="文件系统 (Files)" />
          <NavItem to="/distributed" icon={Network} label="分布式系统 (Dist)" />
          
          <div className={`mt-8 mx-4 p-4 rounded-xl border ${
            mode === 'modern' 
              ? 'bg-slate-800/50 border-slate-700/50' 
              : 'bg-pink-50/50 border-pink-100'
          }`}>
            <div className="flex items-start gap-3">
              <BookOpen className={`shrink-0 mt-1 ${mode === 'modern' ? 'text-blue-400' : 'text-pink-400'}`} size={16} />
              <div>
                <h4 className={`text-sm font-semibold mb-1 ${mode === 'modern' ? 'text-slate-200' : 'text-slate-700'}`}>学习提示</h4>
                <p className={`text-xs leading-relaxed ${mode === 'modern' ? 'text-slate-400' : 'text-slate-500'}`}>
                  分布式系统通过网络连接多个节点，带来了数据一致性、分区容错等新挑战。
                </p>
              </div>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header title={title} subtitle={subtitle} />

        <div className="flex-1 overflow-hidden relative">
           <Routes>
             <Route path="/" element={<Navigate to="/memory/segmentation" replace />} />
             <Route path="/memory/*" element={<MemoryVirtualizationView />} />
             <Route path="/process" element={<ProcessView />} />
             <Route path="/concurrency" element={<ConcurrencyView />} />
             <Route path="/file-system" element={<FileView />} />
             <Route path="/distributed" element={<DistributedView />} />
           </Routes>
        </div>

        <AITutor currentMode={currentMode} contextDescription={contextDesc} />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <ContentWrapper />
      </ThemeProvider>
    </Router>
  );
};

export default App;
