import { useState, useEffect } from 'react';
import { Search, Plus, Filter, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store';
import BatchCard from '@/components/BatchCard';
import type { BatchStatus } from '@/types';

export default function Home() {
  const batches = useAppStore((state) => state.batches);
  const config = useAppStore((state) => state.config);
  const loading = useAppStore((state) => state.loading);
  const loadBatches = useAppStore((state) => state.loadBatches);
  const deleteBatch = useAppStore((state) => state.deleteBatch);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BatchStatus | ''>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadBatches(statusFilter || undefined, search || undefined);
  }, [loadBatches, statusFilter, search]);

  const handleDelete = async (id: string) => {
    try {
      await deleteBatch(id);
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('删除失败:', err);
    }
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      </div>

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
