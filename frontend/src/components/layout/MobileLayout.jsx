import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomTabBar from '../mobile/BottomTabBar';

const MobileLayout = () => {
  return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden">
      {/* Page content - scrollable */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <Outlet />
      </div>
      
      {/* Bottom Navigation - fixed at bottom as flex child */}
      <BottomTabBar />
    </div>
  );
};

export default MobileLayout;
