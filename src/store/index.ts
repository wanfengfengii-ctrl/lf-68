import { create } from 'zustand';
import type {
  AshWaterBatch, ApiConfig, ApiError, AllWarningsResult, AnalysisResult,
  BatchRecommendationResult, DyeingProcess, FabricType,
  DyeingRecord, DyeingRecordCreateForm, DyeingRecordUpdateForm,
  SourceAnalysisResult, PhRangeAnalysisResult, FilterCountAnalysisResult,
  ComprehensiveAnalysisResult, ReworkStatisticsResult,
  StabilityAnalysisResult, RecipeRecommendationResult
} from '@/types';
import { apiClient } from '@/lib/api';

interface AppState {
  batches: AshWaterBatch[];
  selectedBatch: AshWaterBatch | null;
  config: ApiConfig | null;
  loading: boolean;
  error: ApiError | null;
  warnings: AllWarningsResult | null;
  batchRecommendation: BatchRecommendationResult | null;
  dyeingRecords: DyeingRecord[];
  comprehensiveAnalysis: ComprehensiveAnalysisResult | null;
  sourceAnalysis: SourceAnalysisResult | null;
  phRangeAnalysis: PhRangeAnalysisResult | null;
  filterCountAnalysis: FilterCountAnalysisResult | null;
  reworkStatistics: ReworkStatisticsResult | null;
  stabilityAnalysis: StabilityAnalysisResult | null;
  recipeRecommendation: RecipeRecommendationResult | null;

  loadConfig: () => Promise<void>;
  loadBatches: (status?: string, search?: string, hasWarning?: boolean) => Promise<void>;
  loadBatch: (id: string) => Promise<void>;
  selectBatch: (batch: AshWaterBatch | null) => void;
  createBatch: (data: any) => Promise<AshWaterBatch>;
  updateBatch: (id: string, data: any) => Promise<AshWaterBatch>;
  deleteBatch: (id: string) => Promise<void>;
  addPhRecord: (batchId: string, data: any) => Promise<void>;
  addFilterRecord: (batchId: string, data: any) => Promise<void>;
  addUsageRecord: (batchId: string, data: any) => Promise<void>;
  loadWarnings: () => Promise<void>;
  refreshWarnings: () => Promise<void>;
  analyzeBatch: (batchId: string) => Promise<AnalysisResult>;
  getBatchRecommendation: (params?: { process?: DyeingProcess; fabricType?: FabricType; minVolume?: number }) => Promise<void>;
  clearBatchRecommendation: () => void;
  loadDyeingRecords: (params?: string | any) => Promise<void>;
  addDyeingRecord: (dataOrBatchId: DyeingRecordCreateForm | string, data?: DyeingRecordCreateForm) => Promise<DyeingRecord>;
  updateDyeingRecord: (id: string, data: DyeingRecordUpdateForm) => Promise<DyeingRecord>;
  deleteDyeingRecord: (id: string) => Promise<void>;
  loadComprehensiveAnalysis: (params?: any) => Promise<void>;
  loadSourceAnalysis: (params?: any) => Promise<void>;
  loadPhRangeAnalysis: (params?: any) => Promise<void>;
  loadFilterCountAnalysis: (params?: any) => Promise<void>;
  loadReworkStatistics: (params?: any) => Promise<void>;
  analyzeRecipeStability: (params?: { minRecords?: number; fabricType?: string; targetColor?: string; process?: string }) => Promise<void>;
  getRecipeRecommendation: (params?: { fabricType?: string; targetColor?: string; process?: string }) => Promise<void>;
  clearError: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  batches: [],
  selectedBatch: null,
  config: null,
  loading: false,
  error: null,
  warnings: null,
  batchRecommendation: null,
  dyeingRecords: [],
  comprehensiveAnalysis: null,
  sourceAnalysis: null,
  phRangeAnalysis: null,
  filterCountAnalysis: null,
  reworkStatistics: null,
  stabilityAnalysis: null,
  recipeRecommendation: null,

