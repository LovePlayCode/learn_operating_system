
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { Layers, FileDigit, LayoutDashboard, Fingerprint, LayoutList, RefreshCcw, Copy } from 'lucide-react';
import { SegmentationView } from './SegmentationView';
import { PagingView } from './PagingView';
import { MultiLevelPagingView } from './MultiLevelPagingView';
import { InvertedPagingView } from './InvertedPagingView';
import { SegmentedPagingView } from './SegmentedPagingView';
import { SwappingView } from './SwappingView';
import { CowView } from './CowView';

export const MemoryVirtualizationView: React.FC = () => {
  const { styles, mode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from URL
  const currentPath = location.pathname.split('/').pop() || 'segmentation';

  const tabs = [
    { id: 'segmentation', label: '段式存储', icon: Layers },
    { id: 'paging', label: '页式存储', icon: FileDigit },
    { id: 'multi-level', label: '多级页表', icon: LayoutDashboard },
    { id: 'swapping', label: '换页与置换', icon: RefreshCcw }, // Moved up for visibility
    { id: 'cow', label: '写时复制', icon: Copy }, // New
    { id: 'inverted', label: '反转页表', icon: Fingerprint },
    { id: 'segmented-paging', label: '段页式存储', icon: LayoutList },
  ];

  const handleTabChange = (id: string) => {
    navigate(`/memory/${id}`);
  };

  const renderContent = () => {
    switch (currentPath) {
      case 'segmentation': return <SegmentationView />;
      case 'paging': return <PagingView />;
      case 'multi-level': return <MultiLevelPagingView />;
      case 'inverted': return <InvertedPagingView />;
      case 'segmented-paging': return <SegmentedPagingView />;
      case 'swapping': return <SwappingView />;
      case 'cow': return <CowView />;
      default: return <SegmentationView />;
    }
  };

  return (
    <div className={`flex flex-col h-full ${styles.bg}`}>
      {/* Internal Tab Navigation */}
      <div className={`px-6 pt-4 pb-0 shrink-0`}>
        <div className={`flex flex-wrap gap-2 p-1.5 rounded-xl border ${mode === 'cute' ? 'bg-white border-pink-100' : 'bg-slate-200/50 border-slate-300'}`}>
          {tabs.map((tab) => {
            const isActive = currentPath === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? (mode === 'cute' ? 'bg-pink-400 text-white shadow-md' : 'bg-white text-slate-800 shadow-sm')
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};
