export type BatchStatus = 'soaking' | 'filtering' | 'available' | 'not_applicable' | 'exhausted' | 'warning';

export type DyeingProcess = 'scouring' | 'mordanting' | 'dyeing' | 'fixing';

export type FabricType = 'cotton' | 'linen' | 'silk' | 'wool' | 'hemp';

export type DyeMaterial = 'indigo' | 'madder' | 'safflower' | 'cork_tree' | 'sappanwood';

export type MordantMethod = 'alum' | 'iron' | 'tannin' | 'soybean_milk' | 'none';

export type PhTrend = 'rising' | 'falling' | 'stable';

export type WarningType = 'consecutive_abnormal' | 'long_time_no_check' | 'ph_rising_rapidly' | 'ph_falling_rapidly' | 'usage_restricted';

export type WarningLevel = 'low' | 'medium' | 'high';

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

export interface ProcessScoreItem {
  process: DyeingProcess;
  processName: string;
  minPh: number;
  maxPh: number;
  score: number;
  inRange: boolean;
  reasons: string[];
}

export interface RecommendedBatchItem {
  batch: AshWaterBatch;
  finalScore: number;
  remainingVolume: number;
  remainingPercent: number;
  ageDays: number;
  warnings: WarningResult;
  processScores: Record<DyeingProcess, ProcessScoreItem>;
  processRecommendation?: ProcessScoreItem;
}