  loadConfig: async () => {
    try {
      const response = await apiClient.config();
      set({ config: response.data });
    } catch (error) {
      set({ error: error as ApiError });
    }
  },

  loadBatches: async (status?: string, search?: string, hasWarning?: boolean) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.batches.list(status, search, hasWarning);
      set({ batches: response.data, loading: false });
    } catch (error) {
      set({ error: error as ApiError, loading: false });
    }
  },

  loadBatch: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.batches.get(id);
      set({ selectedBatch: response.data, loading: false });
    } catch (error) {
      set({ error: error as ApiError, loading: false });
    }
  },

  selectBatch: (batch: AshWaterBatch | null) => {
    set({ selectedBatch: batch });
  },

  createBatch: async (data: any) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.batches.create(data);
      set((state) => ({
        batches: [response.data, ...state.batches],
        loading: false,
      }));
      return response.data;
    } catch (error) {
      set({ error: error as ApiError, loading: false });
      throw error;
    }
  },

  updateBatch: async (id: string, data: any) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.batches.update(id, data);
      set((state) => ({
        batches: state.batches.map((b) => (b.id === id ? response.data : b)),
        selectedBatch:
          state.selectedBatch?.id === id ? response.data : state.selectedBatch,
        loading: false,
      }));
      return response.data;
    } catch (error) {
      set({ error: error as ApiError, loading: false });
      throw error;
    }
  },

  deleteBatch: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await apiClient.batches.delete(id);
      set((state) => ({
        batches: state.batches.filter((b) => b.id !== id),
        selectedBatch: state.selectedBatch?.id === id ? null : state.selectedBatch,
        loading: false,
      }));
    } catch (error) {
      set({ error: error as ApiError, loading: false });
      throw error;
    }
  },

  addPhRecord: async (batchId: string, data: any) => {
    set({ loading: true, error: null });
    try {
      await apiClient.phRecords.create(batchId, data);
      await get().loadBatch(batchId);
      await get().loadBatches();
      await get().loadWarnings();
      set({ loading: false });
    } catch (error) {
      set({ error: error as ApiError, loading: false });
      throw error;
    }
  },

  addFilterRecord: async (batchId: string, data: any) => {
    set({ loading: true, error: null });
    try {
      await apiClient.filterRecords.create(batchId, data);
      await get().loadBatch(batchId);
      await get().loadBatches();
      set({ loading: false });
    } catch (error) {
      set({ error: error as ApiError, loading: false });
      throw error;
    }
  },

  addUsageRecord: async (batchId: string, data: any) => {
    set({ loading: true, error: null });
    try {
      await apiClient.usageRecords.create(batchId, data);
      await get().loadBatch(batchId);
      await get().loadBatches();
      set({ loading: false });
    } catch (error) {
      set({ error: error as ApiError, loading: false });
      throw error;
    }
  },

  loadWarnings: async () => {
    try {
      const response = await apiClient.batches.warnings();
      set({ warnings: response.data });
    } catch (error) {
      set({ error: error as ApiError });
    }
  },

  refreshWarnings: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.batches.refreshWarnings();
      set({ warnings: response.data, loading: false });
      await get().loadBatches();
    } catch (error) {
      set({ error: error as ApiError, loading: false });
      throw error;
    }
  },

  analyzeBatch: async (batchId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.batches.analyze(batchId);
      set((state) => ({
        selectedBatch:
          state.selectedBatch?.id === batchId ? response.data.batch : state.selectedBatch,
        batches: state.batches.map((b) =>
          b.id === batchId ? response.data.batch : b
        ),
        loading: false,
      }));
      return response.data;
    } catch (error) {
      set({ error: error as ApiError, loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  getBatchRecommendation: async (params) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.batches.recommendation(params);
      set({ batchRecommendation: response.data, loading: false });
    } catch (error) {
      set({ error: error as ApiError, loading: false });
      throw error;
    }
  },

  clearBatchRecommendation: () => {
    set({ batchRecommendation: null });
  },

  loadDyeingRecords: async (params?) => {
    set({ loading: true, error: null });
    try {
      let queryParams: any = {};
      if (typeof params === 'string') {
        queryParams.batchId = params;
      } else if (params) {
        queryParams = params;
      }
      const response = await apiClient.dyeingRecords.list(queryParams.batchId);
      let records = response.data;
      if (typeof params === 'object' && params) {
        if (params.fabricType) records = records.filter((r: DyeingRecord) => r.fabricType === params.fabricType);
        if (params.targetColor) records = records.filter((r: DyeingRecord) => r.targetColor.includes(params.targetColor));
        if (params.process) records = records.filter((r: DyeingRecord) => r.process === params.process);
      }
      set({ dyeingRecords: records, loading: false });
    } catch (error) {
      set({ error: error as ApiError, loading: false });
    }
  },

  addDyeingRecord: async (dataOrBatchId: DyeingRecordCreateForm | string, data?: DyeingRecordCreateForm) => {
    set({ loading: true, error: null });
    try {
      let payload: DyeingRecordCreateForm;
      if (typeof dataOrBatchId === 'string') {
        payload = { batchId: dataOrBatchId, ...(data as DyeingRecordCreateForm) };
      } else {
        payload = dataOrBatchId;
      }
      const response = await apiClient.dyeingRecords.create(payload);
      set((state) => ({
        dyeingRecords: [response.data, ...state.dyeingRecords],
        loading: false,
      }));
      return response.data;
    } catch (error) {
      set({ error: error as ApiError, loading: false });
      throw error;
    }
  },

  updateDyeingRecord: async (id: string, data: DyeingRecordUpdateForm) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.dyeingRecords.update(id, data);
      set((state) => ({
        dyeingRecords: state.dyeingRecords.map((r) => (r.id === id ? response.data : r)),
        loading: false,
      }));
      return response.data;
    } catch (error) {
      set({ error: error as ApiError, loading: false });
      throw error;
    }
  },

  deleteDyeingRecord: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await apiClient.dyeingRecords.delete(id);
      set((state) => ({
        dyeingRecords: state.dyeingRecords.filter((r) => r.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: error as ApiError, loading: false });
      throw error;
    }
  },

  loadComprehensiveAnalysis: async (params?) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.analysis.comprehensive(params);
      set({ comprehensiveAnalysis: response.data, loading: false });
    } catch (error) {
      set({ error: error as ApiError, loading: false });
    }
  },

  loadSourceAnalysis: async (params?) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.analysis.source(params);
      set({ sourceAnalysis: response.data, loading: false });
    } catch (error) {
      set({ error: error as ApiError, loading: false });
    }
  },

  loadPhRangeAnalysis: async (params?) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.analysis.phRange(params);
      set({ phRangeAnalysis: response.data, loading: false });
    } catch (error) {
      set({ error: error as ApiError, loading: false });
    }
  },

  loadFilterCountAnalysis: async (params?) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.analysis.filterCount(params);
      set({ filterCountAnalysis: response.data, loading: false });
    } catch (error) {
      set({ error: error as ApiError, loading: false });
    }
  },

  loadReworkStatistics: async (params?) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.analysis.rework(params);
      set({ reworkStatistics: response.data, loading: false });
    } catch (error) {
      set({ error: error as ApiError, loading: false });
    }
  },

  analyzeRecipeStability: async (params?) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.analysis.recipeStability(params);
      set({ stabilityAnalysis: response.data, loading: false });
    } catch (error) {
      set({ error: error as ApiError, loading: false });
    }
  },

  getRecipeRecommendation: async (params?) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.analysis.recipeRecommendation(params);
      set({ recipeRecommendation: response.data, loading: false });
    } catch (error) {
      set({ error: error as ApiError, loading: false });
    }
  },
}));
