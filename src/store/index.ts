import { create } from 'zustand';
import type { AshWaterBatch, ApiConfig, ApiError } from '@/types';
import { apiClient } from '@/lib/api';

interface AppState {
  batches: AshWaterBatch[];
  selectedBatch: AshWaterBatch | null;
  config: ApiConfig | null;
  loading: boolean;
  error: ApiError | null;

  loadConfig: () => Promise<void>;
  loadBatches: (status?: string, search?: string) => Promise<void>;
  loadBatch: (id: string) => Promise<void>;
  selectBatch: (batch: AshWaterBatch | null) => void;
  createBatch: (data: any) => Promise<AshWaterBatch>;
  updateBatch: (id: string, data: any) => Promise<AshWaterBatch>;
  deleteBatch: (id: string) => Promise<void>;
  addPhRecord: (batchId: string, data: any) => Promise<void>;
  addFilterRecord: (batchId: string, data: any) => Promise<void>;
  addUsageRecord: (batchId: string, data: any) => Promise<void>;
  clearError: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  batches: [],
  selectedBatch: null,
  config: null,
  loading: false,
  error: null,

  loadConfig: async () => {
    try {
      const response = await apiClient.config();
      set({ config: response.data });
    } catch (error) {
      set({ error: error as ApiError });
    }
  },

  loadBatches: async (status?: string, search?: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.batches.list(status, search);
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

  clearError: () => set({ error: null }),
}));
