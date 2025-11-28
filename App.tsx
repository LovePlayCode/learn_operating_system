import React from 'react';
import { HashRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Layers, FileDigit, Cpu, BookOpen, ChevronRight } from 'lucide-react';
import { SegmentationView } from './components/SegmentationView';
import { PagingView } from './components/PagingView';
import { MultiLevelPagingView } from './components/MultiLevelPagingView';
import { AITutor } from './components/AITutor';
import { MemoryMode } from './types';

const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => 
      `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm ${
        isActive 
          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`
    }
  >
    <Icon size={18} />
    <span>{label}</span>
  </NavLink>
);

const Header = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shrink-0 shadow-sm z-10">
    <div>
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
    </div>
    <div className="flex items-center gap-2 text-sm text-slate-400">
      <Cpu size={16} />
      <span>OS Memory Explorer</span>
    </div>
  </header>
);

const ContentWrapper = () => {
  const location = useLocation();

  let currentMode = MemoryMode.SEGMENTATION;
  let title = "段式存储管理 (Segmentation)";
  let subtitle = "逻辑地址由段号和偏移量组成，通过段表映射到物理内存。";
  let contextDesc = "用户正在查看段式存储模拟。包含段表、基址、界限寄存器逻辑。重点观察越界检查和地址加法。";
  
  if (location.pathname.includes('paging')) {
    currentMode = MemoryMode.PAGING;
    title = "页式存储管理 (Paging)";
    subtitle = "逻辑地址空间被划分为固定大小的页，通过页表映射到物理页框。";
    contextDesc = "用户正在查看页式存储模拟。包含页表、VPN到PFN转换。重点观察页号如何索引页表。";
  } else if (location.pathname.includes('multi-level')) {
    currentMode = MemoryMode.MULTI_LEVEL;
    title = "多级页表 (Multi-Level Paging)";
    subtitle = "通过分级结构减少页表占用的连续内存空间。";
    contextDesc = "用户正在查看多级页表模拟。演示了页目录和二级页表的层级结构以及地址的拆分。";
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 flex flex-col shrink-0 z-20 shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Cpu size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">OS Kernel</h1>
              <div className="text-xs text-slate-400 font-medium">Memory Subsystem</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-xs font-bold text-slate-500 px-4 mb-3 uppercase tracking-wider mt-4">Core Concepts</div>
          <NavItem to="/" icon={Layers} label="段式存储 (Segmentation)" />
          <NavItem to="/paging" icon={FileDigit} label="页式存储 (Paging)" />
          <NavItem to="/multi-level" icon={LayoutDashboard} label="多级页表 (Multi-level)" />
          
          <div className="mt-8 mx-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-start gap-3">
              <BookOpen className="text-blue-400 shrink-0 mt-1" size={16} />
              <div>
                <h4 className="text-slate-200 text-sm font-semibold mb-1">学习提示</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  尝试修改地址输入，观察地址转换过程中的 MMU 行为和异常处理 (Trap)。
                </p>
              </div>
            </div>
          </div>
        </nav>
        
        <div className="p-4 border-t border-slate-800 text-center">
          <span className="text-xs text-slate-600">v2.0.0 • Interactive Learning</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-slate-50/50">
        <Header title={title} subtitle={subtitle} />

        <div className="flex-1 overflow-hidden relative">
           <Routes>
             <Route path="/" element={<SegmentationView />} />
             <Route path="/paging" element={<PagingView />} />
             <Route path="/multi-level" element={<MultiLevelPagingView />} />
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
      <ContentWrapper />
    </Router>
  );
};

export default App;