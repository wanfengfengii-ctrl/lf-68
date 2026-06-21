import { useState, useEffect } from 'react';
import { Search, Plus, Filter, AlertTriangle, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAppStore } from '@/store';
import BatchCard from '@/components/BatchCard';
import type { BatchStatus, WarningLevel, WarningType } from '@/types';

export default function Home() {
  const batches = useAppStore((state) => state.batches);
  const config = useAppStore((state) => state.config);
  const loading = useAppStore((state) => state.loading);
  const loadBatches = useAppStore((state) => state.loadBatches);
  const deleteBatch = useAppStore((state) => state.deleteBatch);
  const warnings = useAppStore((state) => state.warnings);
  const loadWarnings = useAppStore((state) => state.loadWarnings);
  const refreshWarnings = useAppStore((state) => state.refreshWarnings);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BatchStatus | ''>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showWarningPanel, setShowWarningPanel] = useState(true);

  useEffect(() => {
    loadBatches(statusFilter || undefined, search || undefined);
    loadWarnings();
  }, [loadBatches, statusFilter, search, loadWarnings]);

  const handleDelete = async (id: string) => {
    try {
      await deleteBatch(id);
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  const handleRefreshWarnings = async () => {
    refreshWarnings();
  };

  const statusOptions = Object.entries(config?.statusNames || {}).map(([key, name]) => ({
    value: key as BatchStatus,
    label: name,
  }));

  const stats = {
    total: batches.length,
    available: batches.filter((b) => b.status === 'available').length,
    soaking: batches.filter((b) => b.status === 'soaking').length,
    exhausted: batches.filter((b) => b.status === 'exhausted').length,
  };

  const warningStats = warnings?.stats || { total: 0, high: 0, medium: 0, low: 0, restricted: 0, byType: {} };

  const warningBatches = warnings?.batches || [];

  const getWarningLevelClass = (level: WarningLevel | null | undefined) => {
    switch (level) {
      case 'high':
        return 'warning-level-high';
      case 'medium':
        return 'warning-level-medium';
      case 'low':
        return 'warning-level-low';
      default:
        return '';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="w-4 h-4" />;
      case 'falling':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendClass = (trend?: string) => {
    switch (trend) {
      case 'rising':
        return 'trend-rising';
      case 'falling':
        return 'trend-falling';
      default:
        return 'trend-stable';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-earth-900">草木灰水批次</h1>
          <p className="text-earth-600 mt-1">管理所有灰水批次的浸泡、过滤和使用记录</p>
        </div>
        <a
          href="/batch/new"
          className="btn btn-primary w-full md:w-auto"
        >
          <Plus className="w-5 h-5" />
          新建批次
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-6 text-center">
          <p className="text-4xl font-bold text-earth-800">{stats.total}</p>
          <p className="text-sm text-earth-600 mt-1">总批次</p>
        </div>
        <div className="card p-6 text-center">
          <p className="text-4xl font-bold text-green-600">{stats.available}</p>
          <p className="text-sm text-earth-600 mt-1">可用</p>
        </div>
        <div className="card p-6 text-center">
          <p className="text-4xl font-bold text-blue-600">{stats.soaking}</p>
          <p className="text-sm text-earth-600 mt-1">浸泡中</p>
        </div>
        <div className="card p-6 text-center">
          <p className="text-4xl font-bold text-red-600">{stats.exhausted}</p>
          <p className="text-sm text-earth-600 mt-1">已用尽</p>
        </div>
        <div className={`card p-6 text-center ${warningStats.total > 0 ? 'bg-orange-50 border-orange-300' : ''}`}>
          <p className={`text-4xl font-bold ${warningStats.total > 0 ? 'text-orange-600' : 'text-earth-800'}`}>
            {warningStats.total}
          </p>
          <p className="text-sm text-earth-600 mt-1">预警批次</p>
        </div>
      </div>

      {warningStats.total > 0 && showWarningPanel && (
        <div className="card border-2 border-orange-300">
          <div className="card-header flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-orange-50">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <h2 className="text-xl font-serif font-bold text-orange-800">质量预警中心</h2>
              <span className={`badge ${warningStats.high > 0 ? 'warning-level-high' : warningStats.medium > 0 ? 'warning-level-medium' : 'warning-level-low'}`}>
                {warningStats.high} 严重 / {warningStats.medium} 警告 / {warningStats.low} 提示
              </span>
              {warningStats.restricted > 0 && (
                <span className="badge bg-red-200 text-red-800">
                  {warningStats.restricted} 限制使用
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRefreshWarnings}
                disabled={loading}
                className="btn btn-outline text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                刷新预警
              </button>
              <button
                onClick={() => setShowWarningPanel(false)}
                className="btn btn-outline text-sm"
              >
                收起
              </button>
            </div>
          </div>

          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {warningBatches.slice(0, 6).map((item) => {
                const batch = item.batch;
                return (
                  <div
                    key={batch.id}
                    className="p-4 rounded-lg border-2 transition-all hover:shadow-md cursor-pointer"
                    style={{
                      borderColor:
                        batch.warningLevel === 'high'
                          ? '#ef4444'
                          : batch.warningLevel === 'medium'
                          ? '#eab308'
                          : '#3b82f6',
                      backgroundColor:
                        batch.warningLevel === 'high'
                          ? '#fef2f2'
                          : batch.warningLevel === 'medium'
                          ? '#fefce8'
                          : '#eff6ff',
                    }}
                    onClick={() => (window.location.href = `/batch/${batch.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-serif font-bold text-earth-900">{batch.batchNumber}</h3>
                        <p className="text-xs text-earth-500">{batch.rawMaterialSource}</p>
                      </div>
                      <span className={`badge ${getWarningLevelClass(batch.warningLevel)}`}>
                        {config?.warningLevels[batch.warningLevel as WarningLevel] || '预警'}
                      </span>
                    </div>
                    {batch.usageRestricted && (
                      <div className="mt-2 mb-2">
                        <span className="badge bg-red-200 text-red-800 text-xs">
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          限制使用
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`trend-indicator ${getTrendClass(batch.phTrend)}`}>
                        {getTrendIcon(batch.phTrend)}
                        {batch.phTrend === 'rising'
                          ? 'PH上升'
                          : batch.phTrend === 'falling'
                          ? 'PH下降'
                          : 'PH稳定'}
                      </span>
                      {batch.currentPh !== null && (
                        <span className="text-sm font-medium">
                          PH: {batch.currentPh.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-earth-600">
                      {batch.warningTypes.slice(0, 2).map((wt) => (
                        <span key={wt} className="mr-2">
                          • {config?.warningTypes[wt as WarningType] || wt}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {warningBatches.length > 6 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-earth-500">
                  还有 {warningBatches.length - 6} 个预警批次，可在列表中查看详情
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {warningStats.total > 0 && !showWarningPanel && (
        <button
          onClick={() => setShowWarningPanel(true)}
          className="fixed bottom-6 right-6 z-40 bg-orange-500 hover:bg-orange-600 text-white shadow-lg rounded-full px-5 py-3 flex items-center gap-2 animate-pulse-slow"
        >
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">预警 {warningStats.total}</span>
        </button>
      )}

      <div className="card">
        <div className="card-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-xl font-serif font-bold">批次列表</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
              <input
                type="text"
                placeholder="搜索批次编号或原料来源..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as BatchStatus | '')}
                className="input pl-10 pr-10 appearance-none"
              >
                <option value="">全部状态</option>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="text-center py-12 text-earth-500">
              <div className="animate-spin w-8 h-8 border-4 border-earth-300 border-t-earth-700 rounded-full mx-auto mb-4"></div>
              <p>加载中...</p>
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center py-12 text-earth-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">暂无批次数据</p>
              <p className="text-sm mt-1">点击上方按钮创建第一个批次</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batches.map((batch) => (
                <div key={batch.id} className="relative">
                  <BatchCard
                    batch={batch}
                    onDelete={() => setShowDeleteConfirm(batch.id)}
                  />

                  {showDeleteConfirm === batch.id && (
                    <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center z-10">
                      <div className="bg-parchment-50 p-6 rounded-lg shadow-xl max-w-sm mx-4">
                        <h3 className="text-lg font-serif font-bold text-earth-900 mb-2">
                          确认删除
                        </h3>
                        <p className="text-earth-600 mb-4">
                          确定要删除批次 <span className="font-bold">{batch.batchNumber}</span> 吗？
                          此操作不可撤销，所有相关记录将被永久删除。
                        </p>
                        <div className="flex gap-3 justify-end">
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="btn btn-outline"
                          >
                            取消
                          </button>
                          <button
                            onClick={() => handleDelete(batch.id)}
                            className="btn btn-danger"
                          >
                            确认删除
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
