export type BatchStatus = 'soaking' | 'filtering' | 'available' | 'not_applicable' | 'exhausted' | 'warning';

export type DyeingProcess = 'scouring' | 'mordanting' | 'dyeing' | 'fixing';

export type PhTrend = 'rising' | 'falling' | 'stable';

export type WarningType = 'consecutive_abnormal' | 'long_time_no_check' | 'ph_rising_rapidly' | 'ph_falling_rapidly' | 'usage_restricted' | 'excessive_filtering' | 'high_usage_frequency' | 'low_remaining_volume' | 'batch_expiring' | 'needs_recheck';

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
  rawMaterialSource?: string;
  batchCurrentPh?: number | null;
  batchFilterCount?: number;
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
  isSuccess: boolean;
  isRework: boolean;
  reworkReason?: string;
  failureReason?: string;
  taskName?: string;
  operator?: string;
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
  isSuccess?: boolean;
  isRework?: boolean;
  reworkReason?: string;
  failureReason?: string;
  taskName?: string;
  operator?: string;
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
  isSuccess?: boolean;
  isRework?: boolean;
  reworkReason?: string;
  failureReason?: string;
  taskName?: string;
  operator?: string;
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

export interface BatchTraceSummary {
  totalDyeingRecords: number;
  successCount: number;
  reworkCount: number;
  failureCount: number;
  successRate: number;
  avgColorFastness: number | null;
  stdColorFastness: number;
  avgRedyeCount: number;
  totalUsedVolume: number;
  remainingVolume: number;
  phRecordCount: number;
  filterRecordCount: number;
  usageRecordCount: number;
}

export interface BatchTraceStats {
  dyeMaterials: Record<string, number>;
  mordantMethods: Record<string, number>;
  fabricTypes: Record<string, number>;
}

export interface BatchTraceChain {
  batch: AshWaterBatch;
  summary: BatchTraceSummary;
  stats: BatchTraceStats;
  phRecords: PhRecord[];
  filterRecords: FilterRecord[];
  usageRecords: UsageRecord[];
  dyeingRecords: DyeingRecord[];
}

export interface TopItemStat {
  item: string;
  count: number;
}

export interface SourceAnalysisGroup {
  rawMaterialSource: string;
  recordCount: number;
  successCount: number;
  reworkCount: number;
  failureCount: number;
  successRate: number;
  avgColorFastness: number | null;
  stdColorFastness: number;
  avgRedyeCount: number;
  score: number;
  grade: StabilityLevel;
  topDyeMaterials: TopItemStat[];
  topMordantMethods: TopItemStat[];
}

export interface SourceAnalysisResult {
  totalRecords: number;
  sourceCount: number;
  groups: SourceAnalysisGroup[];
}

export interface PhRangeAnalysisGroup {
  phRange: string;
  phMin: number;
  phMax: number;
  avgPh: number;
  recordCount: number;
  successCount: number;
  reworkCount: number;
  failureCount: number;
  successRate: number;
  avgColorFastness: number | null;
  stdColorFastness: number;
  avgRedyeCount: number;
  score: number;
  grade: StabilityLevel;
}

export interface PhRangeAnalysisResult {
  totalRecords: number;
  rangeCount: number;
  groups: PhRangeAnalysisGroup[];
}

export interface FilterCountAnalysisGroup {
  filterRange: string;
  filterMin: number;
  filterMax: number;
  avgFilterCount: number;
  recordCount: number;
  successCount: number;
  reworkCount: number;
  failureCount: number;
  successRate: number;
  avgColorFastness: number | null;
  stdColorFastness: number;
  avgRedyeCount: number;
  score: number;
  grade: StabilityLevel;
}

export interface FilterCountAnalysisResult {
  totalRecords: number;
  rangeCount: number;
  groups: FilterCountAnalysisGroup[];
}

export interface AnalysisRecommendation {
  type: string;
  title: string;
  content: string;
  score: number;
}

export interface ComprehensiveAnalysisOverview {
  totalRecords: number;
  successCount: number;
  reworkCount: number;
  failureCount: number;
  successRate: number;
  avgColorFastness: number | null;
  avgRedyeCount: number;
}

export interface ComprehensiveAnalysisResult {
  overview: ComprehensiveAnalysisOverview;
  byRawMaterial: SourceAnalysisResult;
  byPhRange: PhRangeAnalysisResult;
  byFilterCount: FilterCountAnalysisResult;
  recommendations: AnalysisRecommendation[];
}

export interface ReworkStatisticsResult {
  totalRecords: number;
  reworkCount: number;
  failureCount: number;
  reworkRate: number;
  failureRate: number;
  reworkReasons: Record<string, number>;
  failureReasons: Record<string, number>;
  byMaterial: {
    dyeMaterial: string;
    total: number;
    reworkCount: number;
    failureCount: number;
    reworkRate: number;
    failureRate: number;
  }[];
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

export interface ProcessScoreDetail {
  score: number;
  inRange: boolean;
  reasons: string[];
  minPh: number;
  maxPh: number;
  processName: string;
}

export interface RecommendedBatchItem {
  batch: AshWaterBatch;
  remainingVolume: number;
  remainingPercent: number;
  totalUsed: number;
  usageCount: number;
  ageDays: number;
  overallScore: number;
  finalScore: number;
  processScores: Record<string, ProcessScoreDetail>;
  processRecommendation: ProcessScoreDetail | null;
  trendAnalysis?: TrendAnalysis;
  warnings: WarningResult;
  recommendations: RecommendationResult;
  isRecommended: boolean;
}

export interface BatchRecommendationResult {
  process: DyeingProcess | null;
  processName: string | null;
  fabricType: FabricType | null;
  targetPhRange: [number, number] | null;
  recommended: RecommendedBatchItem[];
  notRecommended: RecommendedBatchItem[];
  totalAvailable: number;
  totalRecommended: number;
  advice: string[];
  generatedAt: string;
}
