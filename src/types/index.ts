export type BatchStatus = 'soaking' | 'filtering' | 'available' | 'not_applicable' | 'exhausted' | 'warning';

export type DyeingProcess = 'scouring' | 'mordanting' | 'dyeing' | 'fixing';

export type PhTrend = 'rising' | 'falling' | 'stable';

export type WarningType = 'consecutive_abnormal' | 'long_time_no_check' | 'ph_rising_rapidly' | 'ph_falling_rapidly' | 'usage_restricted';

export type WarningLevel = 'low' | 'medium' | 'high';

export type StabilityLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'unstable';

export type MordantMethod =
  | 'alum'
  | 'iron'
  | 'tannin'
  | 'copper'
  | 'tin'
  | 'chrome'
  | 'pre_mordant'
  | 'meta_mordant'
  | 'post_mordant'
  | 'none';

export type DyeMaterial =
  | 'indigo'
  | 'madder'
  | 'safflower'
  | 'turmeric'
  | 'gardenia'
  | 'sappanwood'
  | 'pomegranate'
  | 'chestnut'
  | 'tea'
  | 'onion_skin'
  | 'grape_skin'
  | 'blueberry'
  | 'spinach'
  | 'carrot'
  | 'other';

export type FabricType =
  | 'cotton'
  | 'linen'
  | 'silk'
  | 'wool'
  | 'hemp'
  | 'ramie'
  | 'viscose'
  | 'modal'
  | 'tencel'
  | 'bamboo'
  | 'soy'
  | 'blend'
  | 'other';

export interface WarningItem {
  type: WarningType;
  typeName: string;
  message: string;
  level: WarningLevel;
  timestamp: string;
  advice?: string;
  count?: number;
  change?: number;
  hoursSinceCheck?: number;
}

export interface WarningResult {
  hasWarning: boolean;
  warningTypes: WarningType[];
  warningLevel: WarningLevel | null;
  warnings: WarningItem[];
  list: WarningItem[];
  usageRestricted: boolean;
}

export interface TrendAnalysis {
  trend: PhTrend;
  changeRate: number;
  totalChange: number;
  volatility: number;
  avgPh: number | null;
  windowSize: number;
  trendName?: string;
}

export interface ProcessRecommendation {
  process: DyeingProcess;
  processName: string;
  minPh: number;
  maxPh: number;
  score: number;
  isRecommended: boolean;
  inRange: boolean;
  reasons: string[];
}

export interface RecommendationResult {
  recommended: ProcessRecommendation[];
  notRecommended: ProcessRecommendation[];
  requiresAttention: string[];
  overallScore: number;
  trendAnalysis?: TrendAnalysis;
}

export interface WarningStats {
  total: number;
  high: number;
  medium: number;
  low: number;
  restricted: number;
  byType: Record<string, number>;
}

export interface WarningBatchItem {
  batch: AshWaterBatch;
}

export interface AllWarningsResult {
  stats: WarningStats;
  batches: WarningBatchItem[];
}

export interface AnalysisResult {
  batch: AshWaterBatch;
  trendAnalysis: TrendAnalysis;
  warnings: WarningResult;
  recommendations: RecommendationResult;
}

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
  hasWarning: boolean;
  usageRestricted: boolean;
  warningTypes: WarningType[];
  warningLevel: WarningLevel | null;
  lastWarningTime: string | null;
  lastPhCheckTime: string | null;
  phTrend: PhTrend;
  phChangeRate: number;
  consecutiveAbnormalCount: number;
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
  warnings?: WarningResult;
  recommendations?: RecommendationResult;
  trendAnalysis?: TrendAnalysis;
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

export interface WarningConfig {
  consecutiveAbnormalThreshold: number;
  maxHoursSinceLastPh: number;
  phTrendWindow: number;
  phStableThreshold: number;
  phRapidChangeThreshold: number;
  phRapidChangeHours: number;
}

export interface DyeingRecord {
  id: string;
  batchId: string;
  batchNumber?: string;
  dyeingDate: string;
  fabricType: FabricType;
  targetColor: string;
  dyeMaterial: DyeMaterial;
  mordantMethod: MordantMethod;
  dyeConcentration: number;
  heatingTimeMinutes: number;
  dyeingCount: number;
  redyeCount: number;
  colorResult?: string;
  colorFastness?: number;
  process: DyeingProcess;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DyeingRecordCreateForm {
  dyeingDate?: string;
  fabricType: FabricType;
  targetColor: string;
  dyeMaterial: DyeMaterial;
  mordantMethod: MordantMethod;
  dyeConcentration: number;
  heatingTimeMinutes: number;
  dyeingCount: number;
  redyeCount: number;
  colorResult?: string;
  colorFastness?: number;
  process: DyeingProcess;
  notes?: string;
}

export interface DyeingRecordUpdateForm {
  dyeingDate?: string;
  fabricType?: FabricType;
  targetColor?: string;
  dyeMaterial?: DyeMaterial;
  mordantMethod?: MordantMethod;
  dyeConcentration?: number;
  heatingTimeMinutes?: number;
  dyeingCount?: number;
  redyeCount?: number;
  colorResult?: string;
  colorFastness?: number;
  process?: DyeingProcess;
  notes?: string;
}

export interface RecipeGroup {
  batchId: string;
  batchNumber: string;
  dyeMaterial: DyeMaterial;
  mordantMethod: MordantMethod;
  dyeConcentration: number;
  heatingTimeMinutes: number;
  dyeingCount: number;
  fabricType: FabricType;
  targetColor: string;
  recordCount: number;
  avgColorFastness?: number;
  stdColorFastness: number;
  avgRedyeCount: number;
  successRate: number;
  stabilityScore: number;
  stabilityLevel: StabilityLevel;
  recommendation: string;
  sampleRecords: DyeingRecord[];
}

export interface StabilityAnalysisResult {
  message?: string;
  totalRecords: number;
  analyzedGroups: number;
  recipeGroups: RecipeGroup[];
}

export interface ProcessOptimization {
  parameter: string;
  current: string;
  suggestion: string;
  expectedBenefit: string;
}

export interface RecipeRecommendationResult {
  hasRecommendation: boolean;
  message?: string;
  bestRecipe?: RecipeGroup;
  alternatives?: RecipeGroup[];
  suggestions?: string[];
  redyeAdvice?: string;
  processOptimization?: ProcessOptimization[];
}

export interface TraceGroup {
  fabricType: FabricType;
  targetColor: string;
  process: DyeingProcess;
  recordCount: number;
  records: DyeingRecord[];
}

export interface ApiError {
  error: string;
  code: number;
  field?: string;
  rule?: string;
}

export interface ApiConfig {
  processNames: Record<DyeingProcess, string>;
  statusNames: Record<BatchStatus, string>;
  processPhRanges: Record<DyeingProcess, [number, number]>;
  applicableRange: { min: number; max: number };
  warningConfig: WarningConfig;
  warningTypes: Record<WarningType, string>;
  warningLevels: Record<WarningLevel, string>;
  mordantMethods: Record<MordantMethod, string>;
  dyeMaterials: Record<DyeMaterial, string>;
  fabricTypes: Record<FabricType, string>;
  stabilityLevels: Record<StabilityLevel, string>;
}
