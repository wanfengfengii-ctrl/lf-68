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
  DyeingRecord,
  DyeingRecordCreateForm,
  DyeingRecordUpdateForm,
  StabilityAnalysisResult,
  RecipeRecommendationResult,
  TraceGroup,
  BatchRecommendationResult,
  DyeingProcess,
  FabricType,
  BatchTraceChain,
  ComprehensiveAnalysisResult,
  SourceAnalysisResult,
  PhRangeAnalysisResult,
  FilterCountAnalysisResult,
  ReworkStatisticsResult,
  DyeMaterial,
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
    recommend: (params?: { process?: DyeingProcess; fabricType?: FabricType; minVolume?: number }) =>
      api.get<BatchRecommendationResult>('/batches/recommend', { params }),
    trace: (id: string) =>
      api.get<BatchTraceChain>(`/batches/${id}/trace`),
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
    list: (params?: { batchId?: string; fabricType?: string; targetColor?: string; process?: string }) =>
      api.get<DyeingRecord[]>('/batches/dyeing-records', { params }),
    get: (id: string) => api.get<DyeingRecord>(`/batches/dyeing-records/${id}`),
    create: (batchId: string, data: DyeingRecordCreateForm) =>
      api.post<DyeingRecord>(`/batches/${batchId}/dyeing-records`, data),
    update: (id: string, data: DyeingRecordUpdateForm) =>
      api.put<DyeingRecord>(`/batches/dyeing-records/${id}`, data),
    delete: (id: string) => api.delete(`/batches/dyeing-records/${id}`),
    trace: (params?: { fabricType?: string; targetColor?: string; process?: string }) =>
      api.get<TraceGroup[]>('/batches/dyeing-records/trace', { params }),
    analyzeStability: (params?: { fabricType?: string; targetColor?: string; process?: string }) =>
      api.get<StabilityAnalysisResult>('/batches/dyeing-records/analyze/stability', { params }),
    recommend: (params: { fabricType: string; targetColor: string; process?: string }) =>
      api.get<RecipeRecommendationResult>('/batches/dyeing-records/recommend', { params }),
    comprehensiveAnalysis: (params?: { dyeMaterial?: DyeMaterial; fabricType?: FabricType; process?: DyeingProcess }) =>
      api.get<ComprehensiveAnalysisResult>('/batches/dyeing-records/analysis/comprehensive', { params }),
    analyzeByRawMaterial: (params?: { dyeMaterial?: DyeMaterial; fabricType?: FabricType }) =>
      api.get<SourceAnalysisResult>('/batches/dyeing-records/analysis/by-raw-material', { params }),
    analyzeByPhRange: (params?: { dyeMaterial?: DyeMaterial; fabricType?: FabricType }) =>
      api.get<PhRangeAnalysisResult>('/batches/dyeing-records/analysis/by-ph-range', { params }),
    analyzeByFilterCount: (params?: { dyeMaterial?: DyeMaterial; fabricType?: FabricType }) =>
      api.get<FilterCountAnalysisResult>('/batches/dyeing-records/analysis/by-filter-count', { params }),
    reworkStatistics: (params?: { dyeMaterial?: DyeMaterial; fabricType?: FabricType }) =>
      api.get<ReworkStatisticsResult>('/batches/dyeing-records/statistics/rework', { params }),
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

export const formatNumber = (value: number | null | undefined, decimals: number = 1): string => {
  if (value === null || value === undefined) return '-';
  return Number(value).toFixed(decimals);
};
