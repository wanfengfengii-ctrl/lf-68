import { useState, useEffect } from 'react';
import {
  Palette,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '@/store';
import DyeingRecordModal from '@/components/DyeingRecordModal';
import Empty from '@/components/Empty';
import type {
  DyeingRecord,
  DyeingProcess,
  FabricType,
  DyeMaterial,
  MordantMethod,
} from '@/types';
import { formatDateTime } from '@/lib/api';

export default function DyeingRecords() {
  const loadDyeingRecords = useAppStore((state) => state.loadDyeingRecords);
  const deleteDyeingRecord = useAppStore((state) => state.deleteDyeingRecord);
  const dyeingRecords = useAppStore((state) => state.dyeingRecords);
  const batches = useAppStore((state) => state.batches);
  const config = useAppStore((state) => state.config);
  const loading = useAppStore((state) => state.loading);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DyeingRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<DyeingRecord | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    fabricType: '',
    targetColor: '',
    process: '',
    batchId: '',
  });

  useEffect(() => {
    loadDyeingRecords();
  }, [loadDyeingRecords]);

  const handleAdd = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleEdit = (record: DyeingRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除这条染色记录吗？')) {
      await deleteDyeingRecord(id);
    }
  };

  const handleSearch = () => {
    loadDyeingRecords({
      fabricType: filters.fabricType || undefined,
      targetColor: filters.targetColor || undefined,
      process: filters.process || undefined,
      batchId: filters.batchId || undefined,
    });
  };

  const handleReset = () => {
    setFilters({
      fabricType: '',
      targetColor: '',
      process: '',
      batchId: '',
    });
    setSearchQuery('');
    loadDyeingRecords();
  };

  const filteredRecords = dyeingRecords.filter(
    (r) =>
      !searchQuery ||
      r.targetColor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (config?.dyeMaterials?.[r.dyeMaterial] || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const fabricTypes = Object.entries(config?.fabricTypes || {}).map(([key, name]) => ({
    value: key as FabricType,
    label: name,
  }));

  const processes = Object.entries(config?.processNames || {}).map(([key, name]) => ({
    value: key as DyeingProcess,
    label: name,
  }));

  const getFabricName = (type: FabricType) => config?.fabricTypes?.[type] || type;
  const getDyeMaterialName = (material: DyeMaterial) =>
    config?.dyeMaterials?.[material] || material;
  const getMordantName = (method: MordantMethod) =>
    config?.mordantMethods?.[method] || method;
  const getProcessName = (process: DyeingProcess) =>
    config?.processNames?.[process] || process;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-earth-900">染液配方与复染管理</h1>
          <p className="text-earth-600 mt-1">记录染色配方，追溯染色过程，分析配方稳定性</p>
        </div>
        <button onClick={handleAdd} className="btn btn-accent">
          <Plus className="w-4 h-4" />
          新增记录
        </button>
      </div>

      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-earth-400" />
            <input
              type="text"
              placeholder="搜索颜色、染材或备注..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-0 focus:ring-0 p-0 text-earth-900 placeholder-earth-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn btn-outline ${showFilters ? 'bg-earth-100' : ''}`}
            >
              <Filter className="w-4 h-4" />
              筛选
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
              />
            </button>
            <button onClick={handleSearch} className="btn btn-accent">
              搜索
            </button>
            <button onClick={handleReset} className="btn btn-outline">
              <RefreshCw className="w-4 h-4" />
              重置
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="card-body border-t border-earth-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="label">布料类型</label>
                <select
                  value={filters.fabricType}
                  onChange={(e) => setFilters({ ...filters, fabricType: e.target.value })}
                  className="input"
                >
                  <option value="">全部</option>
                  {fabricTypes.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">目标颜色</label>
                <input
                  type="text"
                  value={filters.targetColor}
                  onChange={(e) => setFilters({ ...filters, targetColor: e.target.value })}
                  className="input"
                  placeholder="如：靛蓝、红色"
                />
              </div>
              <div>
                <label className="label">染色工序</label>
                <select
                  value={filters.process}
                  onChange={(e) => setFilters({ ...filters, process: e.target.value })}
                  className="input"
                >
                  <option value="">全部</option>
                  {processes.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">灰水批次</label>
                <select
                  value={filters.batchId}
                  onChange={(e) => setFilters({ ...filters, batchId: e.target.value })}
                  className="input"
                >
                  <option value="">全部</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batchNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin w-8 h-8 border-2 border-moss-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-earth-600">加载中...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <Empty
          icon={<Palette className="w-12 h-12" />}
          title="暂无染色记录"
          description="点击「新增记录」开始记录您的染色配方和工艺过程"
          action={
            <button onClick={handleAdd} className="btn btn-accent">
              <Plus className="w-4 h-4" />
              新增记录
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-earth-600">
            <span>共 {filteredRecords.length} 条记录</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-earth-50">
                  <th className="text-left px-4 py-3 text-sm font-medium text-earth-700">日期</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-earth-700">批次</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-earth-700">布料</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-earth-700">目标颜色</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-earth-700">染材</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-earth-700">媒染方式</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-earth-700">浓度</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-earth-700">染色/复染</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-earth-700">成色结果</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-earth-700">色牢度</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-earth-700">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-100">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-earth-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-earth-900">
                      {formatDateTime(record.dyeingDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-earth-900">
                      {record.batchNumber || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-earth-900">
                      {getFabricName(record.fabricType)}
                    </td>
                    <td className="px-4 py-3 text-sm text-earth-900">{record.targetColor}</td>
                    <td className="px-4 py-3 text-sm text-earth-900">
                      {getDyeMaterialName(record.dyeMaterial)}
                    </td>
                    <td className="px-4 py-3 text-sm text-earth-900">
                      {getMordantName(record.mordantMethod)}
                    </td>
                    <td className="px-4 py-3 text-sm text-earth-900">
                      {record.dyeConcentration}%
                    </td>
                    <td className="px-4 py-3 text-sm text-earth-900">
                      {record.dyeingCount}次 / {record.redyeCount}次
                    </td>
                    <td className="px-4 py-3 text-sm text-earth-900">
                      {record.colorResult || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {record.colorFastness ? (
                        <span className="font-medium text-moss-600">
                          {record.colorFastness}级
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingRecord(record)}
                          className="p-1 rounded hover:bg-earth-100 text-earth-600 hover:text-earth-900"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(record)}
                          className="p-1 rounded hover:bg-earth-100 text-earth-600 hover:text-earth-900"
                          title="编辑"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="p-1 rounded hover:bg-red-50 text-earth-600 hover:text-red-600"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DyeingRecordModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
        onSuccess={() => loadDyeingRecords()}
        record={editingRecord}
        mode={editingRecord ? 'edit' : 'create'}
        batchId={batches[0]?.id}
        batch={editingRecord ? batches.find((b) => b.id === editingRecord.batchId) : batches[0]}
      />

      {viewingRecord && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setViewingRecord(null)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-earth-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-serif font-bold text-earth-900">染色记录详情</h2>
                <button
                  onClick={() => setViewingRecord(null)}
                  className="p-1 rounded hover:bg-earth-100"
                >
                  <svg
                    className="w-6 h-6 text-earth-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-earth-600">批次编号</p>
                  <p className="font-medium text-earth-900">{viewingRecord.batchNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-earth-600">染色日期</p>
                  <p className="font-medium text-earth-900">
                    {formatDateTime(viewingRecord.dyeingDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-earth-600">布料类型</p>
                  <p className="font-medium text-earth-900">
                    {getFabricName(viewingRecord.fabricType)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-earth-600">目标颜色</p>
                  <p className="font-medium text-earth-900">{viewingRecord.targetColor}</p>
                </div>
                <div>
                  <p className="text-sm text-earth-600">染材种类</p>
                  <p className="font-medium text-earth-900">
                    {getDyeMaterialName(viewingRecord.dyeMaterial)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-earth-600">媒染方式</p>
                  <p className="font-medium text-earth-900">
                    {getMordantName(viewingRecord.mordantMethod)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-earth-600">染液浓度</p>
                  <p className="font-medium text-earth-900">{viewingRecord.dyeConcentration}%</p>
                </div>
                <div>
                  <p className="text-sm text-earth-600">加热时间</p>
                  <p className="font-medium text-earth-900">
                    {viewingRecord.heatingTimeMinutes}分钟
                  </p>
                </div>
                <div>
                  <p className="text-sm text-earth-600">染色次数</p>
                  <p className="font-medium text-earth-900">{viewingRecord.dyeingCount}次</p>
                </div>
                <div>
                  <p className="text-sm text-earth-600">复染次数</p>
                  <p className="font-medium text-earth-900">{viewingRecord.redyeCount}次</p>
                </div>
                <div>
                  <p className="text-sm text-earth-600">成色结果</p>
                  <p className="font-medium text-earth-900">
                    {viewingRecord.colorResult || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-earth-600">色牢度等级</p>
                  <p className="font-medium text-earth-900">
                    {viewingRecord.colorFastness ? `${viewingRecord.colorFastness}级` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-earth-600">染色工序</p>
                  <p className="font-medium text-earth-900">
                    {getProcessName(viewingRecord.process)}
                  </p>
                </div>
              </div>
              {viewingRecord.notes && (
                <div>
                  <p className="text-sm text-earth-600 mb-1">备注</p>
                  <p className="text-earth-900 bg-earth-50 p-3 rounded-lg">
                    {viewingRecord.notes}
                  </p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-earth-200 flex justify-end">
              <button
                onClick={() => setViewingRecord(null)}
                className="btn btn-outline"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
