from datetime import datetime
from .database import db

class UsageRecord(db.Model):
    __tablename__ = 'usage_record'

    id = db.Column(db.String(50), primary_key=True)
    batch_id = db.Column(db.String(50), db.ForeignKey('ash_water_batch.id', ondelete='CASCADE'), nullable=False)
    usage_date = db.Column(db.DateTime, nullable=False, default=datetime.now)
    process = db.Column(db.String(50), nullable=False)
    volume_used = db.Column(db.Float, nullable=False)
    used_by = db.Column(db.String(100))
    notes = db.Column(db.Text)

    def to_dict(self):
        return {
            'id': self.id,
            'batchId': self.batch_id,
            'usageDate': self.usage_date.isoformat() if self.usage_date else None,
            'process': self.process,
            'volumeUsed': self.volume_used,
            'usedBy': self.used_by,
            'notes': self.notes
        }