export interface BatchRecommendationResult {
  process?: DyeingProcess;
  processName?: string;
  fabricType?: FabricType;
  totalAvailable: number;
  totalRecommended: number;
  recommended: RecommendedBatchItem[];
  notRecommended: RecommendedBatchItem[];
  advice: string[];
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

export interface ApiConfig {
  processNames: Record<DyeingProcess, string>;
  statusNames: Record<BatchStatus, string>;
  processPhRanges: Record<DyeingProcess, [number, number]>;
  applicableRange: { min: number; max: number };
  warningConfig: WarningConfig;
  warningTypes: Record<WarningType, string>;
  warningLevels: Record<WarningLevel, string>;
  fabricTypes: Record<FabricType, string>;
  dyeMaterials: Record<DyeMaterial, string>;
  mordantMethods: Record<MordantMethod, string>;
  stabilityLevels?: Record<string, string>;
}

export interface DyeingRecord {
  id: string;
  batchId: string;
  dyeingDate: string;
  fabricType: FabricType | string;
  targetColor: string;
  dyeMaterial: DyeMaterial | string;
  mordantMethod: MordantMethod | string;
  dyeConcentration: number;
  heatingTimeMinutes: number;
  dyeingCount: number;
  redyeCount: number;
  colorResult?: string;
  colorFastness?: number;
  process: DyeingProcess | string;
  notes?: string;
  isSuccess: boolean;
  isRework: boolean;
  reworkReason?: string;
  failureReason?: string;
  taskName?: string;
  operator?: string;
  createdAt: string;
  updatedAt: string;
  batchNumber?: string;
  rawMaterialSource?: string;
  batchCurrentPh?: number;
  batchFilterCount?: number;
}

export interface DyeingRecordCreateForm {
  batchId: string;
  dyeingDate?: string;
  fabricType: string;
  targetColor: string;
  dyeMaterial: string;
  mordantMethod: string;
  dyeConcentration: number;
  heatingTimeMinutes: number;
  dyeingCount?: number;
  process: string;
  notes?: string;
  taskName?: string;
  operator?: string;
  colorFastness?: number;
  colorResult?: string;
  isSuccess?: boolean;
  failureReason?: string;
  isRework?: boolean;
  reworkReason?: string;
  redyeCount?: number;
}

export interface DyeingRecordUpdateForm {
  batchId?: string;
  dyeingDate?: string;
  fabricType?: string;
  targetColor?: string;
  dyeMaterial?: string;
  mordantMethod?: string;
  dyeConcentration?: number;
  heatingTimeMinutes?: number;
  colorResult?: string;
  colorFastness?: number;
  process?: string;
  notes?: string;
  isSuccess?: boolean;
  isRework?: boolean;
  reworkReason?: string;
  failureReason?: string;
  redyeCount?: number;
  operator?: string;
  taskName?: string;
  dyeingCount?: number;
}

export interface ScoreItem {
  score: number;
  grade?: string;
  recordCount?: number;
  rawMaterialSource?: string;
  phRange?: string;
  filterRange?: string;
  type?: string;
  title?: string;
  content?: string | { score: number };
}

export interface AnalysisItem {
  key: string;
  label: string;
  recordCount: number;
  successRate: number;
  avgColorFastness: number;
  stdColorFastness?: number;
  avgRedyeCount?: number;
  avgPh?: number;
  avgFilterCount?: number;
  rawMaterialSource?: string;
  phRange?: string;
  filterRange?: string;
  score: number;
  grade?: string;
  content?: string | { score: number };
}

export interface SourceAnalysisResult {
  total: number;
  items: AnalysisItem[];
  groups: AnalysisItem[];
}

export interface PhRangeAnalysisResult {
  total: number;
  items: AnalysisItem[];
  groups: AnalysisItem[];
}

export interface FilterCountAnalysisResult {
  total: number;
  items: AnalysisItem[];
  groups: AnalysisItem[];
}

export interface RecommendationItem {
  type: string;
  title: string;
  content: string | { score: number; } | any;
  score?: number;
}

export interface OverviewStats {
  totalRecords: number;
  successRate: number;
  avgColorFastness: number;
  avgRedyeCount: number;
  topMaterials: string[];
}

export interface AnalysisGroupResult {
  groups: ScoreItem[];
}

export interface ComprehensiveAnalysisResult {
  totalRecords: number;
  successRate: number;
  avgColorFastness: number;
  topMaterials: string[];
  bestPhRange?: string;
  overview: OverviewStats;
  recommendations?: RecommendationItem[];
  byRawMaterial?: AnalysisGroupResult;
  byPhRange?: AnalysisGroupResult;
  items?: ScoreItem[];
}

export interface MaterialReworkItem {
  material: string;
  count: number;
  total: number;
  reworkCount: number;
  failureCount: number;
  reworkRate: number;
  failureRate: number;
  dyeMaterial?: string;
}

export interface ReworkStatisticsResult {
  totalRework: number;
  reworkRate: number;
  reasons: Record<string, number>;
  reworkReasons: any;
  failureReasons: any;
  byFabric: Record<string, number>;
  byMaterial: MaterialReworkItem[];
  byProcess: Record<string, number>;
  totalRecords?: number;
  reworkCount?: number;
  failureCount?: number;
  failureRate?: number;
}

export interface StabilityLevel {
  level: string;
  name: string;
  minRecords: number;
  consistencyThreshold: number;
}

export interface RecipeGroup {
  key: string;
  label: string;
  fabricType?: string;
  targetColor?: string;
  records: DyeingRecord[];
  sampleRecords?: DyeingRecord[];
  avgConcentration: number;
  avgHeatingTime: number;
  avgColorFastness: number;
  successRate: number;
  recordCount: number;
  stabilityLevel?: string;
  recommendation?: string;
  stabilityScore?: number;
  score?: number;
  reasons?: string[];
  avgRedyeCount?: number;
  batchNumber?: string;
  dyeMaterial?: string;
  mordantMethod?: string;
  dyeConcentration?: number;
  heatingTimeMinutes?: number;
  dyeingCount?: number;
}

export interface StabilityAnalysisResult {
  totalRecipes: number;
  stableCount: number;
  unstableCount: number;
  avgRecordCountPerRecipe: number;
  totalRecords: number;
  analyzedGroups: number;
  recipeGroups: RecipeGroup[];
  items: RecipeGroup[];
  recommendations: string[];
  message?: string;
}

export interface RecipeRecommendation {
  recipeKey: string;
  recipeLabel: string;
  key?: string;
  label?: string;
  score: number;
  stabilityScore?: number;
  avgColorFastness: number;
  avgRedyeCount?: number;
  successRate: number;
  recordCount: number;
  stabilityLevel?: string;
  reasons: string[];
  records?: DyeingRecord[];
  avgConcentration?: number;
  avgHeatingTime?: number;
  dyeConcentration?: number;
  heatingTimeMinutes?: number;
  dyeingCount?: number;
  batchNumber?: string;
  dyeMaterial?: string;
  mordantMethod?: string;
}

export interface ProcessOptimizationItem {
  parameter: string;
  current: string;
  suggestion: string;
  expectedBenefit: string;
}

export interface RecipeRecommendationResult {
  targetFabric?: FabricType;
  targetColor?: string;
  targetProcess?: DyeingProcess;
  hasRecommendation: boolean;
  bestRecipe?: RecipeRecommendation;
  recommendations: RecipeRecommendation[];
  alternatives: RecipeGroup[];
  redyeAdvice: string[];
  suggestions: string[];
  processOptimization: ProcessOptimizationItem[];
  message?: string;
  totalAvailable: number;
  advice: string[];
}

export interface ApiError {
  error: string;
  code: number;
  field?: string;
  rule?: string;
}
