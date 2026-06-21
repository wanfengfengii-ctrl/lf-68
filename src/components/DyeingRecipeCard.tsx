import { Palette, Droplets, Clock, RefreshCw, Star, TrendingUp, AlertCircle } from 'lucide-react';
import type { RecipeGroup } from '@/types';
import { useAppStore } from '@/store';
import { formatDate } from '@/lib/api';

interface DyeingRecipeCardProps {
  recipe: RecipeGroup;
  rank?: number;
}

export default function DyeingRecipeCard({ recipe, rank }: DyeingRecipeCardProps) {
  const config = useAppStore((state) => state.config);

  const getStabilityColor = (level: string) => {
    switch (level) {
      case 'excellent':
        return 'text-green-600 bg-green-100';
      case 'good':
        return 'text-blue-600 bg-blue-100';
      case 'fair':
        return 'text-yellow-600 bg-yellow-100';
      case 'poor':
        return 'text-orange-600 bg-orange-100';
      case 'unstable':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 55) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {rank !== undefined && (
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  rank === 1
                    ? 'bg-yellow-400 text-yellow-900'
                    : rank === 2
                    ? 'bg-gray-300 text-gray-700'
                    : rank === 3
                    ? 'bg-amber-600 text-amber-100'
                    : 'bg-earth-200 text-earth-700'
                }`}
              >
                {rank}
              </div>
            )}
            <div>
              <h3 className="font-serif font-bold text-earth-900">
                {config?.fabricTypes?.[recipe.fabricType] || recipe.fabricType} - {recipe.targetColor}
              </h3>
              <p className="text-sm text-earth-600">
                批次: {recipe.batchNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${getStabilityColor(recipe.stabilityLevel)}`}
            >
              {config?.stabilityLevels?.[recipe.stabilityLevel] || recipe.stabilityLevel}
            </span>
          </div>
        </div>
      </div>

      <div className="card-body space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Palette className="w-4 h-4 text-moss-600" />
            <span className="text-earth-600">染材:</span>
            <span className="font-medium text-earth-900">
              {config?.dyeMaterials?.[recipe.dyeMaterial] || recipe.dyeMaterial}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Droplets className="w-4 h-4 text-blue-600" />
            <span className="text-earth-600">媒染:</span>
            <span className="font-medium text-earth-900">
              {config?.mordantMethods?.[recipe.mordantMethod] || recipe.mordantMethod}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span className="text-earth-600">浓度:</span>
            <span className="font-medium text-earth-900">{recipe.dyeConcentration}%</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-orange-600" />
            <span className="text-earth-600">加热:</span>
            <span className="font-medium text-earth-900">{recipe.heatingTimeMinutes}分钟</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4 text-indigo-600" />
            <span className="text-earth-600">染色:</span>
            <span className="font-medium text-earth-900">{recipe.dyeingCount}次</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Star className="w-4 h-4 text-yellow-600" />
            <span className="text-earth-600">记录:</span>
            <span className="font-medium text-earth-900">{recipe.recordCount}条</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 p-3 bg-parchment-100 rounded-lg">
          <div className="text-center">
            <div className={`text-xl font-bold ${getScoreColor(recipe.stabilityScore)}`}>
              {recipe.stabilityScore.toFixed(0)}
            </div>
            <div className="text-xs text-earth-600">稳定性评分</div>
          </div>
          <div className="text-center border-x border-earth-200">
            <div className="text-xl font-bold text-earth-900">
              {recipe.successRate}%
            </div>
            <div className="text-xs text-earth-600">成功率</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-earth-900">
              {recipe.avgColorFastness?.toFixed(1) || '-'}
            </div>
            <div className="text-xs text-earth-600">平均色牢度</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2 p-3 bg-moss-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-moss-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-moss-900">配方建议</p>
              <p className="text-sm text-moss-700">{recipe.recommendation}</p>
            </div>
          </div>
        </div>

        {recipe.sampleRecords.length > 0 && (
          <div className="pt-3 border-t border-earth-200">
            <p className="text-xs text-earth-500 mb-2">最近记录</p>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {recipe.sampleRecords.slice(0, 3).map((record) => (
                <div key={record.id} className="flex justify-between text-xs text-earth-600">
                  <span>{formatDate(record.dyeingDate)}</span>
                  <span className="text-earth-900">
                    {record.colorResult || '无结果'}
                    {record.colorFastness && ` (${record.colorFastness}级)`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
