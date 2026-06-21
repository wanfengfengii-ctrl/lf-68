export type BatchStatus = 'soaking' | 'filtering' | 'available' | 'not_applicable' | 'exhausted';

export type DyeingProcess = 'scouring' | 'mordanting' | 'dyeing' | 'fixing';

export interface AshWaterBatch {
  id: string;
  batchNumber: string;
  rawMaterialSource: string;
  ashWeight: number;
  waterVolume: number;
  soakStartDate: string;
  soakDurationHours: number;
  soakTemperature: number;
  currentPh: number | null;
  filterCount: number;
  status: BatchStatus;
  isApplicable: boolean;
  applicableProcesses: DyeingProcess[];
  createdAt: string;
  updatedAt: string;
}

export interface PhRecord {
  id: string;
  batchId: string;
  phValue: number;
  measuredAt: string;
  measuredBy: string | null;
  notes: string | null;
}

export interface FilterRecord {
  id: string;
  batchId: string;
  filterDate: string;
  filterMethod: string | null;
  filterCount: number;
  notes: string | null;
}

export interface UsageRecord {
  id: string;
  batchId: string;
  usageDate: string;
  process: DyeingProcess;
  volumeUsed: number;
  usedBy: string | null;
  notes: string | null;
}

export interface ProcessDetail {
  process: DyeingProcess;
  processName: string;
  minPh: number;
  maxPh: number;
  isApplicable: boolean;
}

export interface ApplicabilityInfo {
  currentPh: number | null;
  isApplicable: boolean;
  applicableRange: { min: number; max: number };
  applicableProcesses: DyeingProcess[];
  processDetails: ProcessDetail[];
  status: string;
  message?: string;
}

export interface BatchCreateForm {
  batchNumber: string;
  rawMaterialSource: string;
  ashWeight: number;
  waterVolume: number;
  soakStartDate: string;
  soakDurationHours: number;
  soakTemperature?: number;
  currentPh?: number;
}

export interface PhRecordCreateForm {
  phValue: number;
  measuredAt?: string;
  measuredBy?: string;
  notes?: string;
}

export interface FilterRecordCreateForm {
  filterDate: string;
  filterMethod?: string;
  filterCount: number;
  notes?: string;
}

export interface UsageRecordCreateForm {
  usageDate?: string;
  process: DyeingProcess;
  volumeUsed: number;
  usedBy?: string;
  notes?: string;
}

export interface ApiConfig {
  processNames: Record<DyeingProcess, string>;
  statusNames: Record<BatchStatus, string>;
  processPhRanges: Record<DyeingProcess, [number, number]>;
  applicableRange: { min: number; max: number };
}

export interface ApiError {
  error: string;
  code: number;
  field?: string;
  rule?: string;
}
