import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, CheckSquare, Target, Activity, BellRing } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

export default function Layout() {
  const location = useLocation();
  const [notificationPermission, setNotificationPermission] = useState<string>('default');

  useEffect(() => {
    const stored = localStorage.getItem('lmls_alerts_enabled');
    if (stored === 'true') {
      setNotificationPermission('granted');
    }
  }, []);

  const requestNotificationPermission = async () => {
    localStorage.setItem('lmls_alerts_enabled', 'true');
    setNotificationPermission('granted');
    toast.success('Task deadline alerts enabled!', {
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/goals', icon: Target, label: 'Today' },
    { path: '/analytics', icon: Activity, label: 'Analytics' },
  ];

  return (
    <div className="flex justify-center min-h-screen bg-gray-50 text-gray-900 font-sans">
      <div className="w-full max-w-md bg-white shadow-xl min-h-screen flex flex-col relative overflow-hidden">
        
        {/* Header Content Top Bar */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 py-4">
          <h1 className="font-bold text-lg tracking-tight">Last-Minute Life Saver</h1>
        </header>

        {notificationPermission === 'default' && (
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-800 font-medium">Enable task deadline alerts</span>
            </div>
            <button 
              onClick={requestNotificationPermission}
              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Enable
            </button>
          </div>
        )}

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto pb-24 relative">
          <Outlet />
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 w-full bg-white border-t border-gray-100 pb-safe">
          <div className="flex justify-around items-center px-2 py-3">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center p-2 rounded-xl transition-all duration-200",
                  location.pathname === item.path 
                    ? "text-blue-600 bg-blue-50" 
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <item.icon className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
