import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Info, Droplets, Filter, AlertTriangle, Activity, RefreshCw, Zap } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { useAppStore } from '@/store';
import { apiClient, formatDateTime, formatDate } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import PhIndicator from '@/components/PhIndicator';
import type { PhRecord, FilterRecord, UsageRecord, TrendAnalysis, WarningItem, AnalysisResult } from '@/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export default function PhCurve() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const selectedBatch = useAppStore((state) => state.selectedBatch);
  const config = useAppStore((state) => state.config);
  const loading = useAppStore((state) => state.loading);
  const loadBatch = useAppStore((state) => state.loadBatch);
  const analyzeBatch = useAppStore((state) => state.analyzeBatch);
  const [phRecords, setPhRecords] = useState<PhRecord[]>([]);
  const [filterRecords, setFilterRecords] = useState<FilterRecord[]>([]);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showWarnings, setShowWarnings] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (id) {
      loadBatch(id);
      loadRecords(id);
      loadAnalysis(id);
    }
  }, [id, loadBatch]);

  const loadRecords = async (batchId: string) => {
    try {
      const [phRes, filterRes, usageRes] = await Promise.all([
        apiClient.phRecords.list(batchId),
        apiClient.filterRecords.list(batchId),
        apiClient.usageRecords.list(batchId),
      ]);
      setPhRecords(phRes.data.sort((a, b) => 
        new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()
      ));
      setFilterRecords(filterRes.data);
      setUsageRecords(usageRes.data);
    } catch (err) {
      console.error('加载记录失败:', err);
    }
  };

  const loadAnalysis = async (batchId: string) => {
    try {
      const res = await apiClient.batches.analyze(batchId);
      setAnalysis(res.data);
    } catch (err) {
      console.error('加载分析数据失败:', err);
    }
  };

  const handleAnalyze = async () => {
    if (!id) return;
    setAnalyzing(true);
    try {
      const res = await analyzeBatch(id);
      setAnalysis(res);
    } finally {
      setAnalyzing(false);
    }
  };

  if (!id) return null;

  if (loading && !selectedBatch) {
    return (
      <div className="text-center py-12 text-earth-500">
        <div className="animate-spin w-8 h-8 border-4 border-earth-300 border-t-earth-700 rounded-full mx-auto mb-4"></div>
        <p>加载中...</p>
      </div>
    );
  }

  if (!selectedBatch) {
    return (
      <div className="text-center py-12 text-earth-500">
        <p className="text-lg font-medium">批次不存在</p>
        <button onClick={() => navigate('/')} className="btn btn-primary mt-4">
          返回列表
        </button>
      </div>
    );
  }

  const trendAnalysis = analysis?.trendAnalysis;
  const warnings = analysis?.warnings?.list || [];

  const labels = phRecords.map((record) => formatDateTime(record.measuredAt));
  const phValues = phRecords.map((record) => record.phValue);

  const pointStyles = phRecords.map((record, idx) => {
    const hasWarning = warnings.some((w) => {
      const wTime = new Date(w.timestamp || 0).getTime();
      const rTime = new Date(record.measuredAt).getTime();
      return Math.abs(wTime - rTime) < 1000 * 60 * 60 * 6;
    });
    if (hasWarning) return { style: 'triangle', color: '#ef4444' };
    if (record.phValue >= 8.5 && record.phValue <= 12.5) return { style: 'circle', color: '#22c55e' };
    return { style: 'circle', color: '#ef4444' };
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: 'PH值',
        data: phValues,
        borderColor: '#6366f1',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0.02)');
          return gradient;
        },
        fill: true,
        tension: 0.3,
        pointBackgroundColor: pointStyles.map((p) => p.color),
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: phRecords.map((r, idx) => pointStyles[idx].style === 'triangle' ? 10 : 6),
        pointStyle: pointStyles.map((p) => p.style),
        pointHoverRadius: 10,
        borderWidth: 3,
      },
      {
        label: '适用范围下限',
        data: phRecords.map(() => 8.5),
        borderColor: '#22c55e',
        borderDash: [5, 5],
        pointRadius: 0,
        borderWidth: 2,
        fill: false,
      },
      {
        label: '适用范围上限',
        data: phRecords.map(() => 12.5),
        borderColor: '#22c55e',
        borderDash: [5, 5],
        pointRadius: 0,
        borderWidth: 2,
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#5c4d3b',
          font: {
            family: "'Noto Sans SC', sans-serif",
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: `${selectedBatch.batchNumber} 碱度变化曲线`,
        color: '#3d2f1f',
        font: {
          family: "'Noto Serif SC', serif",
          size: 18,
          weight: 'bold' as const,
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: '#f5f0e8',
        titleColor: '#3d2f1f',
        bodyColor: '#5c4d3b',
        borderColor: '#c9b99a',
        borderWidth: 1,
        padding: 12,
        titleFont: {
          family: "'Noto Sans SC', sans-serif",
          size: 13,
        },
        bodyFont: {
          family: "'Noto Sans SC', sans-serif",
          size: 12,
        },
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.y;
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += value.toFixed(1);
            if (context.dataset.label === 'PH值') {
              const inRange = value >= 8.5 && value <= 12.5;
              label += inRange ? ' (适用)' : ' (不适用)';
            }
            return label;
          },
          afterLabel: (context: any) => {
            if (context.dataset.label !== 'PH值') return '';
            const idx = context.dataIndex;
            const record = phRecords[idx];
            if (!record) return '';
            const nearbyWarnings = warnings.filter((w) => {
              const wTime = new Date(w.timestamp || 0).getTime();
              const rTime = new Date(record.measuredAt).getTime();
              return Math.abs(wTime - rTime) < 1000 * 60 * 60 * 6;
            });
            if (nearbyWarnings.length > 0) {
              return nearbyWarnings.map((w) => `⚠ ${w.typeName}: ${w.message}`);
            }
            return '';
          },
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 14,
        ticks: {
          stepSize: 1,
          color: '#5c4d3b',
          font: {
            family: "'Noto Sans SC', sans-serif",
          },
        },
        grid: {
          color: 'rgba(92, 77, 59, 0.1)',
        },
        title: {
          display: true,
          text: 'PH值',
          color: '#3d2f1f',
          font: {
            family: "'Noto Sans SC', sans-serif",
            weight: 'bold' as const,
          },
        },
      },
      x: {
        ticks: {
          color: '#5c4d3b',
          font: {
            family: "'Noto Sans SC', sans-serif",
            size: 10,
          },
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          color: 'rgba(92, 77, 59, 0.1)',
        },
        title: {
          display: true,
          text: '检测时间',
          color: '#3d2f1f',
          font: {
            family: "'Noto Sans SC', sans-serif",
            weight: 'bold' as const,
          },
        },
      },
    },
  };

  const totalUsed = usageRecords.reduce((sum, r) => sum + r.volumeUsed, 0);
  const remaining = selectedBatch.waterVolume - totalUsed;

  const getTrendIcon = (trend?: string) => {
    if (trend === 'rising') return <TrendingUp className="w-4 h-4" />;
    if (trend === 'falling') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendClass = (trend?: string) => {
    if (trend === 'rising') return 'trend-rising';
    if (trend === 'falling') return 'trend-falling';
    return 'trend-stable';
  };

  const getWarningLevelClass = (level?: string) => {
    if (level === 'high') return 'warning-level-high';
    if (level === 'medium') return 'warning-level-medium';
    if (level === 'low') return 'warning-level-low';
    return '';
  };

  const getStatVolatility = () => {
    if (!trendAnalysis?.volatility) return 0;
    return trendAnalysis.volatility;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(`/batch/${id}`)} className="btn btn-outline">
          <ArrowLeft className="w-4 h-4" />
          返回详情
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWarnings(!showWarnings)}
            className="btn btn-outline text-sm"
          >
            <AlertTriangle className="w-4 h-4" />
            {showWarnings ? '隐藏预警标记' : '显示预警标记'}
          </button>
          <button
            onClick={() => setShowAnnotations(!showAnnotations)}
            className="btn btn-outline text-sm"
          >
            <Info className="w-4 h-4" />
            {showAnnotations ? '隐藏注释' : '显示注释'}
          </button>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="btn btn-primary text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? '分析中...' : '智能分析'}
          </button>
        </div>
      </div>

      {selectedBatch.hasWarning && (
        <div className={`warning-banner ${
          selectedBatch.warningLevel === 'high'
            ? 'bg-red-50 border-red-300 text-red-800'
            : selectedBatch.warningLevel === 'medium'
            ? 'bg-yellow-50 border-yellow-300 text-yellow-800'
            : 'bg-blue-50 border-blue-300 text-blue-800'
        }`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 animate-pulse-slow" />
            <span className="font-medium">
              检测到{analysis?.warnings?.list.length || 0}个质量预警
              {selectedBatch.usageRestricted && ' · 已限制使用'}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="card">
          <div className="card-body text-center">
            <PhIndicator ph={selectedBatch.currentPh} size="lg" showLabel={false} />
            <p className="text-sm text-earth-600 mt-2">当前PH</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <p className="text-3xl font-bold text-indigo-600">{phRecords.length}</p>
            <p className="text-sm text-earth-600 mt-2">检测次数</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            {trendAnalysis ? (
              <>
                <div className={`inline-flex items-center gap-2 trend-indicator ${getTrendClass(trendAnalysis.trend)}`}>
                  {getTrendIcon(trendAnalysis.trend)}
                  <p className="text-2xl font-bold">
                    {trendAnalysis.totalChange > 0 ? '+' : ''}
                    {trendAnalysis.totalChange.toFixed(2)}
                  </p>
                </div>
                <p className="text-sm text-earth-600 mt-2">{trendAnalysis.trendName}</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-earth-400">--</p>
                <p className="text-sm text-earth-600 mt-2">趋势</p>
              </>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            {trendAnalysis ? (
              <>
                <p className="text-2xl font-bold text-purple-600">
                  {trendAnalysis.changeRate >= 0 ? '+' : ''}
                  {trendAnalysis.changeRate.toFixed(3)}
                </p>
                <p className="text-sm text-earth-600 mt-2">变化速率/时</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-earth-400">--</p>
                <p className="text-sm text-earth-600 mt-2">变化速率</p>
              </>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            {trendAnalysis ? (
              <>
                <div className="flex items-center justify-center gap-1">
                  <Activity className="w-5 h-5 text-amber-600" />
                  <p className={`text-2xl font-bold ${
                    getStatVolatility() > 0.5 ? 'text-red-600' : getStatVolatility() > 0.3 ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {getStatVolatility().toFixed(2)}
                  </p>
                </div>
                <p className="text-sm text-earth-600 mt-2">波动指数</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-earth-400">--</p>
                <p className="text-sm text-earth-600 mt-2">波动指数</p>
              </>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <StatusBadge status={selectedBatch.status} size="lg" />
            <p className="text-sm text-earth-600 mt-2">
              剩余 {remaining.toFixed(1)}L
            </p>
          </div>
        </div>
      </div>

      {warnings.length > 0 && showWarnings && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                关联预警 ({warnings.length})
              </h2>
            </div>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {warnings.map((warning) => (
                <div
                  key={warning.type}
                  className={`warning-card ${getWarningLevelClass(warning.level)}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <h5 className="font-bold">{warning.typeName}</h5>
                      </div>
                      <p className="text-sm mt-1 opacity-80">{warning.message}</p>
                    </div>
                    <span className="text-xs font-medium whitespace-nowrap">
                      {formatDateTime(warning.timestamp)}
                    </span>
                  </div>
                  {warning.advice && (
                    <p className="text-xs mt-2 p-2 bg-black/5 rounded">
                      💡 {warning.advice}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold">碱度变化趋势</h2>
            <div className="flex items-center gap-4 text-sm text-earth-600">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-green-500" style={{ borderStyle: 'dashed' }}></div>
                <span>适用范围 8.5-12.5</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>适用</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>不适用</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-red-500" />
                <span>预警点</span>
              </div>
            </div>
          </div>
        </div>
        <div className="card-body">
          {phRecords.length === 0 ? (
            <div className="text-center py-16 text-earth-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>暂无PH检测记录，无法生成曲线</p>
              <p className="text-sm mt-2">请先添加PH检测记录</p>
            </div>
          ) : (
            <div className="relative" style={{ height: '400px' }}>
              <Line data={chartData} options={chartOptions} />

              {showAnnotations && (
                <>
                  {filterRecords.map((filter, idx) => {
                    const filterTime = new Date(filter.filterDate).getTime();
                    const recordTimes = phRecords.map((r) =>
                      new Date(r.measuredAt).getTime()
                    );
                    const position = recordTimes.filter((t) => t < filterTime).length;
                    const xPercent = (position / Math.max(1, phRecords.length - 1)) * 100;

                    if (position === 0 || position >= phRecords.length) return null;

                    return (
                      <div
                        key={filter.id}
                        className="absolute top-0 bottom-0 border-l-2 border-dashed border-yellow-500 pointer-events-none"
                        style={{ left: `${xPercent}%` }}
                      >
                        <div className="absolute top-2 left-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                          <Filter className="w-3 h-3 inline mr-1" />
                          第{filter.filterCount}次过滤
                        </div>
                      </div>
                    );
                  })}

                  {usageRecords.map((usage, idx) => {
                    const usageTime = new Date(usage.usageDate).getTime();
                    const recordTimes = phRecords.map((r) =>
                      new Date(r.measuredAt).getTime()
                    );
                    const position = recordTimes.filter((t) => t < usageTime).length;
                    const xPercent = (position / Math.max(1, phRecords.length - 1)) * 100;

                    if (position === 0 || position >= phRecords.length) return null;

                    return (
                      <div
                        key={usage.id}
                        className="absolute top-0 bottom-0 border-l-2 border-dashed border-indigo-400 pointer-events-none"
                        style={{ left: `${xPercent}%` }}
                      >
                        <div className="absolute bottom-2 left-1 bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                          <Droplets className="w-3 h-3 inline mr-1" />
                          {config?.processNames[usage.process] || usage.process} ({usage.volumeUsed}L)
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {phRecords.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-serif font-bold">统计分析</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
              <div className="p-4 bg-parchment-100 rounded-lg">
                <p className="text-sm text-earth-500">PH最小值</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {Math.min(...phValues).toFixed(1)}
                </p>
              </div>
              <div className="p-4 bg-parchment-100 rounded-lg">
                <p className="text-sm text-earth-500">PH最大值</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {Math.max(...phValues).toFixed(1)}
                </p>
              </div>
              <div className="p-4 bg-parchment-100 rounded-lg">
                <p className="text-sm text-earth-500">PH平均值</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {(phValues.reduce((a, b) => a + b, 0) / phValues.length).toFixed(1)}
                </p>
              </div>
              <div className="p-4 bg-parchment-100 rounded-lg">
                <p className="text-sm text-earth-500">适用检测占比</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {(
                    (phValues.filter((ph) => ph >= 8.5 && ph <= 12.5).length /
                      phValues.length) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
              <div className="p-4 bg-parchment-100 rounded-lg">
                <p className="text-sm text-earth-500">检测跨度</p>
                <p className="text-2xl font-bold text-earth-700 mt-1">
                  {Math.ceil(
                    (new Date(phRecords[phRecords.length - 1].measuredAt).getTime() -
                      new Date(phRecords[0].measuredAt).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}
                  天
                </p>
              </div>
              <div className="p-4 bg-parchment-100 rounded-lg">
                <p className="text-sm text-earth-500">连续异常</p>
                <p className={`text-2xl font-bold mt-1 ${
                  (selectedBatch.consecutiveAbnormalCount || 0) >= 3 ? 'text-red-600' : (selectedBatch.consecutiveAbnormalCount || 0) >= 1 ? 'text-amber-600' : 'text-green-600'
                }`}>
                  {selectedBatch.consecutiveAbnormalCount || 0}
                  次
                </p>
              </div>
            </div>

            {trendAnalysis && (
              <div className="mt-6 p-4 vintage-border bg-parchment-200/30">
                <h3 className="font-serif font-bold text-lg mb-4">趋势深度分析</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-center">
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-xs text-earth-500">趋势状态</p>
                    <div className={`mt-1 inline-flex items-center gap-2 trend-indicator ${getTrendClass(trendAnalysis.trend)}`}>
                      {getTrendIcon(trendAnalysis.trend)}
                      <span className="font-bold">{trendAnalysis.trendName}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-xs text-earth-500">累计变化</p>
                    <p className={`text-xl font-bold mt-1 ${
                      trendAnalysis.totalChange > 0 ? 'text-red-600' : trendAnalysis.totalChange < 0 ? 'text-blue-600' : 'text-earth-600'
                    }`}>
                      {trendAnalysis.totalChange > 0 ? '+' : ''}{trendAnalysis.totalChange.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-xs text-earth-500">变化速率</p>
                    <p className="text-xl font-bold mt-1 text-purple-600">
                      {trendAnalysis.changeRate >= 0 ? '+' : ''}{trendAnalysis.changeRate.toFixed(3)}/h
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-xs text-earth-500">波动指数</p>
                    <p className={`text-xl font-bold mt-1 ${
                      trendAnalysis.volatility > 0.5 ? 'text-red-600' : trendAnalysis.volatility > 0.3 ? 'text-amber-600' : 'text-green-600'
                    }`}>
                      {trendAnalysis.volatility.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-xs text-earth-500">平均PH</p>
                    <p className="text-xl font-bold mt-1 text-indigo-600">
                      {trendAnalysis.avgPh.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-serif font-bold">PH检测记录详情</h2>
        </div>
        <div className="card-body">
          {phRecords.length === 0 ? (
            <p className="text-earth-500 text-center py-4">暂无检测记录</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>PH值</th>
                    <th>检测时间</th>
                    <th>检测人</th>
                    <th>状态</th>
                    <th>预警</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {phRecords.map((record, idx) => {
                    const hasWarning = warnings.some((w) => {
                      const wTime = new Date(w.timestamp || 0).getTime();
                      const rTime = new Date(record.measuredAt).getTime();
                      return Math.abs(wTime - rTime) < 1000 * 60 * 60 * 6;
                    });
                    return (
                      <tr key={record.id}>
                        <td className="font-medium text-earth-500">#{idx + 1}</td>
                        <td>
                          <span
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm"
                            style={{
                              backgroundColor:
                                record.phValue >= 8.5 && record.phValue <= 12.5
                                  ? '#22c55e'
                                  : '#ef4444',
                            }}
                          >
                            {record.phValue.toFixed(1)}
                          </span>
                        </td>
                        <td>{formatDateTime(record.measuredAt)}</td>
                        <td>{record.measuredBy || '-'}</td>
                        <td>
                          {record.phValue >= 8.5 && record.phValue <= 12.5 ? (
                            <span className="badge bg-green-100 text-green-800">适用</span>
                          ) : (
                            <span className="badge bg-red-100 text-red-800">不适用</span>
                          )}
                        </td>
                        <td>
                          {hasWarning ? (
                            <span className="badge bg-red-100 text-red-800 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              预警
                            </span>
                          ) : (
                            <span className="badge bg-gray-100 text-gray-600">正常</span>
                          )}
                        </td>
                        <td className="text-earth-600">{record.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
