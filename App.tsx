import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Layers, FileDigit, Cpu, BookOpen } from 'lucide-react';
import { SegmentationView } from './components/SegmentationView';
import { PagingView } from './components/PagingView';
import { MultiLevelPagingView } from './components/MultiLevelPagingView';
import { AITutor } from './components/AITutor';
import { MemoryMode } from './types';

const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => 
      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
        isActive 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`
    }
  >
    <Icon size={20} />
    <span>{label}</span>
  </NavLink>
);

const ContentWrapper = () => {
  const location = useLocation();

  // Determine current mode for AI Context
  let currentMode = MemoryMode.SEGMENTATION;
  let contextDesc = "用户正在查看段式存储模拟。包含段表、基址、界限寄存器逻辑。";
  
  if (location.pathname.includes('paging')) {
    currentMode = MemoryMode.PAGING;
    contextDesc = "用户正在查看页式存储模拟。包含页表、VPN到PFN转换、TLB概念。";
  } else if (location.pathname.includes('multi-level')) {
    currentMode = MemoryMode.MULTI_LEVEL;
    contextDesc = "用户正在查看多级页表模拟。演示了页目录和二级页表的层级结构。";
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 z-20">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 text-slate-800">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Cpu size={20} />
            </div>
            <h1 className="font-bold text-lg tracking-tight">OS Memory</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <div className="text-xs font-bold text-slate-400 px-4 mb-2 uppercase tracking-wider">Visualizers</div>
          <NavItem to="/" icon={Layers} label="段式存储 (Segmentation)" />
          <NavItem to="/paging" icon={FileDigit} label="页式存储 (Paging)" />
          <NavItem to="/multi-level" icon={LayoutDashboard} label="多级页表 (Multi-level)" />
        </nav>

        <div className="p-4 border-t border-slate-100">
           <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
             <div className="flex items-center gap-2 text-slate-700 font-medium text-sm mb-1">
                <BookOpen size={16} /> 学习目标
             </div>
             <p className="text-xs text-slate-500 leading-relaxed">
               通过交互式模拟理解逻辑地址到物理地址的转换过程，掌握 MMU 工作原理。
             </p>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 justify-between shrink-0">
          <h2 className="text-lg font-medium text-slate-700">
            {currentMode === MemoryMode.SEGMENTATION && "基本分段存储管理"}
            {currentMode === MemoryMode.PAGING && "基本分页存储管理"}
            {currentMode === MemoryMode.MULTI_LEVEL && "多级页表机制"}
          </h2>
          <div className="flex items-center gap-2">
             <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">React + Tailwind + Gemini</span>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
           <Routes>
             <Route path="/" element={<SegmentationView />} />
             <Route path="/paging" element={<PagingView />} />
             <Route path="/multi-level" element={<MultiLevelPagingView />} />
           </Routes>
        </div>

        {/* AI Tutor Integration */}
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