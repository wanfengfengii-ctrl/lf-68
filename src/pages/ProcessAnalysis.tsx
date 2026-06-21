import { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import { formatNumber } from '@/lib/api';
import type { DyeMaterial, FabricType, MordantMethod } from '@/types';
import {
  BarChart3, TrendingUp, TrendingDown, Filter, FlaskConical, Award,
  AlertTriangle, CheckCircle, XCircle, RefreshCw, Star, PieChart, LineChart
} from 'lucide-react';

type AnalysisTab = 'overview' | 'raw-material' | 'ph-range' | 'filter-count' | 'rework';

export default function ProcessAnalysis() {
  const config = useAppStore((state) => state.config);
  const loading = useAppStore((state) => state.loading);
  const comprehensiveAnalysis = useAppStore((state) => state.comprehensiveAnalysis);
  const sourceAnalysis = useAppStore((state) => state.sourceAnalysis);
  const phRangeAnalysis = useAppStore((state) => state.phRangeAnalysis);
  const filterCountAnalysis = useAppStore((state) => state.filterCountAnalysis);
  const reworkStatistics = useAppStore((state) => state.reworkStatistics);
  const loadComprehensiveAnalysis = useAppStore((state) => state.loadComprehensiveAnalysis);
  const loadSourceAnalysis = useAppStore((state) => state.loadSourceAnalysis);
  const loadPhRangeAnalysis = useAppStore((state) => state.loadPhRangeAnalysis);
  const loadFilterCountAnalysis = useAppStore((state) => state.loadFilterCountAnalysis);
  const loadReworkStatistics = useAppStore((state) => state.loadReworkStatistics);

  const [activeTab, setActiveTab] = useState<AnalysisTab>('overview');
  const [filterDyeMaterial, setFilterDyeMaterial] = useState<string>('');
  const [filterFabricType, setFilterFabricType] = useState<string>('');

  const getDyeMaterialName = (material: string) =>
    config?.dyeMaterials?.[material as keyof typeof config.dyeMaterials] || material;

  const getFabricName = (type: string) =>
    config?.fabricTypes?.[type as keyof typeof config.fabricTypes] || type;

  const getMordantName = (method: string) =>
    config?.mordantMethods?.[method as keyof typeof config.mordantMethods] || method;

  const getScoreGradeColor = (grade: string) => {
    switch (grade) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-orange-600 bg-orange-100';
      case 'unstable': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreGradeText = (grade: string) => {
    switch (grade) {
      case 'excellent': return '优秀';
      case 'good': return '良好';
      case 'fair': return '一般';
      case 'poor': return '较差';
      case 'unstable': return '极差';
      default: return grade;
    }
  };

  const getRecommendTypeColor = (type: string) => {
    switch (type) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-earth-300 bg-earth-50';
    }
  };

  const getRecommendIcon = (type: string) => {
    switch (type) {
      case 'high': return <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />;
      case 'medium': return <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />;
      case 'low': return <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />;
      default: return <Star className="w-5 h-5 text-earth-400 flex-shrink-0 mt-0.5" />;
    }
  };

  useEffect(() => {
    loadAllAnalysis();
  }, [filterDyeMaterial, filterFabricType]);

  const loadAllAnalysis = () => {
    const params = {
      dyeMaterial: filterDyeMaterial as DyeMaterial || undefined,
      fabricType: filterFabricType as FabricType || undefined,
    };
    loadComprehensiveAnalysis(params);
    loadSourceAnalysis(params);
    loadPhRangeAnalysis(params);
    loadFilterCountAnalysis(params);
    loadReworkStatistics(params);
  };

  const handleFilterReset = () => {
    setFilterDyeMaterial('');
    setFilterFabricType('');
  };

  const getTopByScore = <T extends { score: number; rawMaterialSource?: string; phRange?: string; filterRange?: string }>(
    groups: T[],
    topN: number = 5
  ) => {
    return [...groups].sort((a, b) => b.score - a.score).slice(0, topN);
  };

  const getTopItemName = <T extends { rawMaterialSource?: string; phRange?: string; filterRange?: string }>(
    item: T
  ): string => {
    return item.rawMaterialSource || item.phRange || item.filterRange || '-';
  };

  const convertReasonsToArray = (reasons: Record<string, number>) => {
    const total = Object.values(reasons).reduce((sum, count) => sum + count, 0);
    return Object.entries(reasons)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  };

  const tabs: { key: AnalysisTab; label: string; icon: any }[] = [
    { key: 'overview', label: '综合分析', icon: BarChart3 },
    { key: 'raw-material', label: '原料来源', icon: FlaskConical },
    { key: 'ph-range', label: 'PH区间', icon: TrendingUp },
    { key: 'filter-count', label: '过滤次数', icon: Filter },
    { key: 'rework', label: '返工统计', icon: RefreshCw },
  ];

  if (loading && !comprehensiveAnalysis) {
    return (
      <div className="text-center py-20 text-earth-500">
        <div className="animate-spin w-10 h-10 border-3 border-moss-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p>加载分析数据中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-earth-900">工艺分析中心</h1>
          <p className="text-earth-600 mt-1">通过历史数据对比分析，为工艺优化提供依据</p>
        </div>
        <button
          onClick={loadAllAnalysis}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新分析
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">染材筛选</label>
              <select
                value={filterDyeMaterial}
                onChange={(e) => setFilterDyeMaterial(e.target.value)}
                className="input"
              >
                <option value="">全部染材</option>
                {config && Object.entries(config.dyeMaterials).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">布料筛选</label>
              <select
                value={filterFabricType}
                onChange={(e) => setFilterFabricType(e.target.value)}
                className="input"
              >
                <option value="">全部布料</option>
                {config && Object.entries(config.fabricTypes).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={handleFilterReset} className="btn-secondary w-full">
                重置筛选
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-earth-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-moss-600 text-moss-700'
                  : 'border-transparent text-earth-600 hover:text-earth-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && comprehensiveAnalysis && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="card-body text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-earth-900">
                  {comprehensiveAnalysis.overview.totalRecords}
                </p>
                <p className="text-sm text-earth-500 mt-1">总记录数</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {formatNumber(comprehensiveAnalysis.overview.successRate)}%
                </p>
                <p className="text-sm text-earth-500 mt-1">成功率</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6 text-amber-600" />
                </div>
                <p className="text-3xl font-bold text-earth-900">
                  {formatNumber(comprehensiveAnalysis.overview.avgColorFastness)}
                </p>
                <p className="text-sm text-earth-500 mt-1">平均色牢度</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                  <RefreshCw className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-3xl font-bold text-earth-900">
                  {formatNumber(comprehensiveAnalysis.overview.avgRedyeCount)}
                </p>
                <p className="text-sm text-earth-500 mt-1">平均复染次数</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-header">
                <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-moss-600" />
                  最佳原料来源 (按评分)
                </h3>
              </div>
              <div className="card-body">
                {comprehensiveAnalysis.byRawMaterial.groups.length === 0 ? (
                  <p className="text-earth-500 text-center py-6">暂无数据</p>
                ) : (
                  <div className="space-y-3">
                    {getTopByScore(comprehensiveAnalysis.byRawMaterial.groups, 5).map((item, idx) => (
                      <div key={getTopItemName(item)} className="flex items-center justify-between p-3 bg-earth-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                            idx === 1 ? 'bg-gray-300 text-gray-700' :
                            idx === 2 ? 'bg-amber-600 text-amber-100' :
                            'bg-earth-200 text-earth-700'
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-medium text-earth-900">{getTopItemName(item)}</p>
                            <p className="text-xs text-earth-500">{item.recordCount} 条记录</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-moss-700">{formatNumber(item.score)} 分</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getScoreGradeColor(item.grade)}`}>
                            {getScoreGradeText(item.grade)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-moss-600" />
                  最佳PH区间 (按评分)
                </h3>
              </div>
              <div className="card-body">
                {comprehensiveAnalysis.byPhRange.groups.length === 0 ? (
                  <p className="text-earth-500 text-center py-6">暂无数据</p>
                ) : (
                  <div className="space-y-3">
                    {getTopByScore(comprehensiveAnalysis.byPhRange.groups, 5).map((item, idx) => (
                      <div key={getTopItemName(item)} className="flex items-center justify-between p-3 bg-earth-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                            idx === 1 ? 'bg-gray-300 text-gray-700' :
                            idx === 2 ? 'bg-amber-600 text-amber-100' :
                            'bg-earth-200 text-earth-700'
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-medium text-earth-900">{getTopItemName(item)}</p>
                            <p className="text-xs text-earth-500">{item.recordCount} 条记录</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-moss-700">{formatNumber(item.score)} 分</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getScoreGradeColor(item.grade)}`}>
                            {getScoreGradeText(item.grade)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                工艺优化建议
              </h3>
            </div>
            <div className="card-body">
              {comprehensiveAnalysis.recommendations.length === 0 ? (
                <p className="text-earth-500 text-center py-6">暂无建议</p>
              ) : (
                <div className="space-y-3">
                  {comprehensiveAnalysis.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-l-4 ${getRecommendTypeColor(rec.type)}`}
                    >
                      <div className="flex items-start gap-3">
                        {getRecommendIcon(rec.type)}
                        <div>
                          <p className="font-medium text-earth-900">{rec.title}</p>
                          <p className="text-sm text-earth-600 mt-1">{rec.content}</p>
                          <p className="text-xs text-earth-500 mt-2">
                            评分：{formatNumber(rec.score)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'raw-material' && sourceAnalysis && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="font-serif font-bold text-lg">原料来源对比分析</h3>
              <p className="text-sm text-earth-500">不同原料来源的染色效果对比</p>
            </div>
            <div className="card-body">
              {sourceAnalysis.groups.length === 0 ? (
                <p className="text-earth-500 text-center py-12">暂无数据</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-earth-50">
                        <th className="text-left px-4 py-3 text-sm font-medium text-earth-700">原料来源</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-earth-700">记录数</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-earth-700">成功率</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-earth-700">平均色牢度</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-earth-700">色牢度标准差</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-earth-700">平均复染次数</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-earth-700">综合评分</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-earth-700">等级</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-earth-100">
                      {sourceAnalysis.groups.map((group) => (
                        <tr key={group.rawMaterialSource} className="hover:bg-earth-50">
                          <td className="px-4 py-3 text-sm font-medium text-earth-900">
                            {group.rawMaterialSource}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-earth-900">
                            {group.recordCount}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className={group.successRate >= 80 ? 'text-green-600 font-medium' : group.successRate >= 60 ? 'text-yellow-600 font-medium' : 'text-red-600 font-medium'}>
                              {formatNumber(group.successRate)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-earth-900">
                            {formatNumber(group.avgColorFastness)}级
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-earth-600">
                            ±{formatNumber(group.stdColorFastness)}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-earth-900">
                            {formatNumber(group.avgRedyeCount)}次
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-bold text-moss-700">
                            {formatNumber(group.score)}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className={`text-xs px-2 py-1 rounded-full ${getScoreGradeColor(group.grade)}`}>
                              {getScoreGradeText(group.grade)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ph-range' && phRangeAnalysis && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="font-serif font-bold text-lg">PH区间对比分析</h3>
              <p className="text-sm text-earth-500">不同PH区间的染色效果对比</p>
            </div>
            <div className="card-body">
              {phRangeAnalysis.groups.length === 0 ? (
                <p className="text-earth-500 text-center py-12">暂无数据</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-earth-50">
                        <th className="text-left px-4 py-3 text-sm font-medium text-earth-700">PH区间</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-earth-700">记录数</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-earth-700">成功率</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-earth-700">平均色牢度</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-earth-700">色牢度标准差</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-earth-700">平均复染次数</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-earth-700">综合评分</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-earth-700">等级</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-earth-100">
                      {phRangeAnalysis.groups.map((group) => (
                        <tr key={group.phRange} className="hover:bg-earth-50">
                          <td className="px-4 py-3 text-sm font-medium text-earth-900">
                            {group.phRange}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-earth-900">
                            {group.recordCount}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className={group.successRate >= 80 ? 'text-green-600 font-medium' : group.successRate >= 60 ? 'text-yellow-600 font-medium' : 'text-red-600 font-medium'}>
                              {formatNumber(group.successRate)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-earth-900">
                            {formatNumber(group.avgColorFastness)}级
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-earth-600">
                            ±{formatNumber(group.stdColorFastness)}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-earth-900">
                            {formatNumber(group.avgRedyeCount)}次
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-bold text-moss-700">
                            {formatNumber(group.score)}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className={`text-xs px-2 py-1 rounded-full ${getScoreGradeColor(group.grade)}`}>
                              {getScoreGradeText(group.grade)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'filter-count' && filterCountAnalysis && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="font-serif font-bold text-lg">过滤次数对比分析</h3>
              <p className="text-sm text-earth-500">不同过滤次数的染色效果对比</p>
            </div>
            <div className="card-body">
              {filterCountAnalysis.groups.length === 0 ? (
                <p className="text-earth-500 text-center py-12">暂无数据</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-earth-50">
                        <th className="text-left px-4 py-3 text-sm font-medium text-earth-700">过滤区间</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-earth-700">记录数</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-earth-700">成功率</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-earth-700">平均色牢度</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-earth-700">色牢度标准差</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-earth-700">平均复染次数</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-earth-700">综合评分</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-earth-700">等级</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-earth-100">
                      {filterCountAnalysis.groups.map((group) => (
                        <tr key={group.filterRange} className="hover:bg-earth-50">
                          <td className="px-4 py-3 text-sm font-medium text-earth-900">
                            {group.filterRange}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-earth-900">
                            {group.recordCount}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className={group.successRate >= 80 ? 'text-green-600 font-medium' : group.successRate >= 60 ? 'text-yellow-600 font-medium' : 'text-red-600 font-medium'}>
                              {formatNumber(group.successRate)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-earth-900">
                            {formatNumber(group.avgColorFastness)}级
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-earth-600">
                            ±{formatNumber(group.stdColorFastness)}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-earth-900">
                            {formatNumber(group.avgRedyeCount)}次
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-bold text-moss-700">
                            {formatNumber(group.score)}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className={`text-xs px-2 py-1 rounded-full ${getScoreGradeColor(group.grade)}`}>
                              {getScoreGradeText(group.grade)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rework' && reworkStatistics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="card-body text-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                  <PieChart className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-earth-900">
                  {reworkStatistics.totalRecords}
                </p>
                <p className="text-sm text-earth-500">总记录数</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-2">
                  <RefreshCw className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-amber-600">
                  {reworkStatistics.reworkCount}
                </p>
                <p className="text-sm text-earth-500">返工次数</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {reworkStatistics.failureCount}
                </p>
                <p className="text-sm text-earth-500">失败次数</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatNumber(100 - reworkStatistics.failureRate)}%
                </p>
                <p className="text-sm text-earth-500">成功率</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-header">
                <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-amber-600" />
                  返工原因分布
                </h3>
              </div>
              <div className="card-body">
                {Object.keys(reworkStatistics.reworkReasons).length === 0 ? (
                  <p className="text-earth-500 text-center py-8">暂无返工原因数据</p>
                ) : (
                  <div className="space-y-3">
                    {convertReasonsToArray(reworkStatistics.reworkReasons).map((item, idx) => (
                      <div key={item.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-earth-700">{item.name}</span>
                          <span className="font-medium text-earth-900">
                            {item.count}次 ({formatNumber(item.percentage)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-earth-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  失败原因分布
                </h3>
              </div>
              <div className="card-body">
                {Object.keys(reworkStatistics.failureReasons).length === 0 ? (
                  <p className="text-earth-500 text-center py-8">暂无失败原因数据</p>
                ) : (
                  <div className="space-y-3">
                    {convertReasonsToArray(reworkStatistics.failureReasons).map((item, idx) => (
                      <div key={item.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-earth-700">{item.name}</span>
                          <span className="font-medium text-earth-900">
                            {item.count}次 ({formatNumber(item.percentage)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-earth-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {reworkStatistics.byMaterial.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-serif font-bold text-lg">按染材统计返工率</h3>
              </div>
              <div className="card-body">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-earth-50">
                        <th className="text-left px-4 py-3 text-sm font-medium text-earth-700">染材</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-earth-700">记录数</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-earth-700">返工数</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-earth-700">失败数</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-earth-700">返工率</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-earth-700">失败率</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-earth-100">
                      {reworkStatistics.byMaterial.map((item) => (
                        <tr key={item.dyeMaterial} className="hover:bg-earth-50">
                          <td className="px-4 py-3 text-sm font-medium text-earth-900">
                            {getDyeMaterialName(item.dyeMaterial)}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-earth-900">{item.total}</td>
                          <td className="px-4 py-3 text-sm text-center text-amber-600 font-medium">{item.reworkCount}</td>
                          <td className="px-4 py-3 text-sm text-center text-red-600 font-medium">{item.failureCount}</td>
                          <td className="px-4 py-3 text-sm text-center font-medium text-amber-600">
                            {formatNumber(item.reworkRate)}%
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-medium text-red-600">
                            {formatNumber(item.failureRate)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
