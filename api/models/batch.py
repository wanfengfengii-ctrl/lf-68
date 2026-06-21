from datetime import datetime
from .database import db
import json

class AshWaterBatch(db.Model):
    __tablename__ = 'ash_water_batch'

    id = db.Column(db.String(50), primary_key=True)
    batch_number = db.Column(db.String(50), unique=True, nullable=False)
    raw_material_source = db.Column(db.String(200), nullable=False)
    ash_weight = db.Column(db.Float, nullable=False)
    water_volume = db.Column(db.Float, nullable=False)
    soak_start_date = db.Column(db.DateTime, nullable=False)
    soak_duration_hours = db.Column(db.Integer, nullable=False)
    soak_temperature = db.Column(db.Float)
    current_ph = db.Column(db.Float)
    filter_count = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), nullable=False, default='soaking')
    is_applicable = db.Column(db.Boolean, default=True)
    _applicable_processes = db.Column('applicable_processes', db.Text, default='[]')
    has_warning = db.Column(db.Boolean, default=False)
    usage_restricted = db.Column(db.Boolean, default=False)
    _warning_types = db.Column('warning_types', db.Text, default='[]')
    _warning_level = db.Column('warning_level', db.String(20))
    last_warning_time = db.Column(db.DateTime)
    last_ph_check_time = db.Column(db.DateTime)
    _ph_trend = db.Column('ph_trend', db.String(20), default='stable')
    ph_change_rate = db.Column(db.Float, default=0.0)
    consecutive_abnormal_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    ph_records = db.relationship('PhRecord', backref='batch', cascade='all, delete-orphan', lazy=True)
    filter_records = db.relationship('FilterRecord', backref='batch', cascade='all, delete-orphan', lazy=True)
    usage_records = db.relationship('UsageRecord', backref='batch', cascade='all, delete-orphan', lazy=True)
    dyeing_records = db.relationship('DyeingRecord', backref='batch', cascade='all, delete-orphan', lazy=True)

    @property
    def applicable_processes(self):
        return json.loads(self._applicable_processes) if self._applicable_processes else []

    @applicable_processes.setter
    def applicable_processes(self, value):
        self._applicable_processes = json.dumps(value, ensure_ascii=False) if value else '[]'

    @property
    def warning_types(self):
        return json.loads(self._warning_types) if self._warning_types else []

    @warning_types.setter
    def warning_types(self, value):
        self._warning_types = json.dumps(value, ensure_ascii=False) if value else '[]'

    @property
    def warning_level(self):
        return self._warning_level

    @warning_level.setter
    def warning_level(self, value):
        self._warning_level = value

    @property
    def ph_trend(self):
        return self._ph_trend

    @ph_trend.setter
    def ph_trend(self, value):
        self._ph_trend = value

    def to_dict(self):
        return {
            'id': self.id,
            'batchNumber': self.batch_number,
            'rawMaterialSource': self.raw_material_source,
            'ashWeight': self.ash_weight,
            'waterVolume': self.water_volume,
            'soakStartDate': self.soak_start_date.isoformat() if self.soak_start_date else None,
            'soakDurationHours': self.soak_duration_hours,
            'soakTemperature': self.soak_temperature,
            'currentPh': self.current_ph,
            'filterCount': self.filter_count,
            'status': self.status,
            'isApplicable': self.is_applicable,
            'applicableProcesses': self.applicable_processes,
            'hasWarning': self.has_warning,
            'usageRestricted': self.usage_restricted,
            'warningTypes': self.warning_types,
            'warningLevel': self.warning_level,
            'lastWarningTime': self.last_warning_time.isoformat() if self.last_warning_time else None,
            'lastPhCheckTime': self.last_ph_check_time.isoformat() if self.last_ph_check_time else None,
            'phTrend': self.ph_trend,
            'phChangeRate': self.ph_change_rate,
            'consecutiveAbnormalCount': self.consecutive_abnormal_count,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }
