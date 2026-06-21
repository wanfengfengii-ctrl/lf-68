import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Droplets, PlusCircle, Home, Leaf, FlaskConical, BarChart3, Palette } from 'lucide-react';
import { useAppStore } from '@/store';

export default function Layout() {
  const location = useLocation();
  const loadConfig = useAppStore((state) => state.loadConfig);
  const error = useAppStore((state) => state.error);
  const clearError = useAppStore((state) => state.clearError);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const navItems = [
    { path: '/', label: '批次列表', icon: Home },
    { path: '/batch/new', label: '新建批次', icon: PlusCircle },
    { path: '/dyeing-records', label: '染色记录', icon: Palette },
    { path: '/recipe-analysis', label: '配方分析', icon: BarChart3 },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-earth-800 text-parchment-50 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-moss-600 flex items-center justify-center">
                <Droplets className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-serif font-bold text-parchment-50">草木灰水管理</h1>
                <p className="text-xs text-parchment-300">传统染坊工艺记录系统</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-earth-700 text-parchment-50'
                        : 'text-parchment-200 hover:bg-earth-700/50 hover:text-parchment-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-xs text-parchment-300">
                <Leaf className="w-4 h-4 text-moss-400" />
                <span>传统工艺 · 匠心传承</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="md:hidden border-t border-earth-700">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-around py-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive(item.path)
                        ? 'text-parchment-50'
                        : 'text-parchment-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </header>

      {error && (
        <div className="bg-red-100 border-b border-red-200">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <p className="text-red-700 text-sm">{error.error}</p>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="bg-earth-900 text-parchment-300 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-moss-400" />
              <span className="font-serif">草木灰水管理系统</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                工艺数据可视化
              </span>
              <span className="text-parchment-400">© 2024 传统染坊</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
