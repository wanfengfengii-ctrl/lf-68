from datetime import datetime
from .database import db

class PhRecord(db.Model):
    __tablename__ = 'ph_record'

    id = db.Column(db.String(50), primary_key=True)
    batch_id = db.Column(db.String(50), db.ForeignKey('ash_water_batch.id', ondelete='CASCADE'), nullable=False)
    ph_value = db.Column(db.Float, nullable=False)
    measured_at = db.Column(db.DateTime, nullable=False, default=datetime.now)
    measured_by = db.Column(db.String(100))
    notes = db.Column(db.Text)

    def to_dict(self):
        return {
            'id': self.id,
            'batchId': self.batch_id,
            'phValue': self.ph_value,
            'measuredAt': self.measured_at.isoformat() if self.measured_at else None,
            'measuredBy': self.measured_by,
            'notes': self.notes
        }
