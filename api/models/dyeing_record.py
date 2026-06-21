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
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            'batchNumber': self.batch.batch_number if self.batch else None,
        }
