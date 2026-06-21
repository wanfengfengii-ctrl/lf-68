import { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Star,
  Droplets,
  FlaskConical,
  Thermometer,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  AlertCircle,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAppStore } from '@/store';
import type { DyeingProcess, FabricType, WarningLevel, RecommendedBatchItem } from '@/types';
import { formatDateTime, getPhColor } from '@/lib/api';

export default function IntelligentRecommendation() {
  const config = useAppStore((state) => state.config);
  const loading = useAppStore((state) => state.loading);
  const batchRecommendation = useAppStore((state) => state.batchRecommendation);
  const getBatchRecommendation = useAppStore((state) => state.getBatchRecommendation);
  const clearBatchRecommendation = useAppStore((state) => state.clearBatchRecommendation);

  const [selectedProcess, setSelectedProcess] = useState<DyeingProcess | ''>('');
  const [selectedFabric, setSelectedFabric] = useState<FabricType | ''>('');
  const [minVolume, setMinVolume] = useState<number>(0);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

  useEffect(() => {
    loadRecommendation();
  }, []);

  const loadRecommendation = () => {
    const params: { process?: DyeingProcess; fabricType?: FabricType; minVolume?: number } = {};
    if (selectedProcess) params.process = selectedProcess;
    if (selectedFabric) params.fabricType = selectedFabric;
    if (minVolume > 0) params.minVolume = minVolume;
    getBatchRecommendation(params);
  };

  const handleSearch = () => {
    loadRecommendation();
  };

  const handleReset = () => {
    setSelectedProcess('');
    setSelectedFabric('');
    setMinVolume(0);
    clearBatchRecommendation();
    getBatchRecommendation();
  };

  const processOptions = Object.entries(config?.processNames || {}).map(([key, name]) => ({
    value: key as DyeingProcess,
    label: name,
  }));

  const fabricOptions = Object.entries(config?.fabricTypes || {}).map(([key, name]) => ({
    value: key as FabricType,
    label: name,
  }));

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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

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

  const toggleBatchExpand = (batchId: string) => {
    setExpandedBatch(expandedBatch === batchId ? null : batchId);
  };

  const renderBatchCard = (item: RecommendedBatchItem, isRecommended: boolean) => {
    const batch = item.batch;
    const isExpanded = expandedBatch === batch.id;

    return (
      <div
        key={batch.id}
        className={`recommendation-card ${isRecommended ? 'recommended' : 'not-recommended'} cursor-pointer transition-all`}
        onClick={() => toggleBatchExpand(batch.id)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            {isRecommended && (
              <div className="flex-shrink-0">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-serif font-bold text-earth-900">{batch.batchNumber}</h3>
              <p className="text-sm text-earth-600">{batch.rawMaterialSource}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-bold ${getScoreColor(item.finalScore)}`}>
              {item.finalScore}
              <span className="text-lg font-normal">分</span>
            </p>
            <p className="text-xs text-earth-500">综合评分</p>
          </div>
        </div>

        <div className="score-bar mb-4">
          <div
            className={`score-bar-fill ${getScoreBarColor(item.finalScore)}`}
            style={{ width: `${item.finalScore}%` }}
          ></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <FlaskConical className={`w-4 h-4 ${getPhColor(batch.currentPh)}`} />
            <span>
              PH: <span className="font-medium">{batch.currentPh?.toFixed(1) || '-'}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Droplets className="w-4 h-4 text-blue-500" />
            <span>
              剩余: <span className="font-medium">{item.remainingVolume.toFixed(1)}L</span>
              <span className="text-earth-500 text-xs"> ({item.remainingPercent.toFixed(0)}%)</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4 text-moss-600" />
            <span>
              过滤: <span className="font-medium">{batch.filterCount}次</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-earth-500" />
            <span>
              已用: <span className="font-medium">{item.ageDays.toFixed(0)}天</span>
            </span>
          </div>
        </div>

        {selectedProcess && item.processRecommendation && (
          <div className="mb-4 p-3 bg-parchment-100 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-earth-700">
                {config?.processNames[selectedProcess]}工序适配
              </span>
              <span
                className={`text-sm font-medium ${
                  item.processRecommendation.inRange ? 'text-green-600' : 'text-orange-600'
                }`}
              >
                {item.processRecommendation.inRange ? '✓ PH适配合格' : '⚠ PH略偏离'}
              </span>
            </div>
            <p className="text-xs text-earth-600">
              目标PH范围: {item.processRecommendation.minPh} - {item.processRecommendation.maxPh}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {item.processRecommendation.reasons.slice(0, 3).map((reason, idx) => (
                <span
                  key={idx}
                  className={`text-xs px-2 py-0.5 rounded ${
                    item.processRecommendation.inRange
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {reason}
                </span>
              ))}
            </div>
          </div>
        )}

        {batch.hasWarning && batch.warningLevel && (
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle
              className={`w-4 h-4 ${
                batch.warningLevel === 'high'
                  ? 'text-red-600'
                  : batch.warningLevel === 'medium'
                  ? 'text-yellow-600'
                  : 'text-blue-600'
              }`}
            />
            <span className={`badge ${getWarningLevelClass(batch.warningLevel)}`}>
              {config?.warningLevels[batch.warningLevel]}预警
            </span>
            <span className="text-xs text-earth-500">
              {batch.warningTypes
                .slice(0, 2)
                .map((wt) => config?.warningTypes[wt] || wt)
                .join('、')}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className={`trend-indicator ${getTrendClass(batch.phTrend)}`}>
            {getTrendIcon(batch.phTrend)}
            {batch.phTrend === 'rising'
              ? 'PH上升'
              : batch.phTrend === 'falling'
              ? 'PH下降'
              : 'PH稳定'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/batch/${batch.id}`;
              }}
              className="btn btn-outline text-sm"
            >
              查看详情
            </button>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-earth-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-earth-400" />
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-earth-200">
            <h4 className="font-serif font-bold mb-3">各工序评分</h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(item.processScores).map(([process, score]) => (
                <div
                  key={process}
                  className={`p-3 rounded-lg ${
                    score.inRange ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{score.processName}</span>
                    <span className={`text-sm font-bold ${getScoreColor(score.score)}`}>
                      {score.score}分
                    </span>
                  </div>
                  <div className="score-bar mb-2">
                    <div
                      className={`score-bar-fill ${getScoreBarColor(score.score)}`}
                      style={{ width: `${score.score}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-earth-500">
                    PH范围: {score.minPh} - {score.maxPh}
                  </p>
                </div>
              ))}
            </div>

            {item.warnings.warnings.length > 0 && (
              <div className="mt-4">
                <h4 className="font-serif font-bold mb-3">预警信息</h4>
                <div className="space-y-2">
                  {item.warnings.warnings.map((warning, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg ${
                        warning.level === 'high'
                          ? 'bg-red-50 border border-red-200'
                          : warning.level === 'medium'
                          ? 'bg-yellow-50 border border-yellow-200'
                          : 'bg-blue-50 border border-blue-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle
                          className={`w-4 h-4 mt-0.5 ${
                            warning.level === 'high'
                              ? 'text-red-600'
                              : warning.level === 'medium'
                              ? 'text-yellow-600'
                              : 'text-blue-600'
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium">{warning.message}</p>
                          {warning.advice && (
                            <p className="text-xs text-earth-600 mt-1">{warning.advice}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-earth-900 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            智能工艺推荐
          </h1>
          <p className="text-earth-600 mt-1">
            根据工序需求自动推荐最合适的灰水批次，提高生产决策效率
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="btn btn-outline">
            重置筛选
          </button>
          <button onClick={loadRecommendation} disabled={loading} className="btn btn-primary">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新推荐
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-serif font-bold">筛选条件</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="label">染色工序</label>
              <select
                value={selectedProcess}
                onChange={(e) => setSelectedProcess(e.target.value as DyeingProcess | '')}
                className="input"
              >
                <option value="">全部工序</option>
                {processOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {selectedProcess && config?.processPhRanges[selectedProcess] && (
                <p className="text-xs text-earth-500 mt-1">
                  目标PH范围: {config.processPhRanges[selectedProcess][0]} -{' '}
                  {config.processPhRanges[selectedProcess][1]}
                </p>
              )}
            </div>

            <div>
              <label className="label">面料类型</label>
              <select
                value={selectedFabric}
                onChange={(e) => setSelectedFabric(e.target.value as FabricType | '')}
                className="input"
              >
                <option value="">全部面料</option>
                {fabricOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">最小需求量 (L)</label>
              <input
                type="number"
                min="0"
                value={minVolume}
                onChange={(e) => setMinVolume(parseFloat(e.target.value) || 0)}
                className="input"
                placeholder="0"
              />
            </div>

            <div className="flex items-end">
              <button onClick={handleSearch} disabled={loading} className="btn btn-primary w-full">
                <Search className="w-4 h-4" />
                搜索推荐
              </button>
            </div>
          </div>
        </div>
      </div>

      {batchRecommendation && batchRecommendation.advice.length > 0 && (
        <div className="card border-2 border-indigo-200 bg-indigo-50">
          <div className="card-body">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-serif font-bold text-indigo-900 mb-2">智能建议</h3>
                <ul className="space-y-1">
                  {batchRecommendation.advice.map((advice, idx) => (
                    <li key={idx} className="text-sm text-indigo-800">
                      {advice}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {batchRecommendation && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-6 text-center">
            <p className="text-4xl font-bold text-earth-800">{batchRecommendation.totalAvailable}</p>
            <p className="text-sm text-earth-600 mt-1">可用批次</p>
          </div>
          <div className="card p-6 text-center">
            <p className="text-4xl font-bold text-green-600">{batchRecommendation.totalRecommended}</p>
            <p className="text-sm text-earth-600 mt-1">推荐批次</p>
          </div>
          <div className="card p-6 text-center">
            <p className="text-4xl font-bold text-orange-600">
              {batchRecommendation.totalAvailable - batchRecommendation.totalRecommended}
            </p>
            <p className="text-sm text-earth-600 mt-1">不推荐</p>
          </div>
          <div className="card p-6 text-center">
            <p className="text-4xl font-bold text-indigo-600">
              {batchRecommendation.processName || '-'}
            </p>
            <p className="text-sm text-earth-600 mt-1">目标工序</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card">
          <div className="card-body">
            <div className="text-center py-12 text-earth-500">
              <div className="animate-spin w-8 h-8 border-4 border-earth-300 border-t-earth-700 rounded-full mx-auto mb-4"></div>
              <p>正在分析批次数据...</p>
            </div>
          </div>
        </div>
      ) : !batchRecommendation ? (
        <div className="card">
          <div className="card-body">
            <div className="text-center py-12 text-earth-500">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">点击"搜索推荐"获取智能推荐</p>
              <p className="text-sm mt-1">选择工序、面料和需求量，系统将为您推荐最合适的批次</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {batchRecommendation.recommended.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-serif font-bold flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  推荐批次
                </h2>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {batchRecommendation.recommended.map((item) => renderBatchCard(item, true))}
                </div>
              </div>
            </div>
          )}

          {batchRecommendation.notRecommended.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-serif font-bold flex items-center gap-2">
                  <XCircle className="w-6 h-6 text-gray-400" />
                  暂不推荐
                </h2>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {batchRecommendation.notRecommended.map((item) => renderBatchCard(item, false))}
                </div>
              </div>
            </div>
          )}

          {batchRecommendation.totalAvailable === 0 && (
            <div className="card">
              <div className="card-body">
                <div className="text-center py-12 text-earth-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                  <p className="text-lg font-medium">当前没有符合条件的可用批次</p>
                  <p className="text-sm mt-1">建议调整筛选条件或制备新的灰水批次</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
