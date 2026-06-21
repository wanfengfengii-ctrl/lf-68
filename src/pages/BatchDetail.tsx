import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, FlaskConical, Filter, Droplets, TrendingUp, Plus, Clock, Thermometer, Factory, Calendar, AlertTriangle, AlertCircle, TrendingDown, Minus, RefreshCw, CheckCircle, XCircle, Star
} from 'lucide-react';
import { useAppStore } from '@/store';
import { apiClient, formatDateTime, formatDate, getPhColor } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import PhIndicator from '@/components/PhIndicator';
import PhRecordModal from '@/components/PhRecordModal';
import FilterRecordModal from '@/components/FilterRecordModal';
import UsageRecordModal from '@/components/UsageRecordModal';
import type {
  PhRecord,
  FilterRecord,
  UsageRecord,
  ApplicabilityInfo,
  WarningLevel,
  WarningItem,
  ProcessRecommendation,
  RecommendationResult,
} from '@/types';

type TabType = 'overview' | 'ph' | 'filter' | 'usage' | 'applicability' | 'warnings' | 'recommendations';

export default function BatchDetail() {
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
  const [applicability, setApplicability] = useState<ApplicabilityInfo | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
  const [warnings, setWarnings] = useState<WarningItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showPhModal, setShowPhModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (id) {
      loadBatch(id);
      loadRecords(id);
    }
  }, [id, loadBatch]);

  const loadRecords = async (batchId: string) => {
    try {
      const [phRes, filterRes, usageRes, appRes] = await Promise.all([
        apiClient.phRecords.list(batchId),
        apiClient.filterRecords.list(batchId),
        apiClient.usageRecords.list(batchId),
        apiClient.batches.applicability(batchId),
      ]);
      setPhRecords(phRes.data);
      setFilterRecords(filterRes.data);
      setUsageRecords(usageRes.data);
      setApplicability(appRes.data);
      setWarnings(appRes.data.warnings?.warnings || []);
      setRecommendations(appRes.data.recommendations || null);
    } catch (err) {
      console.error('加载记录失败:', err);
    }
  };

  const handleAnalyze = async () => {
    if (!id) return;
    setAnalyzing(true);
    try {
      const result = await analyzeBatch(id);
      setWarnings(result.warnings.warnings);
      setRecommendations(result.recommendations);
      await loadRecords(id);
    } catch (err) {
      console.error('分析失败:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  if (!id) return null;

  const tabs: { key: TabType; label: string; icon: any; badge?: number }[] = [
    { key: 'overview', label: '概览', icon: FlaskConical },
    { key: 'warnings', label: '预警中心', icon: AlertTriangle, badge: warnings.length },
    { key: 'recommendations', label: '智能推荐', icon: Star },
    { key: 'ph', label: 'PH检测', icon: TrendingUp },
    { key: 'filter', label: '过滤记录', icon: Filter },
    { key: 'usage', label: '使用记录', icon: Droplets },
    { key: 'applicability', label: '工序适配', icon: Factory },
  ];

  const handlePhRecordAdded = () => {
    setShowPhModal(false);
    if (id) {
      loadBatch(id);
      loadRecords(id);
    }
  };

  const handleFilterRecordAdded = () => {
    setShowFilterModal(false);
    if (id) {
      loadBatch(id);
      loadRecords(id);
    }
  };

  const handleUsageRecordAdded = () => {
    setShowUsageModal(false);
    if (id) {
      loadBatch(id);
      loadRecords(id);
    }
  };

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

  const totalUsed = usageRecords.reduce((sum, r) => sum + r.volumeUsed, 0);
  const remaining = selectedBatch.waterVolume - totalUsed;

  const getWarningLevelClass = (level: WarningLevel | null | undefined) => {
    switch (level) {
      case 'high':
        return 'warning-card-high';
      case 'medium':
        return 'warning-card-medium';
      case 'low':
        return 'warning-card-low';
      default:
        return 'warning-card-medium';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="w-5 h-5" />;
      case 'falling':
        return <TrendingDown className="w-5 h-5" />;
      default:
        return <Minus className="w-5 h-5" />;
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

  const getTrendText = (trend?: string) => {
    switch (trend) {
      case 'rising':
        return '上升趋势';
      case 'falling':
        return '下降趋势';
      default:
        return '稳定';
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

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="btn btn-outline">
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="btn btn-outline text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
            智能分析
          </button>
          <Link to={`/batch/${id}/curve`} className="btn btn-accent">
            <TrendingUp className="w-4 h-4" />
            查看曲线
          </Link>
        </div>
      </div>

      {selectedBatch.hasWarning && (
        <div className={`warning-card ${getWarningLevelClass(selectedBatch.warningLevel)}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-6 h-6 mt-0.5 ${
                selectedBatch.warningLevel === 'high'
                  ? 'text-red-600'
                  : selectedBatch.warningLevel === 'medium'
                  ? 'text-yellow-600'
                  : 'text-blue-600'
              }`} />
              <div>
                <h3 className="font-bold text-lg mb-1">
                  {selectedBatch.warningLevel === 'high'
                    ? '严重预警'
                    : selectedBatch.warningLevel === 'medium'
                    ? '警告'
                    : '提示'}
                </h3>
                <div className="space-y-1">
                  {warnings.slice(0, 3).map((w, idx) => (
                    <p key={idx} className="text-sm">
                      • {w.message}
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('warnings')}
              className="btn btn-outline text-sm"
            >
              查看详情
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-serif font-bold">{selectedBatch.batchNumber}</h1>
              <p className="text-earth-600">{selectedBatch.rawMaterialSource}</p>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <StatusBadge status={selectedBatch.status} />
              {selectedBatch.usageRestricted && (
                <span className="badge bg-red-200 text-red-800 animate-pulse-slow">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  限制使用
                </span>
              )}
              {selectedBatch.isApplicable ? (
                <span className="badge bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 inline mr-1" />
                  适用
                </span>
              ) : (
                <span className="badge bg-red-100 text-red-800">
                  <XCircle className="w-3 h-3 inline mr-1" />
                  不适用
                </span>
              )}
              <span className={`trend-indicator ${getTrendClass(selectedBatch.phTrend)}`}>
                {getTrendIcon(selectedBatch.phTrend)}
                {getTrendText(selectedBatch.phTrend)}
              </span>
            </div>
          </div>
        </div>

        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
            <div className="text-center p-4 bg-parchment-200/50 rounded-lg">
              <PhIndicator ph={selectedBatch.currentPh} size="lg" showLabel={false} />
              <p className="text-sm text-earth-600 mt-2">当前PH</p>
            </div>
            <div className="text-center p-4 bg-parchment-200/50 rounded-lg">
              <p className="text-3xl font-bold text-earth-800">{selectedBatch.filterCount}</p>
              <p className="text-sm text-earth-600 mt-2">过滤次数</p>
            </div>
            <div className="text-center p-4 bg-parchment-200/50 rounded-lg">
              <p className="text-3xl font-bold text-earth-800">{selectedBatch.waterVolume}L</p>
              <p className="text-sm text-earth-600 mt-2">总容量</p>
            </div>
            <div className="text-center p-4 bg-parchment-200/50 rounded-lg">
              <p className="text-3xl font-bold text-earth-800">{remaining.toFixed(1)}L</p>
              <p className="text-sm text-earth-600 mt-2">剩余量</p>
            </div>
            <div className="text-center p-4 bg-parchment-200/50 rounded-lg">
              <p className={`text-3xl font-bold ${selectedBatch.consecutiveAbnormalCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {selectedBatch.consecutiveAbnormalCount || 0}
              </p>
              <p className="text-sm text-earth-600 mt-2">连续异常次数</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-6">
            <div className="flex items-center gap-3 p-3 bg-parchment-100 rounded-lg">
              <Factory className="w-5 h-5 text-moss-600" />
              <div>
                <p className="text-earth-500">草木灰重量</p>
                <p className="font-medium">{selectedBatch.ashWeight} kg</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-parchment-100 rounded-lg">
              <Calendar className="w-5 h-5 text-earth-600" />
              <div>
                <p className="text-earth-500">浸泡开始</p>
                <p className="font-medium">{formatDate(selectedBatch.soakStartDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-parchment-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-earth-500">浸泡时长</p>
                <p className="font-medium">{selectedBatch.soakDurationHours} 小时</p>
              </div>
            </div>
            {selectedBatch.soakTemperature && (
              <div className="flex items-center gap-3 p-3 bg-parchment-100 rounded-lg">
                <Thermometer className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-earth-500">浸泡温度</p>
                  <p className="font-medium">{selectedBatch.soakTemperature}°C</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-parchment-100 rounded-lg">
              <Droplets className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-earth-500">已使用</p>
                <p className="font-medium">{totalUsed.toFixed(1)} L ({((totalUsed / selectedBatch.waterVolume) * 100).toFixed(1)}%)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-parchment-100 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-earth-500">创建时间</p>
                <p className="font-medium">{formatDate(selectedBatch.createdAt)}</p>
              </div>
            </div>
            {selectedBatch.lastPhCheckTime && (
              <div className="flex items-center gap-3 p-3 bg-parchment-100 rounded-lg">
                <Clock className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-earth-500">最后PH检测</p>
                  <p className="font-medium">{formatDateTime(selectedBatch.lastPhCheckTime)}</p>
                </div>
              </div>
            )}
            {selectedBatch.phChangeRate !== undefined && selectedBatch.phChangeRate !== 0 && (
              <div className="flex items-center gap-3 p-3 bg-parchment-100 rounded-lg">
                <TrendingUp className={`w-5 h-5 ${selectedBatch.phChangeRate > 0 ? 'text-red-500' : 'text-blue-500'}`} />
                <div>
                  <p className="text-earth-500">PH变化速率</p>
                  <p className="font-medium">
                    {selectedBatch.phChangeRate > 0 ? '+' : ''}
                    {selectedBatch.phChangeRate.toFixed(4)} /小时
                  </p>
                </div>
              </div>
            )}
          </div>

          {recommendations?.recommended && recommendations.recommended.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <p className="text-sm font-medium text-green-800 mb-3 flex items-center gap-2">
                <Star className="w-4 h-4" />
                推荐工序（综合评分 {recommendations.overallScore}/100）
              </p>
              <div className="flex flex-wrap gap-2">
                {recommendations.recommended.map((rec) => (
                  <span
                    key={rec.process}
                    className="px-3 py-1.5 bg-green-100 text-green-800 text-sm rounded-full font-medium flex items-center gap-1"
                  >
                    {rec.processName}
                    <span className="text-xs bg-green-200 px-1.5 py-0.5 rounded">
                      {rec.score}分
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {selectedBatch.applicableProcesses.length > 0 && !recommendations && (
            <div className="mt-6 pt-6 border-t border-earth-200">
              <p className="text-sm font-medium text-earth-700 mb-3">适用工序</p>
              <div className="flex flex-wrap gap-2">
                {selectedBatch.applicableProcesses.map((process) => (
                  <span
                    key={process}
                    className="px-3 py-1.5 bg-moss-100 text-moss-700 text-sm rounded-full font-medium"
                  >
                    {config?.processNames[process] || process}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex border-b border-earth-200 mb-6 overflow-x-auto">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`tab flex items-center gap-2 whitespace-nowrap ${activeTab === tab.key ? 'tab-active' : ''}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-lg font-serif font-bold">
            {tabs.find((t) => t.key === activeTab)?.label}
          </h2>
          {activeTab === 'ph' && (
            <button onClick={() => setShowPhModal(true)} className="btn btn-primary text-sm">
              <Plus className="w-4 h-4" />
              添加检测
            </button>
          )}
          {activeTab === 'filter' && (
            <button onClick={() => setShowFilterModal(true)} className="btn btn-secondary text-sm">
              <Plus className="w-4 h-4" />
              添加过滤
            </button>
          )}
          {activeTab === 'usage' && (
            <button
              onClick={() => setShowUsageModal(true)}
              className="btn btn-accent text-sm"
              disabled={!selectedBatch.isApplicable || selectedBatch.status === 'exhausted' || selectedBatch.usageRestricted}
            >
              <Plus className="w-4 h-4" />
              {selectedBatch.usageRestricted ? '已限制使用' : '登记使用'}
            </button>
          )}
        </div>

        <div className="card-body">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {recommendations?.trendAnalysis && (
                <div className="vintage-border p-6 bg-parchment-200/30">
                  <h3 className="font-serif font-bold text-lg mb-4">PH趋势分析</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                    <div className="p-4 bg-parchment-50 rounded-lg">
                      <p className="text-sm text-earth-500">趋势状态</p>
                      <div className={`mt-2 inline-flex items-center gap-2 trend-indicator ${getTrendClass(recommendations.trendAnalysis.trend)}`}>
                        {getTrendIcon(recommendations.trendAnalysis.trend)}
                        <span className="font-medium text-lg">{recommendations.trendAnalysis.trendName}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-parchment-50 rounded-lg">
                      <p className="text-sm text-earth-500">累计变化</p>
                      <p className={`text-2xl font-bold mt-2 ${
                        recommendations.trendAnalysis.totalChange > 0
                          ? 'text-red-600'
                          : recommendations.trendAnalysis.totalChange < 0
                          ? 'text-blue-600'
                          : 'text-green-600'
                      }`}>
                        {recommendations.trendAnalysis.totalChange > 0 ? '+' : ''}
                        {recommendations.trendAnalysis.totalChange}
                      </p>
                    </div>
                    <div className="p-4 bg-parchment-50 rounded-lg">
                      <p className="text-sm text-earth-500">变化速率</p>
                      <p className="text-2xl font-bold mt-2 text-indigo-600">
                        {recommendations.trendAnalysis.changeRate > 0 ? '+' : ''}
                        {recommendations.trendAnalysis.changeRate.toFixed(4)}
                        <span className="text-sm font-normal">/h</span>
                      </p>
                    </div>
                    <div className="p-4 bg-parchment-50 rounded-lg">
                      <p className="text-sm text-earth-500">波动指数</p>
                      <p className={`text-2xl font-bold mt-2 ${
                        recommendations.trendAnalysis.volatility > 1
                          ? 'text-orange-600'
                          : 'text-green-600'
                      }`}>
                        {recommendations.trendAnalysis.volatility.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 bg-parchment-50 rounded-lg">
                      <p className="text-sm text-earth-500">平均PH</p>
                      <p className="text-2xl font-bold mt-2 text-purple-600">
                        {recommendations.trendAnalysis.avgPh?.toFixed(1) || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="vintage-border p-6 bg-parchment-200/30">
                <h3 className="font-serif font-bold text-lg mb-4">批次生命周期</h3>
                <div className="flex flex-col md:flex-row items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="font-medium">浸泡中</span>
                      <span className="text-sm text-earth-500 ml-auto">
                        {formatDate(selectedBatch.soakStartDate)}
                      </span>
                    </div>
                    <div className="ml-1.5 border-l-2 border-earth-300 pl-6 pb-4">
                      <p className="text-sm text-earth-600">
                        {selectedBatch.soakDurationHours}小时浸泡，温度{selectedBatch.soakTemperature || '25'}°C
                      </p>
                    </div>
                  </div>
                  {selectedBatch.filterCount > 0 && (
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="font-medium">过滤</span>
                        <span className="text-sm text-earth-500 ml-auto">
                          {filterRecords.length > 0
                            ? formatDate(filterRecords[filterRecords.length - 1].filterDate)
                            : '-'}
                        </span>
                      </div>
                      <div className="ml-1.5 border-l-2 border-earth-300 pl-6 pb-4">
                        <p className="text-sm text-earth-600">
                          共{selectedBatch.filterCount}次过滤
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          selectedBatch.status === 'available'
                            ? 'bg-green-500'
                            : selectedBatch.status === 'exhausted'
                            ? 'bg-red-500'
                            : selectedBatch.hasWarning
                            ? 'bg-orange-500'
                            : 'bg-gray-500'
                        }`}
                      ></div>
                      <span className="font-medium">
                        {config?.statusNames[selectedBatch.status]}
                      </span>
                      <span className="text-sm text-earth-500 ml-auto">
                        {formatDate(selectedBatch.updatedAt)}
                      </span>
                    </div>
                    <div className="ml-1.5 border-l-2 border-earth-300 pl-6">
                      <p className="text-sm text-earth-600">
                        {selectedBatch.usageRestricted
                          ? '批次已被限制使用'
                          : selectedBatch.status === 'available'
                          ? `剩余${remaining.toFixed(1)}L可用`
                          : selectedBatch.status === 'exhausted'
                          ? '批次已用尽'
                          : '等待检测PH检测'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-serif font-bold text-lg mb-3">最近PH检测</h3>
                  {phRecords.length === 0 ? (
                    <p className="text-earth-500 text-sm">暂无检测记录</p>
                  ) : (
                    <div className="space-y-2">
                      {phRecords.slice(-3).reverse().map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between p-3 bg-parchment-100 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                              style={{
                                backgroundColor:
                                  record.phValue >= 8.5 && record.phValue <= 12.5
                                    ? '#22c55e'
                                    : '#ef4444',
                              }}
                            >
                              {record.phValue.toFixed(1)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{record.notes || 'PH检测'}</p>
                              <p className="text-xs text-earth-500">
                                {formatDateTime(record.measuredAt)}
                              </p>
                            </div>
                          </div>
                          {record.measuredBy && (
                            <span className="text-xs text-earth-500">{record.measuredBy}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-serif font-bold text-lg mb-3">最近使用记录</h3>
                  {usageRecords.length === 0 ? (
                    <p className="text-earth-500 text-sm">暂无使用记录</p>
                  ) : (
                    <div className="space-y-2">
                      {usageRecords.slice(-3).reverse().map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between p-3 bg-parchment-100 rounded-lg"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {config?.processNames[record.process] || record.process}
                            </p>
                            <p className="text-xs text-earth-500">
                              {formatDateTime(record.usageDate)}
                            </p>
                          </div>
                          <span className="text-sm font-medium text-earth-700">
                            {record.volumeUsed}L
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'warnings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif font-bold text-lg">预警记录</h3>
                <button onClick={handleAnalyze} disabled={analyzing} className="btn btn-primary text-sm">
                  <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
                  重新检测
                </button>
              </div>
              {warnings.length === 0 ? (
                <div className="text-center py-12 text-earth-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium text-green-700">暂无预警</p>
                  <p className="text-sm mt-1">该批次各项指标正常</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {warnings.map((warning, idx) => (
                    <div
                      key={idx}
                      className={`warning-card ${getWarningLevelClass(selectedBatch.warningLevel)}`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                          selectedBatch.warningLevel === 'high'
                            ? 'text-red-600'
                            : selectedBatch.warningLevel === 'medium'
                            ? 'text-yellow-600'
                            : 'text-blue-600'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`badge ${
                              selectedBatch.warningLevel === 'high'
                                ? 'warning-level-high'
                                : selectedBatch.warningLevel === 'medium'
                                ? 'warning-level-medium'
                                : 'warning-level-low'
                            }`}>
                              {config?.warningTypes[warning.type] || warning.type}
                            </span>
                            {warning.count !== undefined && (
                              <span className="text-sm text-earth-600">
                                连续{warning.count}次
                              </span>
                            )}
                          </div>
                          <p className="text-sm">{warning.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedBatch.usageRestricted && (
                <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <div>
                      <h4 className="font-bold text-red-800">使用限制通知</h4>
                      <p className="text-sm text-red-700 mt-1">
                        因PH值连续异常，该批次已被自动限制使用。建议进行以下处理：
                      </p>
                      <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                        <li>检查草木灰水是否受到污染</li>
                        <li>考虑进行额外的过滤处理</li>
                        <li>检测原料来源是否有变化</li>
                        <li>如确认正常，可通过添加新检测记录解除限制</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-lg">智能工序推荐</h3>
                <button onClick={handleAnalyze} disabled={analyzing} className="btn btn-primary text-sm">
                  <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
                  重新分析
                </button>
              </div>

              {!recommendations ? (
                <div className="text-center py-12 text-earth-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">暂无推荐数据</p>
                  <p className="text-sm mt-1">点击上方"重新分析"按钮获取智能推荐</p>
                </div>
              ) : (
                <>
                  {recommendations.requiresAttention.length > 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        注意事项
                      </h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {recommendations.requiresAttention.map((item, idx) => (
                          <li key={idx}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-parchment-100 rounded-lg text-center">
                      <p className="text-sm text-earth-500">综合适配评分</p>
                      <p className={`text-4xl font-bold mt-2 ${getScoreColor(recommendations.overallScore)}`}>
                        {recommendations.overallScore}
                        <span className="text-lg font-normal">/100</span>
                      </p>
                    </div>
                    {recommendations.trendAnalysis && (
                      <div className="p-4 bg-parchment-100 rounded-lg">
                        <p className="text-sm text-earth-500 text-center">趋势状态</p>
                        <div className="flex items-center justify-center gap-3 mt-2">
                          <span className={`trend-indicator ${getTrendClass(recommendations.trendAnalysis.trend)} text-lg`}>
                            {getTrendIcon(recommendations.trendAnalysis.trend)}
                            {recommendations.trendAnalysis.trendName}
                          </span>
                          <span className="text-sm text-earth-600">
                            波动 {recommendations.trendAnalysis.volatility.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {recommendations.recommended.length > 0 && (
                    <div>
                      <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        推荐工序
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recommendations.recommended.map((rec) => (
                          <div key={rec.process} className="recommendation-card recommended">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-bold text-green-900">{rec.processName}</h5>
                              <div className="text-right">
                                <p className={`text-2xl font-bold ${getScoreColor(rec.score)}`}>
                                  {rec.score}
                                  <span className="text-sm font-normal">分</span>
                                </p>
                              </div>
                            </div>
                            <div className="score-bar mb-3">
                              <div
                                className={`score-bar-fill ${getScoreBarColor(rec.score)}`}
                                style={{ width: `${rec.score}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-earth-600 mb-2">
                              PH范围：{rec.minPh} - {rec.maxPh}
                              {rec.inRange && (
                                <span className="text-green-600 ml-2">✓ 当前PH适配合格</span>
                              )}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {rec.reasons.map((reason, idx) => (
                                <span key={idx} className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                  {reason}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recommendations.notRecommended.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-600 mb-3 flex items-center gap-2">
                        <XCircle className="w-5 h-5" />
                        暂不推荐
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recommendations.notRecommended.map((rec) => (
                          <div key={rec.process} className="recommendation-card not-recommended">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-bold text-gray-700">{rec.processName}</h5>
                              <div className="text-right">
                                <p className={`text-2xl font-bold ${getScoreColor(rec.score)}`}>
                                  {rec.score}
                                  <span className="text-sm font-normal">分</span>
                                </p>
                              </div>
                            </div>
                            <div className="score-bar mb-3">
                              <div
                                className={`score-bar-fill ${getScoreBarColor(rec.score)}`}
                                style={{ width: `${rec.score}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-earth-600 mb-2">
                              PH范围：{rec.minPh} - {rec.maxPh}
                              {!rec.inRange && (
                                <span className="text-red-600 ml-2">✗ 当前PH不适配</span>
                              )}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {rec.reasons.map((reason, idx) => (
                                <span key={idx} className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                                  {reason}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'ph' && (
            <div className="overflow-x-auto">
              {phRecords.length === 0 ? (
                <p className="text-earth-500 text-center py-8">暂无PH检测记录</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>PH值</th>
                      <th>检测时间</th>
                      <th>检测人</th>
                      <th>备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...phRecords].reverse().map((record) => (
                      <tr key={record.id}>
                        <td>
                          <span
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-sm"
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
                        <td className="text-earth-600">{record.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'filter' && (
            <div className="overflow-x-auto">
              {filterRecords.length === 0 ? (
                <p className="text-earth-500 text-center py-8">暂无过滤记录</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                    <th>次数</th>
                    <th>过滤日期</th>
                    <th>过滤方式</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {[...filterRecords].reverse().map((record) => (
                    <tr key={record.id}>
                      <td>
                        <span className="badge bg-moss-100 text-moss-700">
                          第{record.filterCount}次
                        </span>
                      </td>
                      <td>{formatDateTime(record.filterDate)}</td>
                      <td>{record.filterMethod || '-'}</td>
                      <td className="text-earth-600">{record.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="overflow-x-auto">
            {usageRecords.length === 0 ? (
              <p className="text-earth-500 text-center py-8">暂无使用记录</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>工序</th>
                    <th>使用日期</th>
                    <th>使用量</th>
                    <th>使用人</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {[...usageRecords].reverse().map((record) => (
                    <tr key={record.id}>
                      <td>
                        <span className="badge bg-indigo-100 text-indigo-700">
                          {config?.processNames[record.process] || record.process}
                        </span>
                      </td>
                      <td>{formatDateTime(record.usageDate)}</td>
                      <td className="font-medium">{record.volumeUsed}L</td>
                      <td>{record.usedBy || '-'}</td>
                      <td className="text-earth-600">{record.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'applicability' && applicability && (
          <div className="space-y-6">
            <div className="vintage-border p-6 bg-parchment-200/30">
              <h3 className="font-serif font-bold text-lg mb-4">适用性评估</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-parchment-50 rounded-lg">
                  <p className="text-sm text-earth-500">当前PH</p>
                  <p
                    className="text-3xl font-bold mt-2"
                    style={{
                      color:
                        applicability.currentPh !== null &&
                        applicability.currentPh >= applicability.applicableRange.min &&
                        applicability.currentPh <= applicability.applicableRange.max
                          ? '#22c55e'
                          : '#ef4444',
                    }}
                  >
                    {applicability.currentPh?.toFixed(1) || '-'}
                  </p>
                </div>
                <div className="p-4 bg-parchment-50 rounded-lg">
                  <p className="text-sm text-earth-500">可用范围</p>
                  <p className="text-3xl font-bold mt-2 text-moss-700">
                    {applicability.applicableRange.min} - {applicability.applicableRange.max}
                  </p>
                </div>
                <div className="p-4 bg-parchment-50 rounded-lg">
                  <p className="text-sm text-earth-500">状态</p>
                  <p
                    className={`text-2xl font-bold mt-2 ${
                      applicability.isApplicable ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {applicability.isApplicable ? '适用' : '不适用'}
                  </p>
                </div>
              </div>
            </div>

            <h3 className="font-serif font-bold text-lg">工序适配性</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {applicability.processDetails.map((detail) => (
                <div
                  key={detail.process}
                  className={`p-4 rounded-lg border-2 ${
                    detail.isApplicable
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-earth-900">{detail.processName}</span>
                    <span
                      className={`text-sm ${
                        detail.isApplicable ? 'text-green-600' : 'text-gray-500'
                      }`}
                    >
                      {detail.isApplicable ? '✓ 适用' : '✗ 不适用'}
                    </span>
                  </div>
                  <p className="text-sm text-earth-600">
                    PH范围：{detail.minPh} - {detail.maxPh}
                  </p>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        detail.isApplicable ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                      style={{
                        width: `${(() => {
                          if (applicability.currentPh === null) return '0';
                          const percent = ((applicability.currentPh - detail.minPh) /
                            (detail.maxPh - detail.minPh) * 100);
                          return Math.min(100, Math.max(0, percent)).toString();
                        })()}%`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {applicability.message && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-700">{applicability.message}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

      <PhRecordModal
        isOpen={showPhModal}
        onClose={() => setShowPhModal(false)}
        onSuccess={() => {
          loadBatch(id);
          loadRecords(id);
        }}
        batchId={id}
      />

      <FilterRecordModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onSuccess={() => {
          loadBatch(id);
          loadRecords(id);
        }}
        batchId={id}
        batch={selectedBatch}
      />

      <UsageRecordModal
        isOpen={showUsageModal}
        onClose={() => setShowUsageModal(false)}
        onSuccess={() => {
          loadBatch(id);
          loadRecords(id);
        }}
        batchId={id}
        batch={selectedBatch}
        remainingVolume={remaining}
        totalUsed={totalUsed}
      />
    </div>
  );
}
