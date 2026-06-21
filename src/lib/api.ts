import axios from 'axios';
import type {
  AshWaterBatch,
  PhRecord,
  FilterRecord,
  UsageRecord,
  ApplicabilityInfo,
  BatchCreateForm,
  PhRecordCreateForm,
  FilterRecordCreateForm,
  UsageRecordCreateForm,
  ApiConfig,
  ApiError,
  AnalysisResult,
  AllWarningsResult,
  BatchRecommendationResult,
  DyeingProcess,
  FabricType,
  DyeingRecord,
  DyeingRecordCreateForm,
  DyeingRecordUpdateForm,
  SourceAnalysisResult,
  PhRangeAnalysisResult,
  FilterCountAnalysisResult,
  ComprehensiveAnalysisResult,
  ReworkStatisticsResult,
  StabilityAnalysisResult,
  RecipeRecommendationResult,
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const apiError: ApiError = error.response.data;
      return Promise.reject(apiError);
    }
    return Promise.reject({
      error: '网络连接失败，请检查服务器是否运行',
      code: 0,
    });
  }
);

export const apiClient = {
  health: () => api.get('/health'),
  config: () => api.get<ApiConfig>('/config'),

  batches: {
    list: (status?: string, search?: string, hasWarning?: boolean) =>
      api.get<AshWaterBatch[]>('/batches', { params: { status, search, hasWarning } }),
    get: (id: string) => api.get<AshWaterBatch>(`/batches/${id}`),
    create: (data: BatchCreateForm) => api.post<AshWaterBatch>('/batches', data),
    update: (id: string, data: Partial<BatchCreateForm> & { status?: string }) =>
      api.put<AshWaterBatch>(`/batches/${id}`, data),
    delete: (id: string) => api.delete(`/batches/${id}`),
    applicability: (id: string) =>
      api.get<ApplicabilityInfo>(`/batches/${id}/applicability`),
    analyze: (id: string) =>
      api.post<AnalysisResult>(`/batches/${id}/analyze`),
    warnings: () =>
      api.get<AllWarningsResult>('/batches/warnings'),
    refreshWarnings: () =>
      api.post<AllWarningsResult>('/batches/warnings/refresh'),
    recommendation: (params?: { process?: DyeingProcess; fabricType?: FabricType; minVolume?: number }) =>
      api.get<BatchRecommendationResult>('/batches/recommendation', { params }),
  },

  phRecords: {
    list: (batchId: string) => api.get<PhRecord[]>(`/batches/${batchId}/ph-records`),
    create: (batchId: string, data: PhRecordCreateForm) =>
      api.post<PhRecord>(`/batches/${batchId}/ph-records`, data),
  },

  filterRecords: {
    list: (batchId: string) => api.get<FilterRecord[]>(`/batches/${batchId}/filter-records`),
    create: (batchId: string, data: FilterRecordCreateForm) =>
      api.post<FilterRecord>(`/batches/${batchId}/filter-records`, data),
  },

  usageRecords: {
    list: (batchId: string) => api.get<UsageRecord[]>(`/batches/${batchId}/usage-records`),
    create: (batchId: string, data: UsageRecordCreateForm) =>
      api.post<UsageRecord>(`/batches/${batchId}/usage-records`, data),
  },

  dyeingRecords: {
    list: (batchId?: string) => api.get<DyeingRecord[]>('/dyeing-records', { params: { batchId } }),
    get: (id: string) => api.get<DyeingRecord>(`/dyeing-records/${id}`),
    create: (data: DyeingRecordCreateForm) => api.post<DyeingRecord>('/dyeing-records', data),
    update: (id: string, data: DyeingRecordUpdateForm) =>
      api.put<DyeingRecord>(`/dyeing-records/${id}`, data),
    delete: (id: string) => api.delete(`/dyeing-records/${id}`),
  },

  analysis: {
    comprehensive: (params?: any) => api.get<ComprehensiveAnalysisResult>('/analysis/comprehensive', { params }),
    source: (params?: any) => api.get<SourceAnalysisResult>('/analysis/source', { params }),
    phRange: (params?: any) => api.get<PhRangeAnalysisResult>('/analysis/ph-range', { params }),
    filterCount: (params?: any) => api.get<FilterCountAnalysisResult>('/analysis/filter-count', { params }),
    rework: (params?: any) => api.get<ReworkStatisticsResult>('/analysis/rework', { params }),
    recipeStability: (params?: { minRecords?: number; fabricType?: string }) =>
      api.get<StabilityAnalysisResult>('/analysis/recipe-stability', { params }),
    recipeRecommendation: (params?: { fabricType?: string; targetColor?: string; process?: string }) =>
      api.get<RecipeRecommendationResult>('/analysis/recipe-recommendation', { params }),
  },
};

export const getPhColor = (ph: number | null): string => {
  if (ph === null) return 'text-gray-500';
  if (ph < 4) return 'text-red-600';
  if (ph < 6) return 'text-orange-500';
  if (ph < 7.5) return 'text-green-600';
  if (ph < 8.5) return 'text-teal-600';
  if (ph < 10) return 'text-blue-600';
  if (ph < 12) return 'text-indigo-600';
  return 'text-purple-700';
};

export const getPhBgColor = (ph: number | null): string => {
  if (ph === null) return 'bg-gray-200';
  if (ph < 4) return 'bg-red-100';
  if (ph < 6) return 'bg-orange-100';
  if (ph < 7.5) return 'bg-green-100';
  if (ph < 8.5) return 'bg-teal-100';
  if (ph < 10) return 'bg-blue-100';
  if (ph < 12) return 'bg-indigo-100';
  return 'bg-purple-100';
};

export const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatNumber = (num: number | null | undefined, digits = 1): string => {
  if (num === null || num === undefined) return '-';
  return num.toFixed(digits);
};
