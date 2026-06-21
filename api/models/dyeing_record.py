from datetime import datetime
from .database import db
import json

class DyeingRecord(db.Model):
    __tablename__ = 'dyeing_record'

    id = db.Column(db.String(50), primary_key=True)
    batch_id = db.Column(db.String(50), db.ForeignKey('ash_water_batch.id', ondelete='CASCADE'), nullable=False)
    dyeing_date = db.Column(db.DateTime, nullable=False, default=datetime.now)
    fabric_type = db.Column(db.String(100), nullable=False)
    target_color = db.Column(db.String(100), nullable=False)
    dye_material = db.Column(db.String(100), nullable=False)
    mordant_method = db.Column(db.String(100), nullable=False)
    dye_concentration = db.Column(db.Float, nullable=False)
    heating_time_minutes = db.Column(db.Integer, nullable=False)
    dyeing_count = db.Column(db.Integer, nullable=False, default=1)
    redye_count = db.Column(db.Integer, nullable=False, default=0)
    color_result = db.Column(db.String(100))
    color_fastness = db.Column(db.Integer)
    process = db.Column(db.String(50), nullable=False)
    notes = db.Column(db.Text)
    is_success = db.Column(db.Boolean, default=True)
    is_rework = db.Column(db.Boolean, default=False)
    rework_reason = db.Column(db.String(200))
    failure_reason = db.Column(db.String(200))
    task_name = db.Column(db.String(100))
    operator = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    def to_dict(self):
        return {
            'id': self.id,
            'batchId': self.batch_id,
            'dyeingDate': self.dyeing_date.isoformat() if self.dyeing_date else None,
            'fabricType': self.fabric_type,
            'targetColor': self.target_color,
            'dyeMaterial': self.dye_material,
            'mordantMethod': self.mordant_method,
            'dyeConcentration': self.dye_concentration,
            'heatingTimeMinutes': self.heating_time_minutes,
            'dyeingCount': self.dyeing_count,
            'redyeCount': self.redye_count,
            'colorResult': self.color_result,
            'colorFastness': self.color_fastness,
            'process': self.process,
            'notes': self.notes,
            'isSuccess': self.is_success if self.is_success is not None else True,
            'isRework': self.is_rework if self.is_rework is not None else False,
            'reworkReason': self.rework_reason,
            'failureReason': self.failure_reason,
            'taskName': self.task_name,
            'operator': self.operator,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            'batchNumber': self.batch.batch_number if self.batch else None,
            'rawMaterialSource': self.batch.raw_material_source if self.batch else None,
            'batchCurrentPh': self.batch.current_ph if self.batch else None,
            'batchFilterCount': self.batch.filter_count if self.batch else None,
        }
