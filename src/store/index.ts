import { create } from 'zustand';
import type {
  AshWaterBatch,
  ApiConfig,
  ApiError,
  AllWarningsResult,
  AnalysisResult,
  DyeingRecord,
  DyeingRecordCreateForm,
  DyeingRecordUpdateForm,
  StabilityAnalysisResult,
  RecipeRecommendationResult,
  TraceGroup,
  BatchRecommendationResult,
  DyeingProcess,
  FabricType,
} from '@/types';
import { apiClient } from '@/lib/api';

interface AppState {
  batches: AshWaterBatch[];
  selectedBatch: AshWaterBatch | null;
  config: ApiConfig | null;
  loading: boolean;
  error: ApiError | null;
  warnings: AllWarningsResult | null;
  dyeingRecords: DyeingRecord[];
  stabilityAnalysis: StabilityAnalysisResult | null;
  recipeRecommendation: RecipeRecommendationResult | null;
  traceGroups: TraceGroup[];
  batchRecommendation: BatchRecommendationResult | null;

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
  clearError: () => void;

  loadDyeingRecords: (params?: { batchId?: string; fabricType?: string; targetColor?: string; process?: string }) => Promise<void>;
  addDyeingRecord: (batchId: string, data: DyeingRecordCreateForm) => Promise<void>;
  updateDyeingRecord: (id: string, data: DyeingRecordUpdateForm) => Promise<void>;
  deleteDyeingRecord: (id: string) => Promise<void>;
  analyzeRecipeStability: (params?: { fabricType?: string; targetColor?: string; process?: string }) => Promise<void>;
  getRecipeRecommendation: (params: { fabricType: string; targetColor: string; process?: string }) => Promise<void>;
  traceDyeingProcess: (params?: { fabricType?: string; targetColor?: string; process?: string }) => Promise<void>;
  getBatchRecommendation: (params?: { process?: DyeingProcess; fabricType?: FabricType; minVolume?: number }) => Promise<void>;
  clearBatchRecommendation: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  batches: [],
  selectedBatch: null,
  config: null,
  loading: false,
  error: null,
  warnings: null,
  dyeingRecords: [],
  stabilityAnalysis: null,
  recipeRecommendation: null,
  traceGroups: [],
  batchRecommendation: null,

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

  loadDyeingRecords: async (params) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.dyeingRecords.list(params);
      set({ dyeingRecords: response.data, loading: false });
    } catch (error) {
      set({ error: error as ApiError, loading: false });
      throw error;
    }
  },

  addDyeingRecord: async (batchId, data) => {
    set({ loading: true, error: null });
    try {
      await apiClient.dyeingRecords.create(batchId, data);
      await get().loadDyeingRecords({ batchId });
      set({ loading: false });
    } catch (error) {
      set({ error: error as ApiError, loading: false });
      throw error;
    }
  },

  updateDyeingRecord: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await apiClient.dyeingRecords.update(id, data);
      await get().loadDyeingRecords();
      set({ loading: false });
    } catch (error) {
      set({ error: error as ApiError, loading: false });
      throw error;
    }
  },

  deleteDyeingRecord: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.dyeingRecords.delete(id);
      await get().loadDyeingRecords();
      set({ loading: false });
    } catch (error) {
      set({ error: error as ApiError, loading: false });
      throw error;
    }
  },

  analyzeRecipeStability: async (params) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.dyeingRecords.analyzeStability(params);
      set({ stabilityAnalysis: response.data, loading: false });
    } catch (error) {
      set({ error: error as ApiError, loading: false });
      throw error;
    }
  },

  getRecipeRecommendation: async (params) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.dyeingRecords.recommend(params);
      set({ recipeRecommendation: response.data, loading: false });
    } catch (error) {
      set({ error: error as ApiError, loading: false });
      throw error;
    }
  },

  traceDyeingProcess: async (params) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.dyeingRecords.trace(params);
      set({ traceGroups: response.data, loading: false });
    } catch (error) {
      set({ error: error as ApiError, loading: false });
      throw error;
    }
  },

  getBatchRecommendation: async (params) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.batches.recommend(params);
      set({ batchRecommendation: response.data, loading: false });
    } catch (error) {
      set({ error: error as ApiError, loading: false });
      throw error;
    }
  },

  clearBatchRecommendation: () => {
    set({ batchRecommendation: null });
  },
}));
