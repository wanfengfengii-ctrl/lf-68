from datetime import datetime
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List
from api.config import Config

class BatchCreate(BaseModel):
    batchNumber: str = Field(..., min_length=1, max_length=50, description='批次编号')
    rawMaterialSource: str = Field(..., min_length=1, max_length=200, description='原料来源')
    ashWeight: float = Field(..., gt=0, description='草木灰重量(kg)')
    waterVolume: float = Field(..., gt=0, description='水量(L)')
    soakStartDate: str = Field(..., description='浸泡开始日期')
    soakDurationHours: int = Field(..., ge=Config.MIN_SOAK_DURATION_HOURS, description='浸泡时长(小时)')
    soakTemperature: Optional[float] = Field(None, description='浸泡温度(°C)')
    currentPh: Optional[float] = Field(None, ge=Config.PH_MIN, le=Config.PH_MAX, description='当前PH值')

    @field_validator('soakStartDate')
    def parse_soak_date(cls, v):
        try:
            return datetime.fromisoformat(v.replace('Z', '+00:00'))
        except ValueError:
            raise ValueError('日期格式不正确，请使用ISO格式')

    @field_validator('soakDurationHours')
    def check_duration(cls, v):
        if v <= 0:
            raise ValueError('浸泡时间必须大于0小时')
        return v

class BatchUpdate(BaseModel):
    rawMaterialSource: Optional[str] = Field(None, min_length=1, max_length=200)
    ashWeight: Optional[float] = Field(None, gt=0)
    waterVolume: Optional[float] = Field(None, gt=0)
    soakStartDate: Optional[str] = None
    soakDurationHours: Optional[int] = Field(None, ge=Config.MIN_SOAK_DURATION_HOURS)
    soakTemperature: Optional[float] = None
    currentPh: Optional[float] = Field(None, ge=Config.PH_MIN, le=Config.PH_MAX)
    status: Optional[str] = None
    isApplicable: Optional[bool] = None
    applicableProcesses: Optional[List[str]] = None

    @field_validator('soakStartDate')
    def parse_soak_date(cls, v):
        if v is None:
            return v
        try:
            return datetime.fromisoformat(v.replace('Z', '+00:00'))
        except ValueError:
            raise ValueError('日期格式不正确')

class PhRecordCreate(BaseModel):
    phValue: float = Field(..., ge=Config.PH_MIN, le=Config.PH_MAX, description='PH值')
    measuredAt: Optional[str] = None
    measuredBy: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None

    @field_validator('phValue')
    def check_ph_range(cls, v):
        if v < Config.PH_MIN or v > Config.PH_MAX:
            raise ValueError(f'PH值必须在{Config.PH_MIN}-{Config.PH_MAX}之间')
        return v

    @field_validator('measuredAt')
    def parse_measure_date(cls, v):
        if v is None:
            return datetime.now()
        try:
            return datetime.fromisoformat(v.replace('Z', '+00:00'))
        except ValueError:
            raise ValueError('日期格式不正确')

class FilterRecordCreate(BaseModel):
    filterDate: str = Field(..., description='过滤日期')
    filterMethod: Optional[str] = Field(None, max_length=100)
    filterCount: int = Field(..., ge=1, description='过滤次数')
    notes: Optional[str] = None

    @field_validator('filterDate')
    def parse_filter_date(cls, v):
        try:
            return datetime.fromisoformat(v.replace('Z', '+00:00'))
        except ValueError:
            raise ValueError('日期格式不正确')

class UsageRecordCreate(BaseModel):
    usageDate: Optional[str] = None
    process: str = Field(..., description='染色工序')
    volumeUsed: float = Field(..., gt=0, description='使用量(L)')
    usedBy: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None

    @field_validator('process')
    def validate_process(cls, v):
        valid_processes = list(Config.PROCESS_PH_RANGES.keys())
        if v not in valid_processes:
            raise ValueError(f'工序必须是: {", ".join(valid_processes)}')
        return v

    @field_validator('usageDate')
    def parse_usage_date(cls, v):
        if v is None:
            return datetime.now()
        try:
            return datetime.fromisoformat(v.replace('Z', '+00:00'))
        except ValueError:
            raise ValueError('日期格式不正确')
