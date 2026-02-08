import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomTabBar from '../mobile/BottomTabBar';

const MobileLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Page content */}
      <div className="flex-1 pb-20">
        <Outlet />
      </div>
      
      {/* Bottom Navigation */}
      <BottomTabBar />
    </div>
  );
};

export default MobileLayout;
