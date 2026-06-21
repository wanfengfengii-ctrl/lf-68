import { useState, useEffect } from 'react';
import {
  BarChart3,
  Search,
  RefreshCw,
  Palette,
  TrendingUp,
  Lightbulb,
  Droplets,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/store';
import DyeingRecipeCard from '@/components/DyeingRecipeCard';
import Empty from '@/components/Empty';
import type { FabricType, DyeingProcess } from '@/types';

export default function RecipeAnalysis() {
  const analyzeRecipeStability = useAppStore((state) => state.analyzeRecipeStability);
  const getRecipeRecommendation = useAppStore((state) => state.getRecipeRecommendation);
  const stabilityAnalysis = useAppStore((state) => state.stabilityAnalysis);
  const recipeRecommendation = useAppStore((state) => state.recipeRecommendation);
  const config = useAppStore((state) => state.config);
  const loading = useAppStore((state) => state.loading);

  const [activeTab, setActiveTab] = useState<'analysis' | 'recommend'>('analysis');
  const [filters, setFilters] = useState({
    fabricType: '',
    targetColor: '',
    process: '',
  });
  const [recommendForm, setRecommendForm] = useState({
    fabricType: '' as FabricType | '',
    targetColor: '',
    process: '' as DyeingProcess | '',
  });

  const fabricTypes = Object.entries(config?.fabricTypes || {}).map(([key, name]) => ({
    value: key as FabricType,
    label: name,
  }));

  const processes = Object.entries(config?.processNames || {}).map(([key, name]) => ({
    value: key as DyeingProcess,
    label: name,
  }));

  const handleAnalyze = () => {
    analyzeRecipeStability({
      fabricType: filters.fabricType || undefined,
      targetColor: filters.targetColor || undefined,
      process: filters.process || undefined,
    });
  };

  const handleRecommend = () => {
    if (!recommendForm.fabricType || !recommendForm.targetColor) return;
    getRecipeRecommendation({
      fabricType: recommendForm.fabricType,
      targetColor: recommendForm.targetColor,
      process: recommendForm.process || undefined,
    });
  };

  const getStabilityLevelColor = (level: string) => {
    switch (level) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'fair':
        return 'text-yellow-600';
      case 'poor':
        return 'text-orange-600';
      case 'unstable':
        return 'text-red-600';
      default:
        return 'text-earth-600';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-earth-900">配方稳定性对比分析</h1>
        <p className="text-earth-600 mt-1">
          基于历史数据分析不同配方的稳定性，为染色任务提供智能推荐
        </p>
      </div>

      <div className="flex gap-2 border-b border-earth-200">
        <button
          onClick={() => setActiveTab('analysis')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'analysis'
              ? 'text-moss-700 border-b-2 border-moss-600'
              : 'text-earth-500 hover:text-earth-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            稳定性分析
          </div>
        </button>
        <button
          onClick={() => setActiveTab('recommend')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'recommend'
              ? 'text-moss-700 border-b-2 border-moss-600'
              : 'text-earth-500 hover:text-earth-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            智能推荐
          </div>
        </button>
      </div>

      {activeTab === 'analysis' ? (
        <div className="space-y-6">
          <div className="card">
            <div className="card-body">
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
                <div className="flex items-end gap-2">
                  <button onClick={handleAnalyze} className="btn btn-accent flex-1">
                    <Search className="w-4 h-4" />
                    分析
                  </button>
                  <button
                    onClick={handleAnalyze}
                    className="btn btn-outline"
                    title="刷新"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin w-8 h-8 border-2 border-moss-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-earth-600">分析中...</p>
            </div>
          ) : stabilityAnalysis?.recipeGroups && stabilityAnalysis.recipeGroups.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card">
                  <div className="card-body">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Palette className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-earth-600">总记录数</p>
                        <p className="text-2xl font-bold text-earth-900">
                          {stabilityAnalysis.totalRecords}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-earth-600">配方组数</p>
                        <p className="text-2xl font-bold text-earth-900">
                          {stabilityAnalysis.analyzedGroups}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                        <Droplets className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm text-earth-600">最优配方评分</p>
                        <p
                          className={`text-2xl font-bold ${getStabilityLevelColor(stabilityAnalysis.recipeGroups[0]?.stabilityLevel || '')}`}
                        >
                          {stabilityAnalysis.recipeGroups[0]?.stabilityScore.toFixed(0) || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stabilityAnalysis.recipeGroups.map((recipe, index) => (
                  <DyeingRecipeCard key={index} recipe={recipe} rank={index + 1} />
                ))}
              </div>
            </div>
          ) : (
            <Empty
              icon={<BarChart3 className="w-12 h-12" />}
              title={stabilityAnalysis?.message || '暂无分析数据'}
              description="请先记录染色配方数据，系统将自动分析配方稳定性"
            />
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card">
            <div className="card-body">
              <h3 className="font-medium text-earth-900 mb-4">获取配方推荐</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="label">布料类型 *</label>
                  <select
                    value={recommendForm.fabricType}
                    onChange={(e) =>
                      setRecommendForm({
                        ...recommendForm,
                        fabricType: e.target.value as FabricType,
                      })
                    }
                    className="input"
                  >
                    <option value="">请选择</option>
                    {fabricTypes.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">目标颜色 *</label>
                  <input
                    type="text"
                    value={recommendForm.targetColor}
                    onChange={(e) =>
                      setRecommendForm({ ...recommendForm, targetColor: e.target.value })
                    }
                    className="input"
                    placeholder="如：靛蓝、红色"
                  />
                </div>
                <div>
                  <label className="label">染色工序</label>
                  <select
                    value={recommendForm.process}
                    onChange={(e) =>
                      setRecommendForm({
                        ...recommendForm,
                        process: e.target.value as DyeingProcess,
                      })
                    }
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
                <div className="flex items-end">
                  <button
                    onClick={handleRecommend}
                    disabled={!recommendForm.fabricType || !recommendForm.targetColor || loading}
                    className="btn btn-accent w-full"
                  >
                    <Lightbulb className="w-4 h-4" />
                    获取推荐
                  </button>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin w-8 h-8 border-2 border-moss-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-earth-600">生成推荐中...</p>
            </div>
          ) : recipeRecommendation && recipeRecommendation.hasRecommendation ? (
            <div className="space-y-6">
              {recipeRecommendation.bestRecipe && (
                <div className="card border-moss-300 bg-moss-50/30">
                  <div className="card-header">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-moss-100 flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-moss-600" />
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-earth-900">推荐最优配方</h3>
                        <p className="text-sm text-earth-600">
                          基于 {recipeRecommendation.bestRecipe.recordCount} 条历史记录分析
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-earth-600">稳定性评分</p>
                        <p
                          className={`text-xl font-bold ${getStabilityLevelColor(recipeRecommendation.bestRecipe.stabilityLevel)}`}
                        >
                          {recipeRecommendation.bestRecipe.stabilityScore.toFixed(0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-earth-600">成功率</p>
                        <p className="text-xl font-bold text-earth-900">
                          {recipeRecommendation.bestRecipe.successRate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-earth-600">平均色牢度</p>
                        <p className="text-xl font-bold text-earth-900">
                          {recipeRecommendation.bestRecipe.avgColorFastness?.toFixed(1) || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-earth-600">平均复染次数</p>
                        <p className="text-xl font-bold text-earth-900">
                          {recipeRecommendation.bestRecipe.avgRedyeCount}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-earth-600">灰水批次：</span>
                          <span className="font-medium text-earth-900">
                            {recipeRecommendation.bestRecipe.batchNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-earth-600">染材：</span>
                          <span className="font-medium text-earth-900">
                            {config?.dyeMaterials?.[recipeRecommendation.bestRecipe.dyeMaterial] ||
                              recipeRecommendation.bestRecipe.dyeMaterial}
                          </span>
                        </div>
                        <div>
                          <span className="text-earth-600">媒染方式：</span>
                          <span className="font-medium text-earth-900">
                            {config?.mordantMethods?.[
                              recipeRecommendation.bestRecipe.mordantMethod
                            ] || recipeRecommendation.bestRecipe.mordantMethod}
                          </span>
                        </div>
                        <div>
                          <span className="text-earth-600">浓度：</span>
                          <span className="font-medium text-earth-900">
                            {recipeRecommendation.bestRecipe.dyeConcentration}%
                          </span>
                        </div>
                        <div>
                          <span className="text-earth-600">加热时间：</span>
                          <span className="font-medium text-earth-900">
                            {recipeRecommendation.bestRecipe.heatingTimeMinutes}分钟
                          </span>
                        </div>
                        <div>
                          <span className="text-earth-600">染色次数：</span>
                          <span className="font-medium text-earth-900">
                            {recipeRecommendation.bestRecipe.dyeingCount}次
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {recipeRecommendation.redyeAdvice && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="font-medium text-earth-900 flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-600" />
                      复染建议
                    </h3>
                  </div>
                  <div className="card-body">
                    <p className="text-earth-700">{recipeRecommendation.redyeAdvice}</p>
                  </div>
                </div>
              )}

              {recipeRecommendation.suggestions &&
                recipeRecommendation.suggestions.length > 0 && (
                  <div className="card">
                    <div className="card-header">
                      <h3 className="font-medium text-earth-900 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        优化建议
                      </h3>
                    </div>
                    <div className="card-body">
                      <ul className="space-y-2">
                        {recipeRecommendation.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <ChevronRight className="w-4 h-4 text-earth-400 mt-0.5 flex-shrink-0" />
                            <span className="text-earth-700">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

              {recipeRecommendation.processOptimization &&
                recipeRecommendation.processOptimization.length > 0 && (
                  <div className="card">
                    <div className="card-header">
                      <h3 className="font-medium text-earth-900 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        工艺优化建议
                      </h3>
                    </div>
                    <div className="card-body">
                      <div className="space-y-4">
                        {recipeRecommendation.processOptimization.map((opt, index) => (
                          <div
                            key={index}
                            className="bg-earth-50 rounded-lg p-4 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-earth-900">{opt.parameter}</span>
                              <span className="text-sm text-earth-600">当前: {opt.current}</span>
                            </div>
                            <p className="text-sm text-earth-700">
                              <span className="font-medium">建议：</span>
                              {opt.suggestion}
                            </p>
                            <p className="text-sm text-moss-700">
                              <span className="font-medium">预期收益：</span>
                              {opt.expectedBenefit}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              {recipeRecommendation.alternatives &&
                recipeRecommendation.alternatives.length > 0 && (
                  <div>
                    <h3 className="font-medium text-earth-900 mb-4">备选配方</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {recipeRecommendation.alternatives.map((recipe, index) => (
                        <DyeingRecipeCard key={index} recipe={recipe} rank={index + 2} />
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ) : recipeRecommendation && !recipeRecommendation.hasRecommendation ? (
            <Empty
              icon={<Lightbulb className="w-12 h-12" />}
              title={recipeRecommendation.message || '暂无推荐数据'}
              description="请先记录相关布料和颜色的染色配方，系统将基于历史数据提供智能推荐"
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
